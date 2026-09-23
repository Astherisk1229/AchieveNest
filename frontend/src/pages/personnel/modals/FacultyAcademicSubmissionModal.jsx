import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, GraduationCap, LoaderCircle, Paperclip, RefreshCw, ScanLine, Upload, X } from 'lucide-react'
import { FACULTY_ACADEMIC_ENTRY_SCHEMA, facultySchemaByCode, facultySubcategoryByCode } from '../../../config/facultyAcademicAccomplishmentSchema'
import { EMPTY_ACCOMPLISHMENT_FORM, mapAccomplishmentToForm, validateAccomplishmentForm } from '../../../utils/personnelAccomplishmentForm'
import personnelAccomplishmentService from '../../../services/personnelAccomplishmentService'
import { ocrService } from '../../../services/ocrService'
import OcrScanController from '../../../controllers/OcrScanController'
import FacultyDocumentViewer from './FacultyDocumentViewer'
import { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../../../services/PersonnelEvidenceUploadService'

const initialForm = () => ({ ...EMPTY_ACCOMPLISHMENT_FORM, area: '', categoryCode: '', subcategoryCode: '', details: {}, persistedEvidence: [], pendingEvidence: [] })
const categoryCodeFromSuggestion = (value = '') => String(value).match(/^([ABC]\.[0-9](?:\.[0-9])?)/)?.[1] || ''
const primaryTitle = (details, config) => config.fields.find((field) => field.type === 'text' && String(details[field.name] || '').trim())?.name
  ? details[config.fields.find((field) => field.type === 'text' && String(details[field.name] || '').trim()).name]
  : 'Faculty accomplishment'
const issuer = (details) => details.institution || details.organization || details.organizer || details.publisher_or_journal || details.granting_body || details.presenting_body || ''
const confidenceBand = (score) => score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low'
export const isTemporaryWorkflowError = (error) => {
  const status = Number(error?.response?.status || error?.status || 0)
  return !status || status === 408 || status === 429 || status >= 500
}
export async function retryTemporaryOperation(operation, delays = [300, 900]) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { return await operation() } catch (error) {
      lastError = error
      if (!isTemporaryWorkflowError(error) || attempt === 2) throw error
      await new Promise((resolve) => setTimeout(resolve, delays[attempt] ?? 0))
    }
  }
  throw lastError
}

function suggestedSubcategory(categoryCode, fields = {}) {
  if (categoryCode === 'A.1') {
    if (fields.degreeLevel === 'Ph.D. Degree Holder') return 'A1_PHD_HOLDER'
    if (fields.degreeLevel === "Master's Degree Holder") return 'A1_MA_HOLDER'
    if (fields.degreeLevel === 'Ph.D. Units') return 'A1_PHD_UNITS'
    return ''
  }
  return { 'A.2': 'A2_MEMBERSHIP', 'A.3': 'A3_ATTENDANCE', 'B.1': 'B1_ACTIVITY', 'B.2': 'B2_PUBLICATION', 'B.3': 'B3_RESEARCH', 'B.4': 'B4_AWARD', 'B.5': 'B5_MATERIAL', 'B.6': 'B6_CREATIVE_WORK', 'C.1.1': 'C1_MODERATOR', 'C.1.2': 'C1_COACH', 'C.1.3': 'C1_COMMITTEE', 'C.1.4': 'C1_SERVICE', 'C.2.1': 'C2_CHURCH', 'C.2.2': 'C2_CIVIC', 'C.2.3': 'C2_CHARITY' }[categoryCode] || ''
}

