import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Award,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Check,
  Sparkles,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'

import RankingCriteriaModel from '../../../models/RankingCriteriaModel.js'
import { localToday } from '../../../utils/employmentDate'
import SecurityController from '../../../controllers/SecurityController.js'
import OcrScanController from '../../../controllers/OcrScanController.js'
import PersonnelAchievementController from '../../../controllers/PersonnelAchievementController.js'
import { confirmDialog } from '../../../components/ui/DialogProvider'
import { CardHeading, StepProgress } from './AccomplishmentModalParts'
import { NTP_ENTRY_CRITERIA, ntpCategoryLabel, ntpContractCode, ntpCriterionByCode, ntpDetailText, resolveNtpCriterion } from '../../../config/nonTeachingPortfolioSchema'
import { useHelpGuide } from '../../../context/HelpGuideContext'

// Helper component for required field labels (Clean Auto-filled badge when OCR populated)
const ReqLabel = ({ label, value, isOcrAutoFilled, isManuallyEdited, ocrConfidence = null }) => {
  const isFilled = value !== undefined && value !== null && String(value).trim() !== ''
  return (
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
      <span className="flex items-center gap-1.5">
        <span>{label}</span>
        {isOcrAutoFilled && !isManuallyEdited && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200" title="Auto-filled from certificate text via AchieveNest OCR Engine">
            Auto-filled{ocrConfidence !== null ? ` • ${ocrConfidence}%` : ''}
          </span>
        )}
        {isManuallyEdited && isFilled && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200" title="Manually edited by Personnel">
            Manual
          </span>
        )}
      </span>
      {isFilled ? (
        <span className="text-[#16834a] text-[11px] font-bold flex items-center gap-0.5" title="Field Completed">
          <Check className="w-3.5 h-3.5 text-[#16834a] stroke-[3]" />
        </span>
      ) : (
        <span className="text-slate-400 font-normal text-xs" title="Required Field">*</span>
      )}
    </label>
  )
}

// Official Non-Teaching Personnel criteria (Appendix N). Area A is rated by HR; B.3 comes from the employment record.
const AREA_CATEGORY_OPTIONS = Object.freeze({
  B: NTP_ENTRY_CRITERIA.map((criterion) => [ntpCategoryLabel(criterion), ntpCategoryLabel(criterion)])
})

const normalizeEntryArea = () => 'B'

const categoryBelongsToArea = (category) => AREA_CATEGORY_OPTIONS.B.some(([value]) => value === category)

/** Any stored or suggested category (including older labels) mapped onto an Appendix N option. */
const categoryForArea = (candidate) => {
  if (categoryBelongsToArea(candidate)) return candidate
  const criterion = ntpCriterionByCode(resolveNtpCriterion({ category: candidate }))
  return criterion ? ntpCategoryLabel(criterion) : AREA_CATEGORY_OPTIONS.B[0][0]
}

const criterionForCategory = (category) => ntpCriterionByCode(String(category || '').split(' ')[0])

const evidenceListOf = (item) => {
  const data = typeof item?.toJSON === 'function' ? item.toJSON() : (item || {})
  return [...(Array.isArray(data.evidence) ? data.evidence : []), data.primary_evidence].filter(Boolean)
}

/** The accomplishment (other than excludeId) whose evidence has this SHA-256, if any. */
export function findAccomplishmentWithDocument(achievements = [], sha256, excludeId = null) {
  if (!sha256) return null
  return achievements.find(item => item && item.id !== excludeId
    && evidenceListOf(item).some(evidence => String(evidence.sha256 || evidence.checksum || '').toLowerCase() === sha256)) || null
}

