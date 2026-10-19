import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useHelpGuide } from '../../../context/HelpGuideContext'
import { AlertCircle, CheckCircle2, Eye, FileText, LoaderCircle, RefreshCw, RotateCcw, Save, Send, ShieldCheck, Trash2, Upload, X } from 'lucide-react'
import ConfiguredStructuredDetailsFields, { applyConfiguredFieldDefaults } from '../components/ConfiguredStructuredDetailsFields'
import StructuredDetailsFields, { applyStructuredFieldDefaults } from '../components/StructuredDetailsFields'
import { getSubcategorySchema } from '../../../config/portfolioFormSchemaRegistry'
import { AutomaticAttendanceCertificatePreview, automaticAttendanceCertificateMetadata } from './StudentAchievementPreviewModal'
import { evidenceMime } from '../../../components/common/EvidenceThumbnail'
import portfolioService from '../../../services/portfolioService'
import { compressEvidenceImage } from '../../../utils/compressEvidenceImage'
import { formatDateRange } from '../../../utils/achievementDates'
import StudentAchievementDraftSession, {
  ACCEPTED_EVIDENCE_TYPES,
  applyOcrToDetails,
  buildRecordPayload,
  parseStructuredMetadata,
  validateForSubmit
} from '../../../controllers/StudentAchievementDraftSession'

const PREVIEWABLE = ['application/pdf', 'image/jpeg', 'image/png']

const evidenceLabel = item => {
  if (item.security_status === 'clean') return 'Ready for submission'
  if (item.security_status === 'rejected') return 'Failed the security check'
  return 'Security check pending'
}

/**
 * Student achievement entry backed by the single system of record (student_portfolio_records).
 * Order: evidence -> category/subcategory -> configured details.
 * Evidence may be uploaded before a category is chosen (unclassified draft). OCR runs only after a
 * clean security scan and only suggests values; dropdowns are filled only on an exact option match.
 * No record is created until the first evidence upload or the first "Save draft".
 */