export function mapOcrToForm(old, categoryCode, subcategoryCode, extracted = {}, touchedFields = {}) {
  const schema = facultySchemaByCode(categoryCode)
  const config = facultySubcategoryByCode(subcategoryCode)
  if (!schema || !config) return old
  const candidates = {
    degree_title: extracted.title, program: extracted.title, institution: extracted.issuer,
    title: extracted.title, activity_title: extracted.title, publication_title: extracted.title,
    research_title: extracted.title, award_title: extracted.title, material_title: extracted.title,
    creative_work: extracted.title, activity: extracted.title, organization: extracted.issuer,
    organizer: extracted.issuer, publisher_or_journal: extracted.issuer, granting_body: extracted.issuer,
    presenting_body: extracted.issuer, units_completed: extracted.unitsCompleted, scope: extracted.scopeLevel,
    role: extracted.specificRole === 'Participant' ? '' : extracted.specificRole,
    publication_type: extracted.pubType, recognition_status: extracted.awardType === 'Finalist' ? 'Nominee' : extracted.awardType,
    material_type: extracted.matType
  }
  const details = Object.fromEntries(config.fields.map((field) => {
    const candidate = field.options?.includes(candidates[field.name]) || !field.options ? (candidates[field.name] || '') : ''
    const currentValue = old.details?.[field.name]
    if (touchedFields[`details.${field.name}`]) return [field.name, currentValue ?? '']
    return [field.name, currentValue || candidate]
  }))
  const date = touchedFields.date ? old.date : (old.date || extracted.date || '')
  const startDate = touchedFields.startDate ? old.startDate : (old.startDate || extracted.date || '')
  return { ...old, area: schema.area, categoryCode, subcategoryCode, date: config.dateMode === 'single' ? date : old.date, startDate: config.dateMode !== 'single' ? startDate : old.startDate, details }
}

const FILE_ACCEPT = [...ALLOWED_EXTENSIONS.map((extension) => `.${extension}`), ...ALLOWED_MIME_TYPES].join(',')
const AREA_NAMES = { A: 'Professional Development', B: 'Productivity & Creative Work', C: 'Service & Leadership' }
const friendlyUploadError = (error) => {
  const status = Number(error?.response?.status || error?.status || 0)
  if (status === 413) return 'This file is larger than the 10 MB limit. Please choose a smaller file.'
  if (status === 415 || status === 422) return "This file type isn't supported. Please choose a PDF, JPG/JPEG, or PNG document."
  return 'Document upload interrupted. Your draft is safe, and the selected file is still available in this session.'
}

