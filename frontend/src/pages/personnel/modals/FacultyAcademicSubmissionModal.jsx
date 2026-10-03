import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, ArrowUpRight, Check, CheckCircle2, GraduationCap, LoaderCircle, RefreshCw, UploadCloud, X } from 'lucide-react'
import { DEGREE_LEVEL_LABELS, FACULTY_ACADEMIC_ENTRY_SCHEMA, facultyCategoryDisplayLabel, facultySchemaByCode, facultySubcategoryByCode } from '../../../config/facultyAcademicAccomplishmentSchema'
import { EMPTY_ACCOMPLISHMENT_FORM, mapAccomplishmentToForm, validateAccomplishmentForm } from '../../../utils/personnelAccomplishmentForm'
import personnelAccomplishmentService from '../../../services/personnelAccomplishmentService'
import { ocrService } from '../../../services/ocrService'
import OcrScanController from '../../../controllers/OcrScanController'
import FacultyDocumentViewer from './FacultyDocumentViewer'
import { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../../../services/PersonnelEvidenceUploadService'
import { confirmDialog } from '../../../components/ui/DialogProvider'
import { CardHeading, StepProgress } from './AccomplishmentModalParts'

const initialForm = () => ({ ...EMPTY_ACCOMPLISHMENT_FORM, area: '', categoryCode: '', subcategoryCode: '', details: {}, persistedEvidence: [], pendingEvidence: [] })
const categoryCodeFromSuggestion = (value = '') => String(value).match(/^([ABC]\.[0-9](?:\.[0-9])?)/)?.[1] || ''
const primaryTitle = (details, config) => config.fields.find((field) => field.type === 'text' && String(details[field.name] || '').trim())?.name
  ? details[config.fields.find((field) => field.type === 'text' && String(details[field.name] || '').trim()).name]
  : 'Faculty accomplishment'
const issuer = (details) => details.institution || details.organization || details.organizer || details.publisher_or_journal || details.granting_body || details.presenting_body || ''
const confidenceBand = (score) => score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low'
const formatBytes = (value) => {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes < 1) return ''
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
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

/** Degree level ('phd' | 'masters' | '') expressed by an OCR degree level or a degree title. */
export function degreeLevelKey(value = '') {
  const text = String(value)
  if (/ph\.?\s*d|doctor/i.test(text)) return 'phd'
  if (/master/i.test(text)) return 'masters'
  const resolved = OcrScanController.resolveDegreeLevel(text).value
  return resolved.startsWith('Ph.D.') ? 'phd' : resolved.startsWith('Master') ? 'masters' : ''
}

/** Returns the conflict between the document's degree level and the chosen subcategory, if any. */
export function detectDegreeMismatch(config, degreeText) {
  if (!config?.degreeLevel) return null
  const documentLevel = degreeLevelKey(degreeText)
  if (!documentLevel || documentLevel === config.degreeLevel) return null
  const category = facultySchemaByCode(config.categoryCode)
  const sameKind = (item) => item.dateMode === config.dateMode
  const fix = category?.subcategories.find((item) => item.degreeLevel === documentLevel && sameKind(item)) || category?.subcategories.find((item) => item.degreeLevel === documentLevel)
  return fix ? { documentLevel, documentLabel: DEGREE_LEVEL_LABELS[documentLevel], fixCode: fix.code } : null
}

// Legacy candidates for subcategories without an explicit `ocrMap` in the schema.
const legacyCandidates = (extracted) => ({
  degree_title: extracted.title, program: extracted.title, institution: extracted.issuer,
  title: extracted.title, activity_title: extracted.title, publication_title: extracted.title,
  research_title: extracted.title, award_title: extracted.title, material_title: extracted.title,
  creative_work: extracted.title, activity: extracted.title, organization: extracted.issuer,
  organizer: extracted.issuer, publisher_or_journal: extracted.issuer, granting_body: extracted.issuer,
  presenting_body: extracted.issuer, units_completed: extracted.unitsCompleted, scope: extracted.scopeLevel,
  role: extracted.specificRole === 'Participant' ? '' : extracted.specificRole,
  publication_type: extracted.pubType, recognition_status: extracted.awardType === 'Finalist' ? 'Nominee' : extracted.awardType,
  material_type: extracted.matType
})

/** OCR value proposed for each form key (`details.<name>`, `date`, `startDate`) of a subcategory. */
export function ocrCandidates(config, extracted = {}) {
  if (!config) return {}
  const map = config.ocrMap
  const legacy = legacyCandidates(extracted)
  const result = {}
  for (const field of config.fields) {
    const raw = map ? (map[field.name] ? extracted[map[field.name]] : '') : legacy[field.name]
    const value = raw == null ? '' : String(raw).trim()
    if (value && (!field.options || field.options.includes(value))) result[`details.${field.name}`] = value
  }
  const dateKey = config.dateMode === 'single' ? 'date' : 'startDate'
  const dateSource = map ? (map[dateKey] ? extracted[map[dateKey]] : '') : extracted.date
  if (dateSource) result[dateKey] = dateSource
  return result
}

export function mapOcrToForm(old, categoryCode, subcategoryCode, extracted = {}, touchedFields = {}, { overwrite = false } = {}) {
  const schema = facultySchemaByCode(categoryCode)
  const config = facultySubcategoryByCode(subcategoryCode)
  if (!schema || !config) return old
  const candidates = ocrCandidates(config, extracted)
  const pick = (key, currentValue) => {
    if (touchedFields[key]) return currentValue ?? ''
    const candidate = candidates[key] || ''
    return overwrite ? (candidate || currentValue || '') : (currentValue || candidate)
  }
  const details = Object.fromEntries(config.fields.map((field) => [field.name, pick(`details.${field.name}`, old.details?.[field.name])]))
  return {
    ...old, area: schema.area, categoryCode, subcategoryCode, details,
    date: config.dateMode === 'single' ? pick('date', old.date) : old.date,
    startDate: config.dateMode !== 'single' ? pick('startDate', old.startDate) : old.startDate
  }
}

/** Which form keys hold a value that came from the document, and whether it needs a human check. */
function buildProvenance(config, extracted, nextForm, touchedFields) {
  if (!config || !extracted) return {}
  const candidates = ocrCandidates(config, extracted)
  const valueOf = (key) => key.startsWith('details.') ? nextForm.details?.[key.slice(8)] : nextForm[key]
  const dateMeta = extracted.fieldMetadata?.date
  const result = {}
  for (const [key, candidate] of Object.entries(candidates)) {
    if (touchedFields[key] || String(valueOf(key) || '') !== String(candidate)) continue
    const isDate = key === 'date' || key === 'startDate'
    if (isDate && dateMeta?.inferred) {
      result[key] = { status: 'verify', note: `Taken from “${dateMeta.label}.” Check that this is the ${config.dateLabel?.toLowerCase().includes('conferred') ? 'date the degree was conferred' : 'correct date'}.` }
    } else if (isDate && dateMeta && Number(dateMeta.confidence) < 60) {
      result[key] = { status: 'verify', note: 'The scan was unclear here. Please check this date.' }
    } else {
      result[key] = { status: 'auto', note: '' }
    }
  }
  return result
}

function showSuccessToast(message) {
  if (typeof document === 'undefined') return
  const toast = document.createElement('div')
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  toast.textContent = message
  Object.assign(toast.style, { position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)', zIndex: '60', background: '#064e3b', color: '#fff', padding: '12px 18px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', boxShadow: '0 16px 40px -16px rgba(15,23,42,.6)', animation: 'faculty-toast-in .2s ease-out' })
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 4000)
}

const FILE_ACCEPT = [...ALLOWED_EXTENSIONS.map((extension) => `.${extension}`), ...ALLOWED_MIME_TYPES].join(',')
const AREA_NAMES = { A: 'Professional Development', B: 'Productivity & Creative Work', C: 'Service & Leadership' }
const BUSY_STATES = ['staging', 'uploading', 'ocr_processing', 'classification_pending']
const SCAN_FAILED_MESSAGE = "We couldn't read this document. Fill in the details manually or try a clearer scan."
const DUPLICATE_DOCUMENT_PREFIX = 'This document is already used'
const friendlyUploadError = (error) => {
  if (error?.error?.code === 'DUPLICATE_EVIDENCE') return error.error.message || `${DUPLICATE_DOCUMENT_PREFIX} for another accomplishment in your portfolio.`
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
  const [provenance, setProvenance] = useState({})
  const [activeEvidenceId, setActiveEvidenceId] = useState(null)
  const [ocrDocument, setOcrDocument] = useState(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [stagedId, setStagedId] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [classificationConfirmed, setClassificationConfirmed] = useState(false)
  const [classificationEditing, setClassificationEditing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [previewFlash, setPreviewFlash] = useState(false)
  const fileInput = useRef(null)
  const dialogRef = useRef(null)
  const previewRef = useRef(null)
  const formRef = useRef(null)
  const ids = useId()
  // Async upload/scan callbacks read the latest values, not the render they started in.
  const latest = useRef({ form, touchedFields, classificationEditing })
  latest.current = { form, touchedFields, classificationEditing }
  const config = useMemo(() => facultySubcategoryByCode(form.subcategoryCode), [form.subcategoryCode])
  const category = facultySchemaByCode(form.categoryCode)
  const effectiveAreaCode = String(form.mode === 'edit' && form.area ? form.area : areaCode || 'A').toUpperCase().replace('AREA', '').trim()
  const effectiveAreaName = areaName || AREA_NAMES[effectiveAreaCode] || 'Faculty Accomplishments'

  useEffect(() => {
    if (!isOpen) return
    let active = true
    const load = async () => {
      setErrors({}); setLoadError(''); setDocumentError(''); setSuggestion(null); setStagedId(null); setSelectedFile(null); setLocalPreviewUrl(''); setHandoffEvidenceId(null); setTouchedFields({}); setProvenance({}); setOcrDocument(null); setDraftMessage(''); setClassificationEditing(false)
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

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => dialogRef.current?.querySelector('[data-autofocus]')?.focus())
  }, [isOpen])

  if (!isOpen) return null
  const dirty = Boolean(stagedId || Object.keys(touchedFields).length || (form.originalSnapshot && JSON.stringify({ ...form, originalSnapshot: null }) !== form.originalSnapshot))
  const close = async () => {
    if (dirty && !(await confirmDialog({ title: 'Discard this accomplishment?', message: 'You have unsaved changes. If you close now, the uploaded document and details you entered will be lost.', confirmLabel: 'Discard', cancelLabel: 'Keep editing', tone: 'destructive' }))) return
    if (stagedId) { try { await personnelAccomplishmentService.deleteAccomplishment(stagedId) } catch { /* server cleanup can retry later */ } }
    onClose()
  }
  const onDialogKeyDown = (event) => {
    if (event.key === 'Escape') { event.stopPropagation(); close(); return }
    if (event.key !== 'Tab') return
    const focusable = Array.from(dialogRef.current?.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])') || []).filter((node) => node.offsetParent !== null)
    if (!focusable.length) return
    const first = focusable[0]; const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  const applyMapping = (categoryCode, subcategoryCode, extracted, touched, options) => {
    setForm((old) => {
      const next = mapOcrToForm(old, categoryCode, subcategoryCode, extracted || {}, touched, options)
      setProvenance(extracted ? buildProvenance(facultySubcategoryByCode(subcategoryCode), extracted, next, touched) : {})
      return next
    })
  }
  const selectClassification = async (categoryCode, subcategoryCode = '', { fromUser = true } = {}) => {
    const schema = facultySchemaByCode(categoryCode)
    if (!schema || schema.area !== effectiveAreaCode) return
    const changingExisting = form.mode === 'edit' && form.subcategoryCode && subcategoryCode && subcategoryCode !== form.subcategoryCode
    if (changingExisting && !(await confirmDialog({ title: 'Change classification?', message: 'Fields that only apply to the current category may be replaced by the new selection.', confirmLabel: 'Change', cancelLabel: 'Keep current' }))) return
    if (fromUser) setTouchedFields((old) => ({ ...old, classification: true }))
    if (!subcategoryCode) {
      setForm((old) => ({ ...old, area: effectiveAreaCode, categoryCode, subcategoryCode: '', details: {} }))
      setProvenance({})
      setClassificationConfirmed(false)
      return
    }
    applyMapping(categoryCode, subcategoryCode, suggestion?.extractedFields, touchedFields)
    setClassificationConfirmed(true)
  }
  const analyzeDocument = (backendDocument, { rescan = false } = {}) => {
    setDocumentState('classification_pending')
    const text = backendDocument?.text || ''
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const classification = OcrScanController.classifyCategory(text)
    const extractedFields = OcrScanController.extractFieldsFromText(text, lines, classification.category)
    const categoryCode = categoryCodeFromSuggestion(classification.category)
    const inCurrentArea = categoryCode.startsWith(`${effectiveAreaCode}.`)
    const subcategoryCode = inCurrentArea ? suggestedSubcategory(categoryCode, extractedFields) : ''
    const band = confidenceBand(classification.confidence)
    const nextSuggestion = { ...classification, label: facultyCategoryDisplayLabel(categoryCode), categoryCode: inCurrentArea ? categoryCode : '', subcategoryCode, extractedFields, band, areaMismatch: Boolean(text) && !inCurrentArea, warnings: backendDocument?.warnings || [] }
    setSuggestion(nextSuggestion)
    // The document drives classification unless the faculty member already chose one
    // (a later mismatch alert covers any conflict). A Re-scan resets manual edits.
    const { form, touchedFields: currentTouched, classificationEditing } = latest.current
    const touched = rescan ? {} : currentTouched
    if (rescan) setTouchedFields({})
    const keepUserClassification = !rescan && touched.classification && form.subcategoryCode
    const lockedByEdit = form.mode === 'edit' && !classificationEditing && form.subcategoryCode
    if (text && !keepUserClassification && !lockedByEdit && nextSuggestion.categoryCode && subcategoryCode) {
      applyMapping(categoryCode, subcategoryCode, extractedFields, touched, { overwrite: rescan })
      setClassificationConfirmed(true)
    } else if (text && !keepUserClassification && !lockedByEdit && nextSuggestion.categoryCode && !form.categoryCode) {
      setForm((old) => ({ ...old, area: effectiveAreaCode, categoryCode, subcategoryCode: '', details: {} }))
    } else if (text && form.subcategoryCode) {
      applyMapping(form.categoryCode, form.subcategoryCode, extractedFields, touched, { overwrite: rescan })
    }
    setDocumentState(text ? (backendDocument?.quality?.label === 'review' ? 'ocr_partial' : 'ocr_completed') : 'ocr_failed')
    if (!text) setDocumentError(SCAN_FAILED_MESSAGE)
  }
  const runOcr = async (evidenceId = activeEvidenceId, options = {}) => {
    if (!evidenceId) { setDocumentError('Upload the document before retrying text extraction.'); return }
    setDocumentError(''); setDocumentState('ocr_processing')
    try {
      const backendDocument = await retryTemporaryOperation(() => ocrService.extractPersisted(evidenceId))
      setOcrDocument(backendDocument)
      analyzeDocument(backendDocument, options)
    } catch {
      setDocumentState('ocr_failed')
      setDocumentError(SCAN_FAILED_MESSAGE)
    }
  }
  const processFile = async (file, { reuseLocalPreview = false } = {}) => {
    if (!file || BUSY_STATES.includes(documentState)) return
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
      await runOcr(evidence.id) // scan starts automatically after upload
    } catch (error) { setDocumentState('upload_failed'); setDocumentError(friendlyUploadError(error)) }
  }
  const editField = (key, patch) => {
    setTouchedFields((old) => ({ ...old, [key]: true }))
    setProvenance((old) => { if (!old[key]) return old; const next = { ...old }; delete next[key]; return next })
    setForm(patch)
  }
  const verifyField = (key) => setProvenance((old) => old[key]?.status === 'verify' ? { ...old, [key]: { ...old[key], status: 'auto', note: '' } } : old)
  const showInDocument = () => {
    // OCR returns plain text without word coordinates, so we bring the top of the
    // document into view and flash the preview instead of highlighting exact text.
    const viewport = previewRef.current
    if (!viewport) return
    viewport.scrollTo?.({ top: 0, behavior: 'smooth' })
    viewport.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
    setPreviewFlash(false); requestAnimationFrame(() => setPreviewFlash(true)); setTimeout(() => setPreviewFlash(false), 1300)
  }
  const cancelReplacement = () => { setSelectedFile(null); setLocalPreviewUrl(''); setHandoffEvidenceId(null); setDocumentState(form.persistedEvidence.length ? 'persisted' : 'idle'); setDocumentError('') }
  const handlePersistedPreviewReady = (evidenceId) => {
    if (evidenceId !== handoffEvidenceId) return
    setSelectedFile(null); setLocalPreviewUrl(''); setHandoffEvidenceId(null)
  }
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

  const busy = BUSY_STATES.includes(documentState)
  const uploadBusy = ['staging', 'uploading'].includes(documentState)
  const scanning = ['ocr_processing', 'classification_pending'].includes(documentState)
  const activeEvidence = form.persistedEvidence.find((item) => item.id === activeEvidenceId) || form.persistedEvidence[0]
  const hasDocument = Boolean(localPreviewUrl || activeEvidence)
  const areaCategories = FACULTY_ACADEMIC_ENTRY_SCHEMA.filter((item) => item.area === effectiveAreaCode && !item.derived)
  const liveValidationErrors = config ? validateAccomplishmentForm(form, config) : {}
  const missingRequired = Object.keys(liveValidationErrors).filter((key) => key !== 'evidence')
  const pendingVerification = Object.entries(provenance).filter(([, value]) => value.status === 'verify').map(([key]) => key)
  const degreeText = form.details.degree_title || form.details.program || suggestion?.extractedFields?.title || suggestion?.extractedFields?.degreeLevel || ''
  const mismatch = detectDegreeMismatch(config, degreeText)
  const detectedCount = Object.keys(provenance).length
  const reviewItems = (form.subcategoryCode ? 0 : 1) + missingRequired.length + pendingVerification.length + (mismatch ? 1 : 0)
  const submitBlocker = !hasDocument || !form.persistedEvidence.length
    ? 'Attach a supporting document to submit.'
    : busy ? 'Wait for the document to finish uploading and reading.'
      : !form.categoryCode || !form.subcategoryCode ? 'Choose a category and subcategory.'
        : mismatch ? 'Resolve the classification warning first.'
          : missingRequired.length ? `Complete ${missingRequired.length} required field${missingRequired.length === 1 ? '' : 's'}.`
            : pendingVerification.length ? `Check ${pendingVerification.length} field${pendingVerification.length === 1 ? '' : 's'} marked “Please verify.”`
              : !classificationConfirmed ? 'Confirm the classification.'
                : ''
  const status = !hasDocument && documentState === 'idle'
    ? { tone: 'bg-slate-400', text: 'Upload a document to begin' }
    : busy ? { tone: 'bg-amber-500', text: uploadBusy ? 'Uploading document…' : 'Reading document…' }
      : submitBlocker ? { tone: 'bg-amber-500', text: reviewItems ? `${reviewItems} item${reviewItems === 1 ? '' : 's'} need${reviewItems === 1 ? 's' : ''} your review` : submitBlocker }
        : { tone: 'bg-emerald-600', text: 'Ready to submit' }
  const step = !hasDocument ? 1 : submitBlocker ? 2 : 3
  const chipState = (n) => n === step ? 'active' : n < step ? 'done' : 'todo'

  const save = async (event) => {
    event.preventDefault()
    if (submitBlocker) { setErrors({ form: submitBlocker }); return }
    const nextErrors = validateAccomplishmentForm(form, config); setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { formRef.current?.querySelector('[data-form-error="true"]')?.focus(); return }
    setSaving(true)
    try {
      const occurrenceDate = config.dateMode === 'single' ? form.date : (form.endDate || form.startDate)
      const payload = { title: String(primaryTitle(form.details, config)).trim(), issuer: issuer(form.details), location: issuer(form.details), date_achieved: occurrenceDate, date: occurrenceDate, category: `${category.code} ${category.label}`, category_area: `area${category.area}`, category_metadata: { portfolio_format: 'faculty_academic', criterion_code: category.code, subcategory_code: config.code, faculty_confirmed_category: true, ocr_confidence_band: suggestion?.band || null, matched_signals: suggestion?.matchedKeywords || [], date_mode: config.dateMode, start_date: form.startDate || null, end_date: form.endDate || null, ongoing: form.ongoing, details: form.details }, description: '', status: 'Pending Review' }
      const duplicate = await personnelAccomplishmentService.checkDuplicate({ ...payload, exclude_id: form.id || stagedId || undefined })
      if (duplicate?.exact_duplicate) { setErrors({ form: 'This exact accomplishment already exists. Open the existing record instead.' }); return }
      if (stagedId) { await personnelAccomplishmentService.updateAccomplishment(stagedId, payload); await onSubmitAccomplishment?.(payload, null, { alreadyPersisted: true, id: stagedId }); setStagedId(null) }
      else { const saved = await onSubmitAccomplishment?.(payload, null); if (saved === false) throw new Error('The server did not save the accomplishment.') }
      showSuccessToast('✓ Accomplishment submitted for validation')
      onClose()
    } catch (error) { setErrors({ form: error?.message || 'The accomplishment could not be saved. Try again.' }) } finally { setSaving(false) }
  }

  const baseInput = 'mt-1.5 w-full rounded-lg border px-3 py-2 text-base outline-none transition-colors focus-visible:border-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-700/30 disabled:bg-slate-100 disabled:text-slate-500 min-[820px]:text-sm'
  const inputTone = (key) => provenance[key]?.status === 'verify' ? 'border-amber-400 bg-amber-50' : provenance[key] ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-300 bg-white'
  const fieldId = (key) => `${ids}-${key.replace(/\W/g, '-')}`
  const renderPill = (key, label) => {
    const meta = provenance[key]
    if (!meta) return null
    const verify = meta.status === 'verify'
    return <button type="button" onClick={showInDocument} aria-label={`${verify ? 'Please verify' : 'From document'}: show ${label} in the document preview`} className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold align-middle focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${verify ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'}`}>{verify ? 'Please verify' : 'From document'}<ArrowUpRight className="h-3 w-3" aria-hidden="true" /></button>
  }
  const renderHelp = (key, error) => <>
    {provenance[key]?.status === 'verify' && provenance[key].note && <span id={`${fieldId(key)}-help`} className="mt-1 block text-xs text-amber-900">{provenance[key].note}</span>}
    {error && <span id={`${fieldId(key)}-error`} className="mt-1 block text-xs font-semibold text-rose-700">{error}</span>}
  </>
  const describedBy = (key, error) => [provenance[key]?.status === 'verify' && `${fieldId(key)}-help`, error && `${fieldId(key)}-error`].filter(Boolean).join(' ') || undefined
  const renderDateInput = (key, label, extra = {}) => <div>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><label htmlFor={fieldId(key)} className="text-sm font-bold text-slate-900">{label}</label>{renderPill(key, label)}</div>
    <input id={fieldId(key)} data-form-error={Boolean(errors[key])} aria-invalid={Boolean(errors[key]) || undefined} aria-describedby={describedBy(key, errors[key])} type="date" max={new Date().toLocaleDateString('en-CA')} value={form[key] || ''} onFocus={() => verifyField(key)} onChange={(event) => { const value = event.target.value; editField(key, (old) => ({ ...old, [key]: value })) }} className={`${baseInput} ${inputTone(key)}`} {...extra} />
    {renderHelp(key, errors[key])}
  </div>

  const isDuplicateDocument = documentError.startsWith(DUPLICATE_DOCUMENT_PREFIX)
  const documentStatusText = documentState === 'staging' ? 'Preparing your draft…' : documentState === 'uploading' ? 'Uploading document…' : scanning ? 'Reading your document…' : null

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-0 min-[820px]:p-6">
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="faculty-entry-title" onKeyDown={onDialogKeyDown} className="flex h-full w-full flex-col overflow-hidden bg-[#fbfcf8] shadow-[0_24px_70px_-24px_rgba(15,23,42,.55)] min-[820px]:h-[min(760px,calc(100vh-48px))] min-[820px]:w-[1100px] min-[820px]:max-w-full min-[820px]:rounded-2xl">
      <header className="shrink-0 bg-emerald-950 px-5 py-3.5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10"><GraduationCap className="h-5 w-5" aria-hidden="true" /></span><div className="min-w-0"><h2 id="faculty-entry-title" className="text-lg font-extrabold tracking-[-0.02em]">{form.mode === 'edit' ? 'Edit Accomplishment' : 'New Accomplishment'}</h2><p className="truncate text-sm text-emerald-50/90">Area {effectiveAreaCode} · {effectiveAreaName}</p></div></div>
          <div className="flex items-center gap-3">
            <StepProgress chipState={chipState} />
            <button type="button" data-autofocus onClick={close} className="rounded-lg p-2 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close accomplishment form"><X className="h-5 w-5" /></button>
          </div>
        </div>
      </header>
      {loading ? <div className="grid flex-1 place-items-center p-8 text-sm font-semibold text-slate-700"><span><LoaderCircle className="mr-2 inline h-5 w-5 animate-spin" />Loading saved accomplishment…</span></div> : loadError ? <div className="grid flex-1 place-items-center p-8 text-center"><div><p className="font-extrabold">Unable to load accomplishment.</p><p className="mt-2 text-sm text-slate-600">{loadError}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white">Try Again</button></div></div> : <form ref={formRef} onSubmit={save} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto min-[820px]:grid min-[820px]:grid-cols-[46fr_54fr] min-[820px]:overflow-hidden">
          {/* LEFT: the document */}
          <div className="flex h-[22rem] min-h-0 flex-col border-b border-slate-200 bg-slate-100 min-[820px]:h-auto min-[820px]:border-b-0 min-[820px]:border-r">
            {hasDocument
              ? <FacultyDocumentViewer fill scanning={scanning} highlight={previewFlash} viewportRef={previewRef} localFile={selectedFile} localPreviewUrl={localPreviewUrl} evidence={localPreviewUrl && !handoffEvidenceId ? null : activeEvidence} onPersistedReady={handlePersistedPreviewReady} />
              : <div className="flex flex-1 p-4 min-[820px]:p-5"><button type="button" disabled={uploadBusy} onClick={() => fileInput.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); setDragActive(false); processFile(event.dataTransfer.files?.[0]) }} aria-describedby={`${ids}-drop-hint`} className={`flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${dragActive ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-white hover:border-emerald-600 hover:bg-emerald-50/40'}`}>
                  <UploadCloud className="h-10 w-10 text-emerald-800" aria-hidden="true" />
                  <span className="mt-3 text-base font-extrabold text-slate-950">Drop your certificate here</span>
                  <span className="mt-1 text-sm text-slate-700">or <span className="font-bold text-emerald-800 underline underline-offset-2">browse files</span></span>
                  <span id={`${ids}-drop-hint`} className="mt-4 text-xs text-slate-600">PDF, JPG, PNG · max 10 MB<br />We&apos;ll read it and fill in the form for you</span>
                </button></div>}
            <input ref={fileInput} type="file" accept={FILE_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; processFile(file) }} />
          </div>

          {/* RIGHT: review */}
          <div className="min-h-0 space-y-3 p-4 min-[820px]:overflow-y-auto min-[820px]:p-5">
            <section aria-labelledby="supporting-document-heading" className="rounded-xl border border-slate-200 bg-white p-4">
              <CardHeading id="supporting-document-heading" number={1} title="Supporting document" />
              {!hasDocument && documentState === 'idle' && <p className="mt-2 text-sm text-slate-600">No document yet. Upload one on the left to get started.</p>}
              {hasDocument && <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-900 text-[10px] font-extrabold uppercase text-white">{String((selectedFile?.name || activeEvidence?.original_filename || 'file').split('.').pop()).slice(0, 4)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950">{selectedFile?.name || activeEvidence?.original_filename || 'Uploaded document'}</p>
                  <p className="text-xs text-slate-600">{formatBytes(selectedFile?.size || activeEvidence?.byte_size || activeEvidence?.file_size)}{documentStatusText ? <span role="status" className="ml-1.5 inline-flex items-center gap-1 font-semibold text-amber-800"><LoaderCircle className="h-3 w-3 animate-spin" aria-hidden="true" />{documentStatusText === 'Reading your document…' ? 'Reading document…' : documentStatusText}</span> : detectedCount ? <span className="ml-1.5 font-semibold text-emerald-800">✓ {detectedCount} field{detectedCount === 1 ? '' : 's'} detected</span> : null}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {activeEvidence && !busy && <button type="button" onClick={() => runOcr(activeEvidence.id, { rescan: true })} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />{suggestion || ocrDocument ? 'Re-scan' : 'Scan'}</button>}
                  <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="rounded-md px-2 py-1.5 text-xs font-bold text-slate-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50">Replace</button>
                </div>
              </div>}
              {scanning && <p className="mt-2 text-sm text-slate-700" aria-live="polite">Reading your document…</p>}
              {errors.evidence && <p role="alert" className="mt-2 text-sm font-semibold text-rose-700">{errors.evidence}</p>}
              {documentState === 'upload_failed' && <div role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950"><p className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{documentError}</p><div className="mt-2 flex flex-wrap gap-2">{isDuplicateDocument ? <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white"><UploadCloud className="h-3.5 w-3.5" />Choose Another File</button> : <button type="button" onClick={() => selectedFile ? processFile(selectedFile, { reuseLocalPreview: true }) : fileInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white"><RefreshCw className="h-3.5 w-3.5" />Retry Upload</button>}{activeEvidence && selectedFile && <button type="button" onClick={cancelReplacement} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-white">Cancel Replacement</button>}</div></div>}
              {documentState === 'ocr_failed' && <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-950"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><div><p>{SCAN_FAILED_MESSAGE}</p><button type="button" onClick={() => runOcr()} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-950"><RefreshCw className="h-3.5 w-3.5" />Try Again</button></div></div>}
              {documentState === 'ocr_partial' && <p className="mt-2 text-xs text-amber-900">Some details were found. Please review them.</p>}
              {suggestion?.areaMismatch && <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-950">This document may belong to another Area ({suggestion.category}). Keep Area {effectiveAreaCode} only if that is correct.</p>}
            </section>

            <section aria-labelledby="classification-heading" className="rounded-xl border border-slate-200 bg-white p-4">
              <CardHeading id="classification-heading" number={2} title="Classification" aside={form.mode === 'edit' && form.subcategoryCode ? <button type="button" onClick={() => setClassificationEditing((value) => !value)} className="rounded-md px-2 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{classificationEditing ? 'Keep Saved Classification' : 'Change Classification'}</button> : null} />
              {form.mode === 'edit' && !classificationEditing && form.subcategoryCode
                ? <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"><p className="text-sm font-bold text-slate-950">{facultyCategoryDisplayLabel(form.categoryCode)}</p><p className="text-sm text-slate-600">{config?.label}</p></div>
                : <div className="mt-3 grid gap-3 min-[820px]:grid-cols-2">
                  <div><label htmlFor={`${ids}-category`} className="text-sm font-bold text-slate-900">Category</label><select id={`${ids}-category`} value={form.categoryCode} onChange={(event) => selectClassification(event.target.value)} className={`${baseInput} border-slate-300 bg-white`}><option value="">Select category</option>{areaCategories.map((item) => <option key={item.code} value={item.code}>{facultyCategoryDisplayLabel(item.code)}</option>)}</select></div>
                  <div><label htmlFor={`${ids}-subcategory`} className="text-sm font-bold text-slate-900">Subcategory</label><select id={`${ids}-subcategory`} value={form.subcategoryCode} disabled={!form.categoryCode} onChange={(event) => selectClassification(form.categoryCode, event.target.value)} className={`${baseInput} border-slate-300 bg-white`}><option value="">{form.categoryCode ? 'Select subcategory' : 'Choose a category first'}</option>{category?.subcategories?.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></div>
                </div>}
              {suggestion?.label && !suggestion.areaMismatch && suggestion.categoryCode === form.categoryCode && !touchedFields.classification && <p className="mt-2 text-xs text-emerald-800">Suggested from your document: {suggestion.label}</p>}
              {mismatch && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"><p className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" /><span>Your document shows a {mismatch.documentLabel} degree, but <strong>{config.label}</strong> is selected.</span></p><button type="button" onClick={() => selectClassification(form.categoryCode, mismatch.fixCode)} className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2">Use {mismatch.documentLabel}</button></div>}
            </section>

            <section aria-labelledby="details-heading" className="rounded-xl border border-slate-200 bg-white p-4">
              <CardHeading id="details-heading" number={3} title="Accomplishment details" />
              {!config ? <p className="mt-2 text-sm text-slate-600">{hasDocument ? 'Choose a subcategory to show its fields.' : 'Fields appear here once the document is read or a subcategory is chosen.'}</p> : <div className="mt-3 grid gap-3 min-[820px]:grid-cols-2">
                {config.fields.filter((field) => !field.showWhen || form.details[field.showWhen.field] === field.showWhen.equals).map((field) => {
                  const key = `details.${field.name}`
                  const error = errors[field.name]
                  const common = { id: fieldId(key), 'data-form-error': Boolean(error), 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': describedBy(key, error), value: form.details[field.name] || '', onFocus: () => verifyField(key), onChange: (event) => { const value = event.target.value; editField(key, (old) => ({ ...old, details: { ...old.details, [field.name]: value } })) }, className: `${baseInput} ${inputTone(key)}` }
                  return <div key={field.name} className={field.max > 255 ? 'min-[820px]:col-span-2' : ''}>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><label htmlFor={fieldId(key)} className="text-sm font-bold text-slate-900">{field.label}{field.required === false && <span className="text-xs font-medium text-slate-600"> · optional</span>}</label>{renderPill(key, field.label)}</div>
                    {field.type === 'select' ? <select {...common}><option value="">Select {field.label.toLowerCase()}</option>{field.options.map((value) => <option key={value} value={value}>{value}</option>)}</select> : <input {...common} type={field.type === 'integer' ? 'number' : 'text'} min={field.min} maxLength={field.max} placeholder={field.placeholder} />}
                    {renderHelp(key, error)}
                  </div>
                })}
                {config.dateMode === 'single' ? renderDateInput('date', config.dateLabel) : <>
                  {renderDateInput('startDate', 'Start date')}
                  {renderDateInput('endDate', 'End date', { disabled: form.ongoing })}
                  {config.allowOngoing && <label className="flex items-center gap-2 text-sm font-semibold text-slate-800"><input type="checkbox" checked={form.ongoing} onChange={(event) => { const checked = event.target.checked; setTouchedFields((old) => ({ ...old, ongoing: true, endDate: true })); setForm((old) => ({ ...old, ongoing: checked, endDate: checked ? '' : old.endDate })) }} className="h-4 w-4 accent-emerald-800" />Ongoing</label>}
                </>}
              </div>}
            </section>
            {draftMessage && <div role="status" className="rounded-lg bg-sky-50 p-3 text-sm font-semibold text-sky-950">{draftMessage}</div>}
            {errors.form && <div role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-900">{errors.form}</div>}
          </div>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3">
          <div className="flex flex-col-reverse gap-3 min-[820px]:flex-row min-[820px]:items-center min-[820px]:justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800" aria-live="polite"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.tone}`} aria-hidden="true" />{status.text}{status.text !== 'Ready to submit' && hasDocument && !busy && submitBlocker && <span className="sr-only">. {submitBlocker}</span>}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={close} className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">Cancel</button>
              <button type="button" onClick={saveDraft} disabled={saving} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-45">Save Draft</button>
              <span title={submitBlocker || undefined}><button type="submit" disabled={saving || Boolean(submitBlocker)} aria-describedby={submitBlocker ? `${ids}-submit-blocker` : undefined} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45">{saving ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />Adding…</> : <><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Add Accomplishment</>}</button></span>
              {submitBlocker && <span id={`${ids}-submit-blocker`} className="sr-only">{submitBlocker}</span>}
            </div>
          </div>
        </footer>
      </form>}
    </section>
  </div>
}