export default function PortfolioAchievementSubmissionModal({ isOpen, onClose, onSaved, editingRecordId = null, taxonomy = [] }) {
  const { openHelpGuide } = useHelpGuide()
  const titleId = useId()
  const sessionRef = useRef(null)
  const replaceTargetRef = useRef(null)
  const replaceInputRef = useRef(null)
  const localPreviewUrlsRef = useRef(new Map())

  const [ocrSuggestions, setOcrSuggestions] = useState([])
  const [detailsFromDocument, setDetailsFromDocument] = useState({})
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [structuredMetadata, setStructuredMetadata] = useState({ schema_version: '1.0' })
  const [evidence, setEvidence] = useState([])
  const [previews, setPreviews] = useState({})
  const [previewErrors, setPreviewErrors] = useState({})
  const [previewLoading, setPreviewLoading] = useState({})
  const [previewRetry, setPreviewRetry] = useState(0)
  const [localPreviews, setLocalPreviews] = useState({})
  const [fullPreview, setFullPreview] = useState(null)
  const [fullCertificatePreviewOpen, setFullCertificatePreviewOpen] = useState(false)
  const [status, setStatus] = useState(null)
  const [revisionOfRecordId, setRevisionOfRecordId] = useState(null)
  const [revisionRemarks, setRevisionRemarks] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [scanMessage, setScanMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [schemaCatalog, setSchemaCatalog] = useState(null)
  const [schemaLoadError, setSchemaLoadError] = useState('')
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [recordLoading, setRecordLoading] = useState(false)
  const [loadedRecord, setLoadedRecord] = useState(null)
  const [loadedRecordId, setLoadedRecordId] = useState(null)
  const [recordLoadError, setRecordLoadError] = useState('')
  const [recordLoadAttempt, setRecordLoadAttempt] = useState(0)

  const editable = (!editingRecordId || loadedRecordId === editingRecordId) && (status === null || ['draft', 'revision_requested'].includes(status))
  const legacySchema = getSubcategorySchema(subcategoryId)
  const isLegacyDraft = Boolean(editingRecordId && structuredMetadata.schema_version === '1.0')
  const configuredSchema = schemaCatalog?.categories?.flatMap(item => item.subcategories || []).find(item => item.legacy_subcategory_id === subcategoryId) || null
  const schema = isLegacyDraft ? legacySchema : configuredSchema
  const selectedCategory = taxonomy.find(category => category.id === categoryId)
  const subcategories = selectedCategory?.subcategories || []
  const subcategoryRequired = subcategories.length > 0
  const cleanEvidence = evidence.some(item => item.status === 'active' && item.security_status === 'clean')
  const generatedCertificate = Boolean(revisionOfRecordId && automaticAttendanceCertificateMetadata({ structured_metadata: structuredMetadata }))
  const hasReviewableEvidence = cleanEvidence || generatedCertificate
  const editLoadError = recordLoadError || (editingRecordId && schemaLoadError ? schemaLoadError : '')
  const editLoadPending = Boolean(editingRecordId && !editLoadError && (recordLoading || schemaLoading || loadedRecordId !== editingRecordId))

  const payload = useCallback(() => buildRecordPayload({ categoryId, subcategoryId, structuredMetadata, schemaVersion: isLegacyDraft ? '1.0' : (schemaCatalog?.schema_version || 'student-form-schema-2') }), [categoryId, subcategoryId, structuredMetadata, isLegacyDraft, schemaCatalog])

  // Reset on open; load the record and its form schema before showing an editable submission.
  useEffect(() => {
    if (!isOpen) return undefined
    let active = true
    sessionRef.current = new StudentAchievementDraftSession(portfolioService)
    setOcrSuggestions([]); setDetailsFromDocument({}); setCategoryId(''); setSubcategoryId('')
    setStructuredMetadata({ schema_version: 'student-form-schema-2' }); setEvidence([]); setStatus(null); setRevisionOfRecordId(null); setRevisionRemarks('')
    setErrors({}); setMessage(null); setScanMessage(''); setFullPreview(null); setFullCertificatePreviewOpen(false)
    setSchemaCatalog(null); setSchemaLoadError(''); setSchemaLoading(true)
    setRecordLoading(Boolean(editingRecordId)); setLoadedRecord(null); setLoadedRecordId(null); setRecordLoadError('')
    portfolioService.fetchAchievementSchema()
      .then(catalog => { if (active && Array.isArray(catalog?.categories)) setSchemaCatalog(catalog) })
      .catch(error => { if (active) setSchemaLoadError(error?.response?.data?.error?.message || error?.message || 'Achievement intake schema is unavailable.') })
      .finally(() => { if (active) setSchemaLoading(false) })
    if (editingRecordId) {
      setBusy(true)
      sessionRef.current.load(editingRecordId)
        .then(({ record, evidence: rows, events }) => {
          if (!active) return
          setCategoryId(record.category_id || '')
          setSubcategoryId(record.subcategory_id || '')
          setStructuredMetadata(parseStructuredMetadata(record.structured_metadata))
          setLoadedRecord(record)
          setEvidence(rows)
          setStatus(record.status)
          setRevisionOfRecordId(record.revision_of_record_id || null)
          const lastReturn = [...events].reverse().find(event => event.action === 'revision_requested')
          setRevisionRemarks(lastReturn?.remarks || record.latest_remarks || '')
          setLoadedRecordId(editingRecordId)
        })
        .catch(error => { if (active) setRecordLoadError(error.message) })
        .finally(() => { if (active) { setRecordLoading(false); setBusy(false) } })
    }
    return () => { active = false }
  }, [isOpen, editingRecordId, recordLoadAttempt])

  // Authenticated previews for every previewable evidence item; object URLs are revoked on change/close.
  useEffect(() => {
    if (!isOpen || evidence.length === 0) { setPreviews({}); setPreviewErrors({}); setPreviewLoading({}); return undefined }
    let cancelled = false
    const urls = []
    const previewable = evidence.filter(item => PREVIEWABLE.includes(evidenceMime(item)) && !localPreviewUrlsRef.current.has(item.id))
    setPreviews({})
    setPreviewErrors({})
    setPreviewLoading(Object.fromEntries(previewable.map(item => [item.id, true])))
    Promise.all(previewable.map(async item => {
      try {
        const blob = await portfolioService.downloadEvidence(item.id)
        const url = URL.createObjectURL(blob)
        urls.push(url)
        return { id: item.id, url }
      } catch { return { id: item.id, error: true } }
    })).then(entries => {
      if (cancelled) return
      setPreviews(Object.fromEntries(entries.filter(entry => entry.url).map(entry => [entry.id, entry.url])))
      setPreviewErrors(Object.fromEntries(entries.filter(entry => entry.error).map(entry => [entry.id, true])))
      setPreviewLoading({})
    })
    return () => { cancelled = true; urls.forEach(url => URL.revokeObjectURL(url)) }
  }, [isOpen, evidence, previewRetry])

  // Keep browser-created upload previews alive for this modal session, then revoke them on close.
  useEffect(() => {
    if (isOpen) return undefined
    localPreviewUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    localPreviewUrlsRef.current.clear()
    setLocalPreviews({})
    return undefined
  }, [isOpen])

  // Once a subcategory is chosen, fill its empty details from the document (exact matches only for dropdowns).
  useEffect(() => {
    // The OSAD contract catalog marks field-level OCR mapping as pending review.
    // Keep OCR advisory and avoid applying legacy mappings to configured fields.
    if (!subcategoryId || ocrSuggestions.length === 0) return
    const fields = schema?.fields || []
    setStructuredMetadata(previous => {
      const { metadata, applied } = applyOcrToDetails(previous, ocrSuggestions, fields)
      if (Object.keys(applied).length) setDetailsFromDocument(current => ({ ...current, ...applied }))
      return Object.keys(applied).length ? metadata : previous
    })
  }, [subcategoryId, ocrSuggestions, schema, isLegacyDraft])

  const syncStatusFromSession = () => setStatus(sessionRef.current?.status ?? null)

  const retryEvidencePreviews = () => {
    setPreviews({})
    setPreviewErrors({})
    setPreviewLoading({})
    setPreviewRetry(value => value + 1)
  }

  const retryRecordLoad = () => {
    setRecordLoadError('')
    setRecordLoadAttempt(value => value + 1)
  }

  const showError = error => {
    setErrors(error?.fieldErrors || {})
    setMessage({ type: 'error', text: `${error?.message || 'The request failed.'}${error?.code ? ` (${error.code})` : ''}` })
  }


  const chooseCategory = value => {
    setCategoryId(value); setSubcategoryId(''); setStructuredMetadata({ schema_version: schemaCatalog?.schema_version || 'student-form-schema-2' }); setDetailsFromDocument({})
    setErrors(previous => { const next = { ...previous }; delete next.category_id; delete next.subcategory_id; return next })
  }

  const chooseSubcategory = value => {
    const contract = schemaCatalog?.categories?.flatMap(item => item.subcategories || []).find(item => item.legacy_subcategory_id === value)
    setSubcategoryId(value); setStructuredMetadata(applyConfiguredFieldDefaults({ schema_version: schemaCatalog?.schema_version || 'student-form-schema-2' }, contract)); setDetailsFromDocument({})
    setErrors(previous => { const next = { ...previous }; delete next.subcategory_id; return next })
  }

  const reloadEvidence = async (session = sessionRef.current) => {
    const rows = await session.refreshEvidence()
    if (sessionRef.current === session) setEvidence(rows)
    return rows
  }

  const runScan = async (evidenceId, session = sessionRef.current, { background = false } = {}) => {
    const isCurrentSession = () => sessionRef.current === session
    setScanMessage(background
      ? 'Upload complete. The security check is running in the background; you can continue filling in the details.'
      : 'Running the security scan on your document…')
    const result = await session.scanEvidence(evidenceId)
    if (!isCurrentSession()) return
    // Reflect a clean scan as soon as it completes; optional OCR must not keep
    // the evidence or submit button waiting.
    await reloadEvidence(session)
    if (!isCurrentSession()) return
    const unavailable = 'Security scanner unavailable. Select "Retry scan" to try again. You can keep entering the details manually; submission stays locked until the scan passes, and the document is read only after it passes.'
    if (!result.ok) {
      setScanMessage(unavailable)
      return
    }
    const scanStatus = result.scan?.status
    if (scanStatus === 'clean') {
      setScanMessage('Your document passed the security check. Reading it for details…')
      const read = await session.readEvidence(evidenceId)
      if (!isCurrentSession()) return
      const suggestions = read.ocr?.review_suggestions || []
      setOcrSuggestions(suggestions)
      setScanMessage(suggestions.length
        ? 'Your document is ready. Review any details we filled from it.'
        : read.ok ? 'Your document is ready.' : 'Your document is ready. We could not read details from it, so please enter them manually.')
    } else if (scanStatus === 'infected') {
      setScanMessage('This document failed the security check. It was not read and cannot be submitted. Remove it and upload a different file.')
    } else {
      setScanMessage(unavailable)
    }
  }

  const uploadEvidence = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const replacing = replaceTargetRef.current
    replaceTargetRef.current = null
    setBusy(true); setMessage(null)
    let backgroundScan = null
    const session = sessionRef.current
    try {
      setScanMessage(file.type.startsWith('image/') && file.size > 2.5 * 1024 * 1024
        ? 'Optimizing your image for upload…'
        : 'Uploading your document…')
      const optimized = await compressEvidenceImage(file)
      setScanMessage(optimized.optimized
        ? `Image optimized (${optimized.sizeLabel}). Uploading…`
        : 'Uploading your document…')
      const uploaded = await session.uploadEvidence(optimized.file, payload())
      if (replacing) {
        await session.removeEvidence(replacing.id)
        const oldLocalUrl = localPreviewUrlsRef.current.get(replacing.id)
        if (oldLocalUrl) URL.revokeObjectURL(oldLocalUrl)
        localPreviewUrlsRef.current.delete(replacing.id)
        setLocalPreviews(current => { const next = { ...current }; delete next[replacing.id]; return next })
      }
      if (PREVIEWABLE.includes(optimized.file.type)) {
        const previewUrl = URL.createObjectURL(optimized.file)
        localPreviewUrlsRef.current.set(uploaded.id, previewUrl)
        setLocalPreviews(current => ({ ...current, [uploaded.id]: previewUrl }))
      }
      if (sessionRef.current === session) {
        setStatus(session.status ?? null)
        setEvidence(current => [
          ...current.filter(item => item.id !== uploaded.id && item.id !== replacing?.id),
          uploaded
        ])
      }
      onSaved?.()
      if (sessionRef.current === session) {
        setScanMessage('Upload complete. The security check is running in the background; you can continue filling in the details.')
      }
      backgroundScan = uploaded.id
    } catch (error) {
      setScanMessage('')
      showError(error)
      if (session.recordId) await reloadEvidence(session).catch(() => {})
    } finally {
      setBusy(false)
    }

    // The file is already stored. Keep the modal responsive while scanning and
    // advisory OCR finish; submit validation still requires a clean scan.
    if (backgroundScan) {
      void runScan(backgroundScan, session, { background: true })
        .catch(() => {
          if (sessionRef.current === session) {
            setScanMessage('Your document was uploaded, but its status could not be refreshed. Select “Retry scan” before submitting.')
          }
        })
    }
  }

  const recheck = async item => {
    setBusy(true); setMessage(null)
    try { await runScan(item.id); await reloadEvidence() } finally { setBusy(false) }
  }

  const removeEvidence = async item => {
    setBusy(true); setMessage(null)
    try {
      await sessionRef.current.removeEvidence(item.id)
      await reloadEvidence()
      setScanMessage('Document removed from this achievement.')
      onSaved?.()
    } catch (error) { showError(error) } finally { setBusy(false) }
  }

  const saveDraft = async () => {
    setBusy(true); setMessage(null); setErrors({})
    try {
      await sessionRef.current.save(payload())
      syncStatusFromSession()
      setMessage({ type: 'success', text: 'Draft saved.' })
      onSaved?.()
    } catch (error) { showError(error) } finally { setBusy(false) }
  }

  const submit = async () => {
    if ((!schemaCatalog && !isLegacyDraft) || schemaLoadError || (subcategoryId && !schema)) {
      setMessage({ type: 'error', text: schemaLoadError || 'The configured achievement fields are still loading. Please try again.' })
      return
    }
    const clientErrors = validateForSubmit({ categoryId, subcategoryId, subcategoryRequired, structuredMetadata, schemaFields: schema?.fields || [], evidence, allowGeneratedCertificate: generatedCertificate })
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      setMessage({ type: 'error', text: 'Complete the highlighted items before submitting.' })
      return
    }
    setBusy(true); setMessage(null); setErrors({})
    try {
      await sessionRef.current.submit(payload())
      syncStatusFromSession()
      onSaved?.()
      onClose?.()
    } catch (error) {
      syncStatusFromSession()
      showError(error)
    } finally { setBusy(false) }
  }

  const evidenceList = useMemo(() => evidence.filter(item => item.status === 'active'), [evidence])
  const certificatePreviewRecord = loadedRecord ? {
    ...loadedRecord,
    display_date: formatDateRange(loadedRecord.start_date || loadedRecord.occurrence_date, loadedRecord.end_date),
    organizer_or_body: loadedRecord.organizer_or_body || ''
  } : null

  if (!isOpen) return null

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4">
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-[#f8fbf8] shadow-2xl dark:bg-slate-950 sm:h-[92vh] sm:rounded-3xl">
      <header className="flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#16834a]">Student achievements</p>
          <h2 id={titleId} className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{editingRecordId ? 'Edit achievement' : 'Add achievement'}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Upload your proof, review what we found, choose the category, then complete the details.</p>
          {revisionOfRecordId && <p className="mt-2 max-w-3xl rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">This is an edit for coordinator review. Your current verified achievement stays active until the coordinator approves this updated version.</p>}
        </div>
        <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close form"><X size={20}/></button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
        {message && <div role="alert" className={`mb-5 flex gap-2 rounded-xl border p-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>{message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}<span>{message.text}</span></div>}
        {schemaLoadError && !editingRecordId && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Configured achievement fields could not be loaded: {schemaLoadError}</div>}
        {status === 'revision_requested' && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="flex items-center gap-2 font-bold"><RotateCcw size={16}/>Returned for revision</p>{revisionRemarks && <p className="mt-1">Coordinator remarks: {revisionRemarks}</p>}</div>}
        {!editable && status && (!editingRecordId || loadedRecordId === editingRecordId) && <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">This achievement is {status === 'submitted' ? 'pending review' : status} and can no longer be edited.</div>}

        {editLoadError ? <section role="alert" className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm"><h3 className="font-bold text-slate-900">Could not load this submission</h3><p className="mt-2 text-sm text-slate-600">{editLoadError}</p><button type="button" onClick={retryRecordLoad} className="mt-4 min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900">Try again</button></section>
          : editLoadPending ? <div role="status" aria-live="polite" className="flex min-h-64 items-center justify-center gap-3 text-sm font-semibold text-slate-600"><LoaderCircle className="h-5 w-5 animate-spin text-emerald-700"/>Loading saved details and certificate…</div>
          : <div className="grid gap-6 lg:grid-cols-[minmax(380px,0.95fr)_minmax(0,1.05fr)]">
          <aside className="h-fit rounded-2xl border border-[#dce6df] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0">
            <section aria-label="Supporting evidence">
              <div className="flex items-center gap-2"><ShieldCheck className="text-[#16834a]" size={19}/><h3 className="font-bold text-slate-900 dark:text-white">Evidence</h3></div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">PDF, JPG, or PNG · up to 10 MiB · PDFs up to two pages. Large images are automatically optimized before upload; PDFs keep their original quality.</p>
              {generatedCertificate && certificatePreviewRecord && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-emerald-900">Generated attendance certificate</h4>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Verified</span>
                </div>
                <AutomaticAttendanceCertificatePreview achievement={certificatePreviewRecord} landscape />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium text-emerald-900">System-issued proof for this achievement.</p>
                  <button type="button" onClick={() => setFullCertificatePreviewOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 text-xs font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><Eye size={14}/>View full certificate</button>
                </div>
              </div>}
              <label className={`mt-4 flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center ${editable ? 'cursor-pointer border-[#a9c6b1] bg-[#f6fbf7] hover:border-[#16834a]' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                <Upload className="mb-2 text-[#16834a]"/>
                <span className="text-sm font-bold">{generatedCertificate ? 'Add another supporting document (optional)' : 'Upload supporting evidence'}</span>
                <span className="mt-1 text-xs text-slate-500">{generatedCertificate ? 'The generated certificate above already counts as proof.' : 'Start here: choose a document.'}</span>
                <input id="evidence-file-input" className="sr-only" type="file" accept={ACCEPTED_EVIDENCE_TYPES.join(',')} onChange={uploadEvidence} disabled={busy || !editable}/>
              </label>
              <input ref={replaceInputRef} className="sr-only" type="file" accept={ACCEPTED_EVIDENCE_TYPES.join(',')} onChange={uploadEvidence} disabled={busy || !editable} aria-label="Choose replacement document"/>
              {errors.evidence && <p className="mt-2 text-xs text-rose-700">{errors.evidence}</p>}
              {scanMessage && <p aria-live="polite" className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{busy && <LoaderCircle className="mr-2 inline animate-spin" size={14}/>}{scanMessage}</p>}
              <div className="mt-4 space-y-3">
                {evidenceList.map(item => <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 text-xs dark:border-slate-800">
                  {(localPreviews[item.id] || previews[item.id])
                    ? evidenceMime(item) === 'application/pdf'
                      ? <iframe title={`Preview of ${item.original_filename}`} src={`${localPreviews[item.id] || previews[item.id]}#page=1&view=FitH`} className="h-56 w-full border-0 bg-slate-100"/>
                      : <img src={localPreviews[item.id] || previews[item.id]} alt={`Preview of ${item.original_filename}`} className="h-56 w-full bg-slate-50 object-contain"/>
                    : previewErrors[item.id]
                      ? <div role="alert" className="flex h-28 flex-col items-center justify-center gap-2 bg-slate-50 px-4 text-center text-xs font-medium text-slate-600"><span>Certificate preview could not be loaded.</span><button type="button" onClick={retryEvidencePreviews} className="font-bold text-emerald-800 underline underline-offset-2">Retry preview</button></div>
                      : PREVIEWABLE.includes(evidenceMime(item)) || previewLoading[item.id]
                        ? <div role="status" className="flex h-28 items-center justify-center gap-2 bg-slate-50 px-4 text-center text-xs font-medium text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin"/>Loading certificate preview…</div>
                        : <div className="flex h-28 items-center justify-center bg-slate-50 px-4 text-center text-xs font-medium text-slate-500">Preview is not available for this file type.</div>}
                  <div className="flex items-center gap-2 p-3">
                    <FileText className="shrink-0 text-[#16834a]" size={17}/>
                    <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-800 dark:text-slate-100">{item.original_filename}</p><p className="text-slate-500">{evidenceLabel(item)}</p></div>
                    {(localPreviews[item.id] || previews[item.id]) && <button type="button" onClick={() => setFullPreview(item)} className="rounded p-2 hover:bg-slate-100" aria-label={`View ${item.original_filename}`}><Eye size={16}/></button>}
                    {editable && item.security_status === 'pending' && <button type="button" disabled={busy} onClick={() => recheck(item)} className="rounded px-2 py-1 text-[#126b3c] hover:bg-emerald-50" aria-label={`Retry the security scan for ${item.original_filename}`}>Retry scan</button>}
                    {editable && <button type="button" disabled={busy} onClick={() => { replaceTargetRef.current = item; replaceInputRef.current?.click() }} className="rounded p-2 text-[#126b3c] hover:bg-emerald-50" aria-label={`Replace ${item.original_filename}`}><RefreshCw size={16}/></button>}
                    {editable && <button type="button" disabled={busy} onClick={() => removeEvidence(item)} className="rounded p-2 text-rose-700 hover:bg-rose-50" aria-label={`Remove ${item.original_filename}`}><Trash2 size={16}/></button>}
                  </div>
                </div>)}
              </div>
            </section>
          </aside>

          <div className="space-y-5">
            <section aria-label="Classification" className="rounded-2xl border border-[#dce6df] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">Category and subcategory</h3>
              <p className="mt-1 text-xs text-slate-500">Choose these yourself. The document never decides the category.</p>
              <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="achievement-category">Category<span className="text-rose-600"> *</span>
                <select id="achievement-category" name="category_id" value={categoryId} onChange={event => chooseCategory(event.target.value)} disabled={busy || !editable} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                  <option value="">Select a category</option>
                  {taxonomy.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              {errors.category_id && <p className="mt-1 text-xs text-rose-700">{errors.category_id}</p>}
              {selectedCategory && <button type="button" onClick={() => openHelpGuide({ topicId: 'categories', categoryId: selectedCategory.id, subcategoryId: subcategoryId || undefined })} className="mt-1 rounded-md px-1 py-1 text-xs font-bold text-emerald-800 underline underline-offset-2 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40">What belongs here?</button>}
              {subcategoryRequired && <label className="mt-3 block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="achievement-subcategory">Subcategory<span className="text-rose-600"> *</span>
                <select id="achievement-subcategory" name="subcategory_id" value={subcategoryId} onChange={event => chooseSubcategory(event.target.value)} disabled={busy || !editable || !categoryId} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                  <option value="">Select a subcategory</option>
                  {subcategories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>}
              {errors.subcategory_id && <p className="mt-1 text-xs text-rose-700">{errors.subcategory_id}</p>}
            </section>

            <section aria-label="Additional information" className="rounded-2xl border border-[#dce6df] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {subcategoryId
                ? <>{Object.values(detailsFromDocument).some(Boolean) && <p className="mb-3 text-xs text-emerald-800">Some details were filled from your document. Check them; your entries are what gets saved.</p>}{isLegacyDraft ? <StructuredDetailsFields subcategoryId={subcategoryId} structuredMetadata={structuredMetadata} onChange={setStructuredMetadata} errors={errors} disabled={busy || !editable}/> : <ConfiguredStructuredDetailsFields contract={schema} structuredMetadata={structuredMetadata} onChange={setStructuredMetadata} errors={errors} disabled={busy || !editable}/>}</>
                : selectedCategory && !subcategoryRequired
                  ? <p className="text-sm text-slate-500">No subcategory-specific intake fields are configured for this category.</p>
                  : <p className="text-sm text-slate-500">Choose a subcategory to see the details it needs.</p>}
            </section>
          </div>
        </div>}
      </main>

      <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-slate-800 dark:bg-slate-900">
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300">Close</button>
          {editable && !editLoadError && !editLoadPending && <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={saveDraft} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:text-slate-100"><Save className="mr-2 inline" size={16}/>Save draft</button>
          <button type="button" disabled={busy || !hasReviewableEvidence} onClick={submit} className="min-h-11 rounded-xl bg-[#16834a] px-4 text-sm font-bold text-white hover:bg-[#126b3c] disabled:opacity-50"><Send className="mr-2 inline" size={16}/>{status === 'revision_requested' ? 'Resubmit for review' : 'Submit for review'}</button>
        </div>}
      </footer>

      {fullCertificatePreviewOpen && certificatePreviewRecord && <div role="dialog" aria-modal="true" aria-label="Full generated attendance certificate" className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/75 p-3 sm:p-6">
        <section className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6">
            <div className="min-w-0"><p className="text-sm font-bold text-slate-900 dark:text-white">Generated attendance certificate</p><p className="truncate text-xs text-slate-500">{certificatePreviewRecord.title}</p></div>
            <button type="button" onClick={() => setFullCertificatePreviewOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close certificate preview"><X size={18}/></button>
          </header>
          <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-50 p-3 dark:bg-slate-900 sm:p-6">
            <AutomaticAttendanceCertificatePreview achievement={certificatePreviewRecord} landscape viewer />
          </main>
        </section>
      </div>}

      {fullPreview && <div role="dialog" aria-modal="true" aria-label={`Full document ${fullPreview.original_filename}`} className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 p-4">
        <section className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white">
          <header className="flex items-center justify-between border-b p-3"><p className="truncate text-sm font-bold">{fullPreview.original_filename}</p><button type="button" onClick={() => setFullPreview(null)} className="rounded p-2 hover:bg-slate-100" aria-label="Close full document"><X size={18}/></button></header>
          {evidenceMime(fullPreview) === 'application/pdf'
            ? <iframe title={`Full document ${fullPreview.original_filename}`} src={localPreviews[fullPreview.id] || previews[fullPreview.id]} className="min-h-0 flex-1 border-0"/>
            : <img src={localPreviews[fullPreview.id] || previews[fullPreview.id]} alt={`Full preview of ${fullPreview.original_filename}`} className="min-h-0 flex-1 object-contain"/>}
        </section>
      </div>}
    </section>
  </div>
}