export default function PersonnelSubmissionModal({
  isOpen,
  onClose,
  onSubmitAccomplishment,
  initialCategory = '',
  editingItem = null,
  existingAchievements = [],
  areaCode = 'B',
  areaName = '',
  presentation = 'modal'
}) {
  const { openHelpGuide } = useHelpGuide()
  const lockedAreaCode = normalizeEntryArea(areaCode)
  const isPage = presentation === 'page'
  // Helper for Academic Year Infer
  const inferAcademicYear = (dateStr) => {
    if (!dateStr || String(dateStr).trim() === '') return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = d.getMonth() + 1 // 1..12
    const startYear = month >= 6 ? year : year - 1
    return `AY ${startYear}-${startYear + 1}`
  }

  // Active Category State
  const [category, setCategory] = useState(() => categoryForArea(initialCategory, lockedAreaCode))
  const [dateAchieved, setDateAchieved] = useState('')
  const [academicYear, setAcademicYear] = useState('')

  // Appendix N details for the selected criterion (keys come from nonTeachingPortfolioSchema)
  const [details, setDetails] = useState({})
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [ongoing, setOngoing] = useState(false)
  const [scopeLevel, setScopeLevel] = useState('')
  const activeCriterion = criterionForCategory(category)
  const setDetail = (name, value) => { setDetails((current) => ({ ...current, [name]: value })); markFieldEdited(name) }

  const [description, setDescription] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)

  // Tracking Manual Modifications (Manual overrides OCR and is never silently overwritten)
  const [manuallyEdited, setManuallyEdited] = useState({})

  // System States & Security
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // OCR Document Scan States
  const [isScanning, setIsScanning] = useState(false)
  const [ocrResult, setOcrResult] = useState(null)
  const [ocrBadges, setOcrBadges] = useState({})
  const [isScanModeActive, setIsScanModeActive] = useState(true)
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  // Local preview of the chosen proof (left pane), same as the Faculty modal.
  useEffect(() => {
    if (!attachedFile || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') { setPreviewUrl(''); return undefined }
    const url = URL.createObjectURL(attachedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [attachedFile])

  // Same document already backing another accomplishment? Checked as soon as a file is chosen
  // (the server enforces the same rule on upload).
  const [fileHash, setFileHash] = useState('')
  useEffect(() => {
    let active = true
    setFileHash('')
    if (!attachedFile || typeof crypto === 'undefined' || !crypto.subtle || typeof attachedFile.arrayBuffer !== 'function') return undefined
    attachedFile.arrayBuffer()
      .then(buffer => crypto.subtle.digest('SHA-256', buffer))
      .then(digest => { if (active) setFileHash(Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')) })
      .catch(() => {})
    return () => { active = false }
  }, [attachedFile])
  const documentDuplicate = findAccomplishmentWithDocument(existingAchievements, fileHash, editingItem?.id)

  useEffect(() => {
    if (editingItem) {
      setCategory(categoryForArea(editingItem.category, lockedAreaCode))
      setDateAchieved(editingItem.date_achieved || '')
      setAcademicYear(editingItem.academic_year || inferAcademicYear(editingItem.date_achieved))
      setDescription(editingItem.description || '')
      setScopeLevel(editingItem.scope_level || '')
      const meta = editingItem.category_metadata || {}
      setDetails(meta.details && typeof meta.details === 'object' ? meta.details : {})
      setStartDate(meta.start_date || '')
      setEndDate(meta.end_date || '')
      setOngoing(meta.ongoing === true)
    } else if (initialCategory) {
      setCategory(categoryForArea(initialCategory, lockedAreaCode))
    } else {
      setCategory(categoryForArea('', lockedAreaCode))
    }
  }, [initialCategory, editingItem, lockedAreaCode])

  // Helper to mark a field as manually edited
  const markFieldEdited = (fieldName) => {
    setManuallyEdited(prev => ({ ...prev, [fieldName]: true }))
    setOcrBadges(prev => ({ ...prev, [fieldName]: false }))
  }

  // Sync Academic Year automatically on Date Achieved change
  const handleDateChange = (e) => {
    const d = e.target.value
    setDateAchieved(d)
    setAcademicYear(inferAcademicYear(d))
    markFieldEdited('dateAchieved')
  }

  const handleCategoryChange = (nextCategory) => {
    if (!categoryBelongsToArea(nextCategory)) return
    setCategory(nextCategory)
    markFieldEdited('category')
  }

  // Perform Intelligent Document Scan & Auto-Fill
  const performOcrScan = async (fileToScan) => {
    if (!fileToScan) return
    setIsScanning(true)
    setError('')
    try {
      const response = await OcrScanController.processDocumentScan(fileToScan)
      setIsScanning(false)
      if (response.success && response.result) {
        const res = response.result
        setOcrResult(res)
        const fields = res.extractedFields

        // 1. Suggested category, mapped onto Appendix N (only if the user hasn't chosen one)
        const suggestedCriterion = ntpCriterionByCode(resolveNtpCriterion({ category: res.detectedCategory || '' }))
        const suggestedCategory = suggestedCriterion ? ntpCategoryLabel(suggestedCriterion) : null
        if (suggestedCategory && !manuallyEdited.category) setCategory(suggestedCategory)

        const newBadges = { category: !manuallyEdited.category && Boolean(suggestedCategory) }
        const criterionToFill = (!manuallyEdited.category && suggestedCriterion) || criterionForCategory(category)

        // 2. Date (start date for period criteria)
        if (fields.date) {
          if (criterionToFill?.dateMode === 'period' && !manuallyEdited.startDate) { setStartDate(fields.date); newBadges.startDate = true }
          if (!manuallyEdited.dateAchieved) { setDateAchieved(fields.date); setAcademicYear(fields.academicYear); newBadges.dateAchieved = true }
        }

        // 3. Main detail ← document title; organizer / issuer ← issuing body; role ← detected role
        if (criterionToFill) {
          const fill = {}
          const free = criterionToFill.fields.filter((definition) => definition.type !== 'select')
          const primary = criterionToFill.primary
          const organizerField = free.find((definition) => definition.name !== primary)
          if (fields.title && !manuallyEdited[primary]) { fill[primary] = fields.title; newBadges[primary] = true }
          if (fields.issuer && organizerField && !manuallyEdited[organizerField.name]) { fill[organizerField.name] = fields.issuer; newBadges[organizerField.name] = true }
          const roleField = criterionToFill.fields.find((definition) => definition.type === 'select')
          const detectedRole = String(fields.specificRole || '').toUpperCase().replace(/[\s-]+/g, '_')
          const roleOption = roleField?.options.find(([value, label]) => detectedRole.includes(value) || detectedRole.includes(label.toUpperCase()))
          if (roleOption && !manuallyEdited[roleField.name]) { fill[roleField.name] = roleOption[0]; newBadges[roleField.name] = true }
          if (Object.keys(fill).length) setDetails((current) => ({ ...current, ...fill }))
        }

        setOcrBadges(newBadges)
      } else {
        setError(response.error || 'Failed to scan document.')
      }
    } catch (err) {
      setIsScanning(false)
      setError('OCR processing error. Please check document readability.')
    }
  }

  if (!isOpen) return null

  const requiredProofHint = RankingCriteriaModel.getRequiredProofType('B', category, '')
  const ocrFieldSummary = Object.values(ocrResult?.fields || {}).reduce((summary, field) => {
    const confidence = Number(field?.confidence || 0)
    if (field?.value && confidence >= 85) summary.autoFilled += 1
    else if (field?.value && confidence >= 60) summary.needsReview += 1
    else summary.manual += 1
    return summary
  }, { autoFilled: 0, needsReview: 0, manual: 0 })

  // Enhanced Security File Upload & Automatic OCR Trigger
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setError('')
      const validation = await SecurityController.validateFileUpload(file)
      if (!validation.isValid) {
        setError(validation.error)
        setAttachedFile(null)
        e.target.value = ''
        return
      }
      const sanitizedName = SecurityController.sanitizeFilename(file.name)
      const cleanFile = new File([file], sanitizedName, { type: file.type })
      setAttachedFile(cleanFile)

      // Automatic OCR Scan Trigger if Scan mode is active
      if (isScanModeActive) {
        await performOcrScan(cleanFile)
      }
    }
  }

  // Extract Normalized Title & Issuer based on Category
  const getNormalizedTitleAndIssuer = () => {
    if (!activeCriterion) return { title: '', issuer: '' }
    return {
      title: ntpDetailText(activeCriterion, details, activeCriterion.primary),
      issuer: activeCriterion.secondary.map((name) => ntpDetailText(activeCriterion, details, name)).filter(Boolean).join(' · ')
    }
  }

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (documentDuplicate) {
      setError(`This document is already used for "${documentDuplicate.title || 'another accomplishment'}". Choose a different file.`)
      return
    }

    const { title: resolvedTitle, issuer: resolvedIssuer } = getNormalizedTitleAndIssuer()

    const missing = (activeCriterion?.fields || []).filter((definition) => definition.required !== false && !String(details[definition.name] || '').trim())
    if (!activeCriterion || missing.length) {
      setError(`Please complete: ${missing.map((definition) => definition.label).join(', ') || 'the category details'}.`)
      return
    }
    if (!resolvedTitle.trim() || resolvedTitle.trim().length < 3) {
      setError(`${activeCriterion.fields.find((definition) => definition.name === activeCriterion.primary)?.label || 'The main detail'} must be at least 3 characters.`)
      return
    }
    const isPeriod = activeCriterion.dateMode === 'period'
    const effectiveDate = isPeriod ? startDate : dateAchieved
    if (!effectiveDate) { setError(isPeriod ? 'Enter the start date.' : 'Enter the date of the accomplishment.'); return }
    if (isPeriod && !ongoing && !endDate) { setError('Enter the end date, or mark it as ongoing.'); return }
    if (isPeriod && endDate && endDate < startDate) { setError('The end date cannot be before the start date.'); return }
    if (!attachedFile && !editingItem) {
      setError('Supporting Proof Document attachment (PDF/JPG/PNG) is required.')
      return
    }

    try {
      setIsSubmitting(true)
      const formattedDate = effectiveDate ? new Date(effectiveDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : ''

      const newEntry = {
        title: resolvedTitle.trim(),
        issuer: resolvedIssuer.trim(),
        location: resolvedIssuer.trim(),
        date: formattedDate || effectiveDate,
        date_achieved: effectiveDate,
        academic_year: inferAcademicYear(effectiveDate),
        category: category,
        scope_level: scopeLevel,
        // Official Appendix N contract: the server validates it and maps it to the locked criteria.
        category_metadata: {
          portfolio_format: 'non_teaching_faculty',
          contract_code: ntpContractCode(activeCriterion.code),
          criterion_code: activeCriterion.code,
          subcategory_code: activeCriterion.code,
          date_mode: isPeriod ? 'period' : 'single',
          start_date: isPeriod ? startDate : effectiveDate,
          end_date: isPeriod ? (ongoing ? '' : endDate) : effectiveDate,
          ongoing: isPeriod && activeCriterion.allowOngoing ? ongoing : false,
          details: Object.fromEntries(activeCriterion.fields.map((definition) => [definition.name, String(details[definition.name] || '').trim()]).filter(([, value]) => value))
        },
        status: 'Pending Review',
        description: description.trim(),
        ocr_metadata: ocrResult ? {
          extracted_category: ocrResult.detectedCategory,
          confidence_score: ocrResult.confidenceScore,
          matched_keywords: ocrResult.matchedKeywords,
          fields: ocrResult.fields,
          warnings: ocrResult.extractionWarnings
        } : null
      }

      if (onSubmitAccomplishment) {
        await onSubmitAccomplishment(newEntry, attachedFile)
      }

      setIsSubmitting(false)
      onClose()
    } catch (err) {
      setIsSubmitting(false)
      console.error('Submission error:', err)
      setError(err?.message || err?.error?.message || 'Failed to submit accomplishment. Please try again.')
    }
  }

  const pickFile = (file) => { if (file) handleFileChange({ target: { files: [file], value: '' } }) }
  const requestClose = async () => {
    if (isSubmitting) return
    if (attachedFile && !editingItem && !(await confirmDialog({ title: 'Discard this accomplishment?', message: 'You have unsaved changes. If you close now, the uploaded document and details you entered will be lost.', confirmLabel: 'Discard', cancelLabel: 'Keep editing', tone: 'destructive' }))) return
    onClose()
  }
  const titleDuplicate = editingItem ? null : (() => {
    const { title: curTitle, issuer: curIssuer } = getNormalizedTitleAndIssuer()
    const dup = PersonnelAchievementController.checkDuplicateWarning({ title: curTitle, date_achieved: dateAchieved, issuer: curIssuer }, existingAchievements)
    return dup.isDuplicate ? dup.warningMessage : null
  })()
  const submitBlocker = documentDuplicate
    ? `This document is already used for "${documentDuplicate.title || 'another accomplishment'}". Each document can support only one accomplishment — choose a different file.`
    : titleDuplicate ? `${titleDuplicate} Open the existing record instead of adding it again.` : null
  const hasDocument = Boolean(attachedFile || editingItem)
  const step = !hasDocument ? 1 : !dateAchieved ? 2 : 3
  const chipState = (n) => n === step ? 'active' : n < step ? 'done' : 'todo'
  const footerStatus = isSubmitting ? { tone: 'bg-amber-500', text: 'Saving accomplishment…' }
    : submitBlocker ? { tone: 'bg-rose-500', text: 'Duplicate — cannot be added' }
    : isScanning ? { tone: 'bg-amber-500', text: 'Reading your document…' }
      : !hasDocument ? { tone: 'bg-slate-400', text: 'Upload a document to begin' }
        : !dateAchieved ? { tone: 'bg-amber-500', text: 'Add the date achieved to continue' }
          : { tone: 'bg-emerald-600', text: 'Ready to add' }
  const isImagePreview = Boolean(previewUrl && attachedFile?.type?.startsWith('image/'))
  const isPdfPreview = Boolean(previewUrl && attachedFile?.type === 'application/pdf')
  const fileExtension = String(attachedFile?.name || editingItem?.attached_file_name || 'file').split('.').pop().slice(0, 4)

  return (
    <div className={isPage
      ? 'mx-auto w-full max-w-6xl font-sans'
      : 'fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-0 font-sans min-[820px]:p-6'}>
      <section
        role={isPage ? undefined : 'dialog'}
        aria-modal={isPage ? undefined : 'true'}
        aria-labelledby="ntp-entry-title"
        onKeyDown={(event) => { if (!isPage && event.key === 'Escape') { event.stopPropagation(); requestClose() } }}
        className={isPage
          ? 'flex min-h-[calc(100vh-8rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfcf8] shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)]'
          : 'flex h-full w-full flex-col overflow-hidden bg-[#fbfcf8] shadow-[0_24px_70px_-24px_rgba(15,23,42,.55)] min-[820px]:h-[min(760px,calc(100vh-48px))] min-[820px]:w-[1100px] min-[820px]:max-w-full min-[820px]:rounded-2xl'}>

        {/* ================= HEADER (matches the Faculty accomplishment modal) ================= */}
        <header className="shrink-0 bg-emerald-950 px-5 py-3.5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {isPage
                ? <button type="button" onClick={requestClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Back to portfolio"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
                : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10"><Award className="h-5 w-5" aria-hidden="true" /></span>}
              <div className="min-w-0">
                <h2 id="ntp-entry-title" className="text-lg font-extrabold tracking-[-0.02em]">{editingItem ? 'Edit Accomplishment' : 'New Accomplishment'}</h2>
                <p className="truncate text-sm text-emerald-50/90">{/^area\b/i.test(areaName || '') ? areaName : `Area ${lockedAreaCode} · ${areaName || 'Service & Leadership'}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StepProgress chipState={chipState} />
              {!isPage && <button type="button" onClick={requestClose} className="rounded-lg p-2 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close accomplishment form"><X className="h-5 w-5" /></button>}
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col text-xs">
          <div className="min-h-0 flex-1 overflow-y-auto min-[820px]:grid min-[820px]:grid-cols-[46fr_54fr] min-[820px]:overflow-hidden">

            {/* LEFT: the document */}
            <div className="flex h-[22rem] min-h-0 flex-col border-b border-slate-200 bg-slate-100 min-[820px]:h-auto min-[820px]:border-b-0 min-[820px]:border-r">
              {isImagePreview
                ? <div className="flex min-h-0 flex-1 items-center justify-center p-4"><img src={previewUrl} alt={`Preview of ${attachedFile.name}`} className="max-h-full max-w-full rounded-lg object-contain shadow-sm" /></div>
                : isPdfPreview
                  ? <iframe src={previewUrl} title={`Preview of ${attachedFile.name}`} className="min-h-0 w-full flex-1 bg-white" />
                  : hasDocument
                    ? <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center"><FileText className="h-10 w-10 text-emerald-800" aria-hidden="true" /><p className="text-sm font-bold text-slate-900">{attachedFile?.name || editingItem?.attached_file_name || 'Saved proof document'}</p><p className="text-xs text-slate-600">{attachedFile ? 'Preview is not available for this file type.' : 'The saved proof stays attached unless you replace it.'}</p></div>
                    : <div className="flex flex-1 p-4 min-[820px]:p-5"><button type="button" onClick={() => fileInputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); setDragActive(false); pickFile(event.dataTransfer.files?.[0]) }} className={`flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${dragActive ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-white hover:border-emerald-600 hover:bg-emerald-50/40'}`}>
                      <UploadCloud className="h-10 w-10 text-emerald-800" aria-hidden="true" />
                      <span className="mt-3 text-base font-extrabold text-slate-950">Drop your certificate here</span>
                      <span className="mt-1 text-sm text-slate-700">or <span className="font-bold text-emerald-800 underline underline-offset-2">browse files</span></span>
                      <span className="mt-4 text-xs text-slate-600">PDF, JPG, PNG · max 10 MB<br />We&apos;ll read it and suggest the category for you</span>
                    </button></div>}
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; pickFile(file) }} />
            </div>

            {/* RIGHT: review */}
            <div className="min-h-0 space-y-3 p-4 min-[820px]:overflow-y-auto min-[820px]:p-5">
        {/* Error Alert Message */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Duplicate accomplishment / document (blocking) */}
        {submitBlocker && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-sm flex items-start gap-2.5 shrink-0">
            <AlertCircle className="mt-0.5 w-4 h-4 shrink-0 text-rose-600" />
            <span><strong>Duplicate accomplishment.</strong> {submitBlocker}</span>
          </div>
        )}

        {/* ================= OCR SCAN CONFIDENCE & STATUS BANNER ================= */}
        {isScanning && (
          <div className="p-4 rounded-2xl bg-[#E7F3E9] border border-emerald-300 text-[#064e2b] text-xs font-bold flex items-center gap-3 shrink-0 animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-xl bg-[#16834a] text-white flex items-center justify-center animate-spin shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900">Scanning Document with AchieveNest OCR Engine...</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-amber-300 text-[10px] font-extrabold">AI Processing</span>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                Extracting text → Suggesting NDMU Category → Auto-filling fields without fabrication...
              </p>
            </div>
          </div>
        )}

        {ocrResult && !isScanning && (
          <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 shrink-0 animate-in fade-in duration-150 ${ocrResult.documentQuality?.label === 'failed' ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-emerald-50/90 border-emerald-300 text-[#064e2b]'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{ocrResult.documentQuality?.label === 'failed' ? 'Manual entry required' : 'OCR scan completed'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${ocrResult.documentQuality?.label === 'failed' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-200 text-[#064e2b] border-emerald-400/60'}`}>
                    Document quality: {ocrResult.documentQuality?.label || 'review'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  {ocrResult.documentQuality?.label === 'failed'
                    ? 'OCR could not reliably read this document. Upload a clearer file or continue manually.'
                    : <>Suggested Category: <strong className="text-emerald-950">{ocrResult.detectedCategory || 'Manual Selection Required'}</strong> • Category confidence: {ocrResult.confidenceScore}%</>}
                </p>
                {ocrResult.documentQuality?.label !== 'failed' && (
                  <p className="text-[10px] text-emerald-900 mt-1 tabular-nums">
                    Auto-filled: {ocrFieldSummary.autoFilled} • Needs review: {ocrFieldSummary.needsReview} • Manual: {ocrFieldSummary.manual}
                  </p>
                )}
                {ocrResult.extractionWarnings?.length > 0 && (
                  <p className="text-[10px] text-amber-800 mt-1 italic">
                    ℹ {ocrResult.extractionWarnings[0]}
                  </p>
                )}
              </div>
            </div>

            {attachedFile && (
              <button
                type="button"
                onClick={() => performOcrScan(attachedFile)}
                className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-[#064e2b] hover:bg-emerald-100 text-[11px] font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                <span>Re-scan</span>
              </button>
            )}
          </div>
        )}

              <section aria-labelledby="ntp-document-heading" className="rounded-xl border border-slate-200 bg-white p-4">
                <CardHeading id="ntp-document-heading" number={1} title="Supporting document" />
                {!hasDocument && <p className="mt-2 text-sm text-slate-600">No document yet. Upload one on the left to get started.</p>}
                {hasDocument && <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-900 text-[10px] font-extrabold uppercase text-white">{fileExtension}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">{attachedFile?.name || editingItem?.attached_file_name || 'Saved proof document'}</p>
                    <p className="text-xs text-slate-600">{attachedFile ? `${(attachedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Already on file'}{isScanning && <span role="status" className="ml-1.5 font-semibold text-amber-800">Reading document…</span>}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {attachedFile && !isScanning && <button type="button" onClick={() => performOcrScan(attachedFile)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />{ocrResult ? 'Re-scan' : 'Scan'}</button>}
                    <button type="button" disabled={isScanning} onClick={() => fileInputRef.current?.click()} className="rounded-md px-2 py-1.5 text-xs font-bold text-slate-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50">Replace</button>
                  </div>
                </div>}
                {requiredProofHint && <p className="mt-2 text-xs text-slate-600">Suggested proof: {requiredProofHint}</p>}
              </section>

              <section aria-labelledby="ntp-classification-heading" className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <CardHeading id="ntp-classification-heading" number={2} title="Classification" />
            <ReqLabel 
              label="Category" 
              value={category} 
              isOcrAutoFilled={ocrBadges.category}
              isManuallyEdited={manuallyEdited.category}
            />
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-[#16834a]/20 focus:border-[#16834a] outline-hidden cursor-pointer"
            >
              {AREA_CATEGORY_OPTIONS[lockedAreaCode].map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {activeCriterion && <button type="button" onClick={() => openHelpGuide({ topicId: 'categories', categoryId: activeCriterion.group, subcategoryId: activeCriterion.code })} className="rounded-md px-1 py-1 text-xs font-bold text-emerald-900 underline underline-offset-2 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">What belongs here?</button>}
          </section>

              <section aria-labelledby="ntp-details-heading" className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <CardHeading id="ntp-details-heading" number={3} title="Accomplishment details" />
          {/* ================= Appendix N details for the selected criterion ================= */}
          {activeCriterion && (
            <div className="space-y-3.5">
              <p className="text-xs font-semibold text-slate-600">{activeCriterion.groupTitle} · {activeCriterion.title} (maximum {activeCriterion.max} points)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeCriterion.fields.map((definition) => (
                  <div key={`${activeCriterion.code}-${definition.name}`} className={definition.name === activeCriterion.primary ? 'sm:col-span-2' : ''}>
                    <ReqLabel label={definition.required === false ? `${definition.label} (optional)` : definition.label} value={details[definition.name]} isOcrAutoFilled={ocrBadges[definition.name]} isManuallyEdited={manuallyEdited[definition.name]} />
                    {definition.type === 'select'
                      ? <select value={details[definition.name] || ''} onChange={(event) => setDetail(definition.name, event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"><option value="">Select {definition.label.toLowerCase()}</option>{definition.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                      : <input type="text" maxLength={255} value={details[definition.name] || ''} placeholder={definition.placeholder || ''} onChange={(event) => setDetail(definition.name, event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= DATE(S) ================= */}
          {activeCriterion?.dateMode === 'period' ? (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <ReqLabel label="Start date" value={startDate} isOcrAutoFilled={ocrBadges.startDate} isManuallyEdited={manuallyEdited.startDate} />
                <input type="date" value={startDate} max={localToday()} onChange={(event) => { setStartDate(event.target.value); markFieldEdited('startDate') }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" />
              </div>
              <div>
                <ReqLabel label={ongoing ? 'End date (ongoing)' : 'End date'} value={ongoing ? 'ongoing' : endDate} />
                <input type="date" value={endDate} min={startDate || undefined} max={localToday()} disabled={ongoing} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:bg-slate-100" />
                {activeCriterion.allowOngoing && <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><input type="checkbox" checked={ongoing} onChange={(event) => { setOngoing(event.target.checked); if (event.target.checked) setEndDate('') }} className="h-4 w-4 accent-emerald-800" />Ongoing</label>}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <ReqLabel label="Date" value={dateAchieved} isOcrAutoFilled={ocrBadges.dateAchieved} isManuallyEdited={manuallyEdited.dateAchieved} />
                <input type="date" value={dateAchieved} max={localToday()} onChange={handleDateChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Academic year</label>
                <div className="flex min-h-[38px] items-center rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">{academicYear || <span className="font-normal italic text-slate-400">Derived from the date</span>}</div>
              </div>
            </div>
          )}

          {/* ================= STEP 5: OPTIONAL NARRATIVE DESCRIPTION ================= */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks (optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context regarding outcomes, participants, or scope..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-[#16834a]/20 focus:border-[#16834a] outline-hidden resize-none"
            />
          </div>
              </section>
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3">
            <div className="flex flex-col-reverse gap-3 min-[820px]:flex-row min-[820px]:items-center min-[820px]:justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800" aria-live="polite"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${footerStatus.tone}`} aria-hidden="true" />{footerStatus.text}</p>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={requestClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">Cancel</button>
                <button type="submit" disabled={isSubmitting || (!attachedFile && !editingItem) || Boolean(submitBlocker)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45">
                  {isSubmitting
                    ? <><RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />Adding…</>
                    : <><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{editingItem ? 'Save Changes' : 'Add Accomplishment'}</>}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