export default function FacultyAcademicSubmissionModal({ isOpen, onClose, onSubmitAccomplishment, editingItem = null, currentUser = {}, areaCode = 'A', areaName = '' }) {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [documentState, setDocumentState] = useState('idle')
  const [documentError, setDocumentError] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState('')
  const [handoffEvidenceId, setHandoffEvidenceId] = useState(null)
  const [touchedFields, setTouchedFields] = useState({})
  const [activeEvidenceId, setActiveEvidenceId] = useState(null)
  const [ocrDocument, setOcrDocument] = useState(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [stagedId, setStagedId] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [classificationConfirmed, setClassificationConfirmed] = useState(false)
  const [classificationEditing, setClassificationEditing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const fileInput = useRef(null)
  const config = useMemo(() => facultySubcategoryByCode(form.subcategoryCode), [form.subcategoryCode])
  const category = facultySchemaByCode(form.categoryCode)
  const effectiveAreaCode = String(form.mode === 'edit' && form.area ? form.area : areaCode || 'A').toUpperCase().replace('AREA', '').trim()
  const effectiveAreaName = areaName || AREA_NAMES[effectiveAreaCode] || 'Faculty Accomplishments'

  useEffect(() => {
    if (!isOpen) return
    let active = true
    const load = async () => {
      setErrors({}); setLoadError(''); setDocumentError(''); setSuggestion(null); setStagedId(null); setSelectedFile(null); setLocalPreviewUrl(''); setHandoffEvidenceId(null); setTouchedFields({}); setOcrDocument(null); setDraftMessage(''); setClassificationEditing(false)
      if (!editingItem?.id) { setForm({ ...initialForm(), area: String(areaCode || 'A').toUpperCase() }); setClassificationConfirmed(false); setDocumentState('idle'); return }
      setLoading(true)
      try {
        const record = await personnelAccomplishmentService.fetchAccomplishment(editingItem.id)
        if (active) { const mapped = mapAccomplishmentToForm(record); setForm(mapped); setActiveEvidenceId(mapped.persistedEvidence[0]?.id || null); setClassificationConfirmed(Boolean(mapped.subcategoryCode)); setDocumentState(mapped.persistedEvidence.length ? 'persisted' : 'idle') }
      } catch (error) { if (active) setLoadError(error?.message || 'Unable to load accomplishment.') } finally { if (active) setLoading(false) }
    }
    load(); return () => { active = false }
  }, [isOpen, editingItem?.id, areaCode, reloadKey])

  useEffect(() => () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
  }, [localPreviewUrl])

  if (!isOpen) return null
  const dirty = Boolean(stagedId || form.originalSnapshot && JSON.stringify({ ...form, originalSnapshot: null }) !== form.originalSnapshot)
  const close = async () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    if (stagedId) { try { await personnelAccomplishmentService.deleteAccomplishment(stagedId) } catch { /* server cleanup can retry later */ } }
    onClose()
  }
  const selectClassification = (categoryCode, subcategoryCode = '') => {
    const schema = facultySchemaByCode(categoryCode)
    if (!schema || schema.area !== effectiveAreaCode) return
    const changingExisting = form.mode === 'edit' && form.subcategoryCode && subcategoryCode && subcategoryCode !== form.subcategoryCode
    if (changingExisting && !window.confirm('Changing classification may replace category-specific fields that do not apply to the new selection. Continue?')) return
    if (!subcategoryCode) {
      setForm((old) => ({ ...old, area: effectiveAreaCode, categoryCode, subcategoryCode: '', details: {} }))
      setClassificationConfirmed(false)
      return
    }
    setForm((old) => mapOcrToForm(old, categoryCode, subcategoryCode, suggestion?.extractedFields || {}, touchedFields))
    setClassificationConfirmed(true)
  }
  const analyzeDocument = (backendDocument) => {
    setDocumentState('classification_pending')
    const text = backendDocument?.text || ''
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const classification = OcrScanController.classifyCategory(text)
    const extractedFields = OcrScanController.extractFieldsFromText(text, lines, classification.category)
    const categoryCode = categoryCodeFromSuggestion(classification.category)
    const inCurrentArea = categoryCode.startsWith(`${effectiveAreaCode}.`)
    const subcategoryCode = inCurrentArea ? suggestedSubcategory(categoryCode, extractedFields) : ''
    const band = confidenceBand(classification.confidence)
    setSuggestion({ ...classification, categoryCode: inCurrentArea ? categoryCode : '', subcategoryCode, extractedFields, band, areaMismatch: !inCurrentArea, warnings: backendDocument?.warnings || [] })
    setDocumentState(text ? (backendDocument?.quality?.label === 'review' ? 'ocr_partial' : 'ocr_completed') : 'ocr_partial')
  }
  const runOcr = async (evidenceId = activeEvidenceId) => {
    if (!evidenceId) { setDocumentError('Upload the document before retrying text extraction.'); return }
    setDocumentError(''); setDocumentState('ocr_processing')
    try {
      const backendDocument = await retryTemporaryOperation(() => ocrService.extractPersisted(evidenceId))
      setOcrDocument(backendDocument)
      analyzeDocument(backendDocument)
    } catch (error) {
      setDocumentState('ocr_failed')
      setDocumentError(error?.message || 'Text extraction could not be completed. Your uploaded document is safe.')
    }
  }
  const processFile = async (file, { reuseLocalPreview = false } = {}) => {
    if (!file || ['staging', 'uploading', 'ocr_processing', 'classification_pending'].includes(documentState)) return
    const extension = String(file.name || '').split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension) || !ALLOWED_MIME_TYPES.includes(file.type)) { setErrors({ evidence: "This file type isn't supported. Please choose a PDF, JPG/JPEG, or PNG document." }); return }
    if (!file.size || file.size > MAX_FILE_SIZE_BYTES) { setErrors({ evidence: file.size ? 'This file is larger than the 10 MB limit. Please choose a smaller file.' : 'This document is empty. Please choose another file.' }); return }
    setSelectedFile(file)
    if (!reuseLocalPreview) setLocalPreviewUrl(URL.createObjectURL(file))
    setHandoffEvidenceId(null); setErrors({}); setDocumentError(''); setSuggestion(null); setDocumentState('staging')
    try {
      let targetId = editingItem?.id || stagedId
      if (!targetId) { const draft = await personnelAccomplishmentService.beginEvidenceDraft(); targetId = draft?.id; if (!targetId) throw new Error('The server could not prepare secure document storage.'); setStagedId(targetId) }
      setDocumentState('uploading')
      const upload = await retryTemporaryOperation(() => personnelAccomplishmentService.uploadEvidence(targetId, file))
      const evidence = upload?.evidence || upload?.data?.evidence
      if (!evidence?.id) throw new Error('The document upload completed without a persisted evidence reference.')
      setActiveEvidenceId(evidence.id); setHandoffEvidenceId(evidence.id)
      setForm((old) => ({ ...old, persistedEvidence: [evidence, ...old.persistedEvidence.filter((item) => item.id !== evidence.id)], pendingEvidence: [] }))
      setDocumentState('persisted')
      await runOcr(evidence.id)
    } catch (error) { setDocumentState('upload_failed'); setDocumentError(friendlyUploadError(error)) }
  }
  const markTouched = (field) => setTouchedFields((old) => ({ ...old, [field]: true }))
  const cancelReplacement = () => { setSelectedFile(null); setLocalPreviewUrl(''); setHandoffEvidenceId(null); setDocumentState(form.persistedEvidence.length ? 'persisted' : 'idle'); setDocumentError('') }
  const handlePersistedPreviewReady = (evidenceId) => {
    if (evidenceId !== handoffEvidenceId) return
    setSelectedFile(null); setLocalPreviewUrl(''); setHandoffEvidenceId(null)
  }
  const confirmSuggestion = () => selectClassification(suggestion.categoryCode, suggestion.subcategoryCode)
  const saveDraft = async () => {
    setSaving(true); setErrors({}); setDraftMessage('')
    try {
      let id = stagedId || form.id
      if (!id) {
        const draft = await personnelAccomplishmentService.beginEvidenceDraft()
        id = draft?.id
        if (!id) throw new Error('The server could not prepare your draft.')
        setStagedId(id)
      }
      await personnelAccomplishmentService.saveDraft(id, {
        title: config ? String(primaryTitle(form.details, config)).trim() : 'Pending document review',
        category_code: form.categoryCode || null,
        category_area: form.area ? `area${form.area}` : null,
        category_metadata: form.subcategoryCode ? { portfolio_format: 'faculty_academic', criterion_code: form.categoryCode, subcategory_code: form.subcategoryCode, faculty_confirmed_category: classificationConfirmed, draft_incomplete: true, details: form.details, start_date: form.startDate || null, end_date: form.endDate || null } : {}
      })
      setDraftMessage('Draft saved. You can resume it later; submission remains blocked until required evidence and fields are complete.')
    } catch (error) { setErrors({ form: error?.message || 'The draft could not be saved. Try again.' }) } finally { setSaving(false) }
  }
  const save = async (event) => {
    event.preventDefault()
    if (!classificationConfirmed) { setErrors({ form: 'Confirm or choose the classification before saving.' }); return }
    const nextErrors = validateAccomplishmentForm(form, config); setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { document.querySelector('[data-form-error="true"]')?.focus(); return }
    setSaving(true)
    try {
      const occurrenceDate = config.dateMode === 'single' ? form.date : (form.endDate || form.startDate)
      const payload = { title: String(primaryTitle(form.details, config)).trim(), issuer: issuer(form.details), location: issuer(form.details), date_achieved: occurrenceDate, date: occurrenceDate, category: `${category.code} ${category.label}`, category_area: `area${category.area}`, category_metadata: { portfolio_format: 'faculty_academic', criterion_code: category.code, subcategory_code: config.code, faculty_confirmed_category: true, ocr_confidence_band: suggestion?.band || null, matched_signals: suggestion?.matchedKeywords || [], date_mode: config.dateMode, start_date: form.startDate || null, end_date: form.endDate || null, ongoing: form.ongoing, details: form.details }, description: '', status: 'Pending Review' }
      const duplicate = await personnelAccomplishmentService.checkDuplicate({ ...payload, exclude_id: form.id || stagedId || undefined })
      if (duplicate?.exact_duplicate) { setErrors({ form: 'This exact accomplishment already exists. Open the existing record instead.' }); return }
      if (stagedId) { await personnelAccomplishmentService.updateAccomplishment(stagedId, payload); await onSubmitAccomplishment?.(payload, null, { alreadyPersisted: true, id: stagedId }); setStagedId(null) }
      else { const saved = await onSubmitAccomplishment?.(payload, null); if (saved === false) throw new Error('The server did not save the accomplishment.') }
      onClose()
    } catch (error) { setErrors({ form: error?.message || 'The accomplishment could not be saved. Try again.' }) } finally { setSaving(false) }
  }
  const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:bg-slate-100'
  const busy = ['staging', 'uploading', 'ocr_processing', 'classification_pending'].includes(documentState)
  const uploadBusy = ['staging', 'uploading'].includes(documentState)

  const activeEvidence = form.persistedEvidence.find((item) => item.id === activeEvidenceId) || form.persistedEvidence[0]
  const areaCategories = FACULTY_ACADEMIC_ENTRY_SCHEMA.filter((item) => item.area === effectiveAreaCode && !item.derived)
  const liveValidationErrors = config ? validateAccomplishmentForm(form, config) : {}
  const hasInvalidRequiredFields = Object.keys(liveValidationErrors).some((key) => key !== 'evidence')
  const finalSaveReason = !form.categoryCode
    ? 'Choose a category to save this accomplishment.'
    : !form.subcategoryCode
      ? 'Choose a subcategory to show and complete its required fields.'
      : uploadBusy
        ? 'Supporting evidence must finish uploading before this accomplishment can be saved.'
        : !form.persistedEvidence.length
          ? 'Supporting evidence must be uploaded before this accomplishment can be saved.'
          : hasInvalidRequiredFields
            ? 'Complete the required accomplishment details before saving.'
            : ''

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-2 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="faculty-entry-title"><section className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#fbfcf8] shadow-[0_24px_70px_-24px_rgba(15,23,42,.55)]">
    <header className="shrink-0 bg-emerald-950 px-5 py-4 text-white sm:px-7"><div className="flex items-start justify-between gap-5"><div className="flex min-w-0 gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10"><GraduationCap className="h-5 w-5" /></span><div className="min-w-0"><h2 id="faculty-entry-title" className="text-lg font-extrabold tracking-[-0.02em]">{form.mode === 'edit' ? 'Edit Accomplishment' : 'Log New Accomplishment'}</h2><p className="mt-1 truncate text-sm text-emerald-50/90">Area {effectiveAreaCode} · {effectiveAreaName}</p></div></div><button type="button" onClick={close} className="rounded-lg p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Close accomplishment form"><X className="h-5 w-5" /></button></div></header>
    {loading ? <div className="grid min-h-80 place-items-center p-8 text-sm font-semibold text-slate-700"><LoaderCircle className="mr-2 inline h-5 w-5 animate-spin" />Loading saved accomplishment…</div> : loadError ? <div className="grid min-h-80 place-items-center p-8 text-center"><div><p className="font-extrabold">Unable to load accomplishment.</p><p className="mt-2 text-sm text-slate-600">{loadError}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white">Try Again</button></div></div> : <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
        <section aria-labelledby="classification-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="classification-heading" className="text-base font-extrabold text-slate-950">Classification</h3><p className="mt-1 text-sm text-slate-600">{form.mode === 'edit' && !classificationEditing ? 'This accomplishment keeps its saved classification unless you explicitly change it.' : `Choose the category that applies within Area ${effectiveAreaCode}.`}</p></div>{form.mode === 'edit' && form.subcategoryCode && <button type="button" onClick={() => setClassificationEditing((value) => !value)} className="rounded-xl border border-emerald-700 bg-white px-3 py-2 text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/25">{classificationEditing ? 'Keep Saved Classification' : 'Change Classification'}</button>}</div>{form.mode === 'edit' && !classificationEditing && form.subcategoryCode ? <div className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-3"><p className="text-sm font-extrabold text-slate-950">{category?.displayCode || category?.code} — {category?.label}</p><p className="mt-1 text-sm text-slate-600">{config?.label}</p></div> : <div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-bold text-slate-900">Category</span><select value={form.categoryCode} onChange={(event) => selectClassification(event.target.value)} className={inputClass}><option value="">Select category</option>{areaCategories.map((item) => <option key={item.code} value={item.code}>{item.displayCode || item.code} — {item.label}</option>)}</select></label><label><span className="text-sm font-bold text-slate-900">Subcategory</span><select value={form.subcategoryCode} disabled={!form.categoryCode} onChange={(event) => selectClassification(form.categoryCode, event.target.value)} className={inputClass}><option value="">{form.categoryCode ? 'Select subcategory' : 'Choose a category first'}</option>{category?.subcategories?.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label></div>}
          {suggestion && <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-950">{suggestion.areaMismatch ? <p>This document may belong to another Area. Keep the current Area and review the classification.</p> : <><p><strong>Suggested:</strong> {suggestion.category || 'Review the available classifications.'}</p>{suggestion.subcategoryCode && <button type="button" onClick={confirmSuggestion} className="mt-2 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white">Use Suggested Classification</button>}</>}</div>}
        </section>

        <section className="mt-8 border-t border-slate-200 pt-6" aria-labelledby="supporting-document-heading"><h3 id="supporting-document-heading" className="text-base font-extrabold text-slate-950">Supporting Document</h3><p className="mt-1 text-sm text-slate-600">Optional while completing the form; required before final save.</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" disabled={uploadBusy} onClick={() => fileInput.current?.click()} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:opacity-50"><ScanLine className="h-4 w-4" />Scan Document</button><button type="button" disabled={uploadBusy} onClick={() => fileInput.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:opacity-50"><Upload className="h-4 w-4" />{form.persistedEvidence.length ? 'Replace Document' : 'Upload File'}</button></div><input ref={fileInput} type="file" accept={FILE_ACCEPT} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; processFile(file) }} /><p className="mt-2 text-xs text-slate-600">PDF, JPG/JPEG, or PNG · maximum 10 MB</p>{errors.evidence && <p className="mt-2 text-sm font-semibold text-rose-700">{errors.evidence}</p>}
          {documentState !== 'idle' && <div role="status" aria-live="polite" className="mt-3 flex items-start gap-2 text-sm text-slate-700">{busy ? <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-emerald-800" /> : ['upload_failed', 'ocr_failed'].includes(documentState) ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />}<div><strong>{documentState === 'staging' ? 'Preparing your draft…' : documentState === 'uploading' ? 'Uploading document…' : documentState === 'ocr_processing' ? 'Reading document…' : documentState === 'classification_pending' ? 'Reviewing document details…' : documentState === 'upload_failed' ? 'Upload interrupted.' : documentState === 'ocr_failed' ? "We couldn't read the text automatically." : documentState === 'ocr_partial' ? 'Some details were found. Please review them.' : documentState === 'ocr_completed' ? 'We found information from your document.' : 'Document uploaded.'}</strong>{documentState === 'upload_failed' && <p className="mt-1">The document is still available here. Retry the upload when ready.</p>}{documentState === 'ocr_failed' && <p className="mt-1">You can continue entering the details below.</p>}</div></div>}
          {documentState === 'upload_failed' && <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => selectedFile ? processFile(selectedFile, { reuseLocalPreview: true }) : fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-3 py-2 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" />Retry Upload</button>{activeEvidence && selectedFile && <button type="button" onClick={cancelReplacement} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">Cancel Replacement</button>}</div>}{documentState === 'ocr_failed' && <button type="button" onClick={() => runOcr()} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800"><RefreshCw className="h-4 w-4" />Try Again</button>}
          {(localPreviewUrl || activeEvidence) && <div className="mt-4"><FacultyDocumentViewer localFile={selectedFile} localPreviewUrl={localPreviewUrl} evidence={localPreviewUrl && !handoffEvidenceId ? null : activeEvidence} onPersistedReady={handlePersistedPreviewReady} /></div>}
        </section>

        <section className="mt-8 border-t border-slate-200 pt-6" aria-labelledby="details-heading"><h3 id="details-heading" className="text-base font-extrabold text-slate-950">Accomplishment Details</h3>{!config ? <p className="mt-2 text-sm text-slate-600">Choose a category and subcategory above to display the appropriate fields.</p> : <div className="mt-4 space-y-5">{config.dateMode === 'single' ? <label className="block max-w-sm"><span className="text-sm font-bold">{config.dateLabel}</span><input data-form-error={Boolean(errors.date)} type="date" max={new Date().toLocaleDateString('en-CA')} value={form.date} onChange={(event) => { markTouched('date'); setForm((old) => ({ ...old, date: event.target.value })) }} className={inputClass} />{errors.date && <span className="text-xs font-semibold text-rose-700">{errors.date}</span>}</label> : <div className="grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-bold">Start date</span><input data-form-error={Boolean(errors.startDate)} type="date" value={form.startDate} onChange={(event) => { markTouched('startDate'); setForm((old) => ({ ...old, startDate: event.target.value })) }} className={inputClass} /></label><label><span className="text-sm font-bold">End date</span><input data-form-error={Boolean(errors.endDate)} type="date" disabled={form.ongoing} value={form.endDate} onChange={(event) => { markTouched('endDate'); setForm((old) => ({ ...old, endDate: event.target.value })) }} className={inputClass} /></label>{config.allowOngoing && <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.ongoing} onChange={(event) => { markTouched('ongoing'); markTouched('endDate'); setForm((old) => ({ ...old, ongoing: event.target.checked, endDate: event.target.checked ? '' : old.endDate })) }} />Ongoing</label>}{errors.startDate && <span className="text-xs font-semibold text-rose-700">{errors.startDate}</span>}{errors.endDate && <span className="text-xs font-semibold text-rose-700">{errors.endDate}</span>}</div>}<div className="grid gap-4 sm:grid-cols-2">{config.fields.filter((field) => !field.showWhen || form.details[field.showWhen.field] === field.showWhen.equals).map((field) => <label key={field.name}><span className="text-sm font-bold">{field.label}{field.required === false ? ' (optional)' : ''}</span>{field.type === 'select' ? <select data-form-error={Boolean(errors[field.name])} value={form.details[field.name] || ''} onChange={(event) => { markTouched(`details.${field.name}`); setForm((old) => ({ ...old, details: { ...old.details, [field.name]: event.target.value } })) }} className={inputClass}><option value="">Select {field.label.toLowerCase()}</option>{field.options.map((value) => <option key={value} value={value}>{value}</option>)}</select> : <input data-form-error={Boolean(errors[field.name])} type={field.type === 'integer' ? 'number' : 'text'} min={field.min} maxLength={field.max} value={form.details[field.name] || ''} onChange={(event) => { markTouched(`details.${field.name}`); setForm((old) => ({ ...old, details: { ...old.details, [field.name]: event.target.value } })) }} className={inputClass} />}{suggestion?.extractedFields && form.details[field.name] && !touchedFields[`details.${field.name}`] && <span className="mt-1 block text-xs text-emerald-800">Found from document</span>}{errors[field.name] && <span className="text-xs font-semibold text-rose-700">{errors[field.name]}</span>}</label>)}</div></div>}</section>
        {draftMessage && <div role="status" className="mt-6 rounded-xl bg-sky-50 p-3 text-sm font-semibold text-sky-950">{draftMessage}</div>}{errors.form && <div role="alert" className="mt-6 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-900">{errors.form}</div>}
      </div>
      <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-7"><div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-start gap-2 text-xs text-slate-600"><Paperclip className="mt-0.5 h-4 w-4 shrink-0" />{finalSaveReason || 'Ready to validate and save.'}</p><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">Cancel</button><button type="button" onClick={saveDraft} disabled={saving} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 disabled:opacity-45">Save Draft</button><button type="submit" disabled={saving || uploadBusy || !classificationConfirmed || !form.persistedEvidence.length || hasInvalidRequiredFields} className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-45">{saving ? 'Saving…' : 'Save Accomplishment'}</button></div></div></footer>
    </form>}
  </section></div>
}
