import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, ChevronDown, Download, FileCheck2, FileSpreadsheet, Filter, History as HistoryIcon, LoaderCircle, RefreshCw, Search, UploadCloud, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { confirmAnnualReviewImport, downloadAnnualReviewImport, fetchAnnualReviewHistory, fetchDeanAnnualReviews, fetchReviewerTrackRoster, previewAnnualReviewImports } from '../../services/deanAnnualReviewService'
import { annualReviewRequestError } from '../../utils/annualReviewError'
import { annualReviewModalState, annualReviewRatingResult } from '../../utils/annualReviewModal'
import AnnualReviewViewerDialog from './AnnualReviewViewerDialog'

const title = value => value ? value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()) : 'Missing'
const statusStyle = status => status === 'passed' || status === 'eligible' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200' : status === 'not_passed' || status === 'not_eligible' ? 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200' : 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100'
function Status({ value, eligibility = false, label = null }) { return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset ${statusStyle(value)}`}>{label || (eligibility && value === 'not_eligible' ? 'Not Eligible' : title(value || 'pending'))}</span> }
const issueMessage = item => {
  if (item.match_status === 'wrong_person') return `Workbook does not match this personnel. Expected ${item.expected_personnel_name || 'the selected personnel'}; found ${item.detected_personnel_name || 'an unreadable name'}. Choose another file.`
  const code = String(item.state || '').toLowerCase()
  if (code.includes('school_year_mismatch')) return String(item.issues?.[0] || 'The workbook school years do not match this ranking period.').replace(/^[A-Z_]+:\s*/, '')
  if (code.includes('unsupported_template') && /Non-Teaching|NTF|school years/i.test(item.issues?.[0] || '')) return String(item.issues[0]).replace(/^[A-Z_]+:\s*/, '')
  if (code.includes('unsupported_template')) return 'Unsupported annual review format. Use the approved workbook with the “SUMMARY 1st & 2nd” worksheet and labels.'
  if (code.includes('invalid_rating')) return 'Unrecognized Performance Rating. Use Outstanding, Very Satisfactory, Satisfactory, Fair, or Poor.'
  if (code.includes('malformed')) return 'We could not read this workbook. It may be damaged or password-protected. Choose another file.'
  if (code === 'duplicate_upload') return 'This exact workbook is already the authoritative annual-review workbook. No duplicate will be created.'
  return item.issues?.[0] || 'This workbook needs attention before it can be confirmed.'
}

function ReviewResult({ schoolYear, rating, result: suppliedResult }) {
  const result = suppliedResult || annualReviewRatingResult(rating)
  return <div className="border-t border-slate-200 py-3 first:border-t-0 dark:border-slate-800"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold text-slate-500">{schoolYear || 'Required school year'}</p><p className="mt-0.5 font-bold text-slate-950 dark:text-white">{rating ? title(rating) : 'No Performance Rating found'}</p></div><Status value={result} /></div></div>
}

// Rows HR can see but another authority manages (Option 2: institution-wide read-only view).
function authorityLabel(authority = {}) {
  if (authority.status === 'unresolved') return 'Reviewer unresolved'
  if (authority.authority_type === 'DEAN') return `Managed by Dean${authority.authority_name ? ` ${authority.authority_name}` : ''}`
  if (authority.authority_type === 'HR') return 'Managed by HR'
  return 'Managed by another authority'
}

function ReadOnlyActions({ item }) {
  const authority = item.responsible_authority || {}
  return <div className="rounded-lg border border-dashed border-slate-300 px-2.5 py-2 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:text-slate-300"><p className="font-bold text-slate-800 dark:text-slate-100">View only</p><p>{authority.status === 'unresolved' ? (authority.reason || 'No responsible reviewer could be resolved. Check College and Dean assignments.') : `${authorityLabel(authority)} uploads and confirms this annual review.`}</p></div>
}

// Read from the uploaded workbook. "Applied Status" in the NDMU workbook is the rank applied for.
function WorkbookHeaderField({ label, value, inspected }) {
  return <div><p className="text-xs font-bold text-slate-500">{label}</p><p className={`mt-1 font-semibold ${value ? '' : 'text-slate-400'}`}>{value || (inspected ? 'Not found in workbook' : 'From workbook')}</p></div>
}

// Advisory comparison of the workbook's Present Rank and Applied Status against the seeded rank catalog.
// It recommends only; it never edits the workbook or any rank decision.
// Present Rank: the AchieveNest record is authoritative; the workbook value is checked against it.
function PresentRankField({ systemRank, workbookRank, check, inspected }) {
  const status = check?.status
  const tone = status === 'match' ? 'text-emerald-700' : status ? 'text-amber-700' : 'text-slate-500'
  return <div><p className="text-xs font-bold text-slate-500">Present Rank</p><p className={`mt-1 font-semibold ${systemRank ? '' : 'text-slate-400'}`}>{systemRank || 'Not recorded in AchieveNest'}</p>{inspected && <p className={`mt-0.5 text-xs font-semibold ${tone}`}>Workbook: {workbookRank || 'not found'}{status === 'match' ? ' · matches' : status === 'mismatch' ? ' · does not match' : ''}</p>}</div>
}

// HR master-data fields the eligibility service reports as missing. Eligibility is recalculated
// on every load, so it updates by itself once HR records these values.
function MissingHrRequirements({ items, compact = false }) {
  if (!items?.length) return null
  if (compact) return <p className="mt-2 text-xs font-semibold leading-5 text-amber-800 dark:text-amber-300">Missing: {items.map(item => item.label).join(', ')}</p>
  return <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
    <p className="font-bold">Missing: {items.map(item => item.label).join(', ')}</p>
    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs leading-5">{items.map(item => <li key={`${item.field}-${item.detail}`}>{item.detail}</li>)}</ul>
    <p className="mt-1.5 text-xs">Recorded by HR in {items[0].source}. Eligibility updates automatically once it is recorded.</p>
  </div>
}

function RankAlignmentNotice({ alignment }) {
  if (!alignment?.status) return null
  const ok = alignment.status === 'aligned' && (!alignment.present_rank_check || alignment.present_rank_check.status === 'match')
  const neutral = ['terminal', 'not_applicable'].includes(alignment.status)
  const tone = ok ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : neutral ? 'border-slate-200 bg-slate-50 text-slate-800' : 'border-amber-200 bg-amber-50 text-amber-950'
  const heading = ok ? 'Present Rank and Applied Status are consistent' : alignment.present_rank_check?.status === 'mismatch' ? 'Workbook Present Rank differs from AchieveNest' : alignment.status === 'aligned_requires_phd' ? 'Applied Status needs a verified PhD' : neutral ? 'No rank recommendation' : 'Applied Status does not match the rank progression'
  const recommended = alignment.recommended_rank?.display_label
  const showRecommendation = recommended && !ok && !neutral && alignment.applied_rank?.rank_code !== alignment.recommended_rank?.rank_code
  return <section aria-live="polite" className={`mt-4 rounded-xl border p-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${tone}`}>
    <p className="font-bold">{heading}</p>
    {alignment.present_rank_check && alignment.present_rank_check.status !== 'match' && <p className="mt-1 leading-6"><span className="font-bold">Present Rank:</span> {alignment.present_rank_check.message}</p>}
    <p className="mt-1 leading-6"><span className="font-bold">Applied Status:</span> {alignment.message}</p>
    {showRecommendation && <p className="mt-2"><span className="text-xs font-bold uppercase tracking-wide opacity-70">Recommended Applied Status</span><br /><span className="font-black">{recommended}</span> <span className="text-xs opacity-70">(next rank after {(alignment.basis === 'system' ? alignment.system_present_rank : alignment.present_rank)?.display_label} in the seeded rank catalog)</span></p>}
    {!ok && !neutral && <p className="mt-2 text-xs opacity-80">This is a recommendation only. The workbook is not changed; correct it and upload again if needed.</p>}
  </section>
}

function AnnualReviewUploadModal({ person, periodId, onClose, onImported, returnFocusRef }) {
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const errorHeadingRef = useRef(null)
  const selectedFileRef = useRef(null)
  const [modal, setModal] = useState({ state: 'idle', preview: null, requiredYears: [], error: null, eligibility: null, retryAction: 'inspect' })
  const [correctionReason, setCorrectionReason] = useState('')
  const preview = modal.preview

  const close = useCallback(() => {
    if (['inspecting', 'confirming'].includes(modal.state)) return
    onClose()
    requestAnimationFrame(() => returnFocusRef?.current?.focus())
  }, [modal.state, onClose, returnFocusRef])

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.focus()
    const onKeyDown = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close])

  useEffect(() => {
    if (['error', 'requires_attention'].includes(modal.state)) errorHeadingRef.current?.focus()
  }, [modal.state])

  const chooseFile = () => inputRef.current?.click()
  const inspect = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    selectedFileRef.current = file
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setModal(value => ({ ...value, state: 'error', preview: null, retryAction: 'inspect', error: { title: 'Unsupported annual review format', message: 'Choose the approved annual-review workbook in .xlsx format.' } })); return
    }
    if (file.size > 10 * 1024 * 1024) {
      setModal(value => ({ ...value, state: 'error', preview: null, retryAction: 'inspect', error: { title: 'Workbook is too large', message: 'Maximum file size: 10 MB. Choose another file.' } })); return
    }
    setModal({ state: 'inspecting', preview: null, requiredYears: [], error: null, eligibility: null, retryAction: 'inspect' })
    try {
      const result = await previewAnnualReviewImports([file], periodId, person.id)
      const item = result?.imports?.[0]
      if (!item) throw new Error('The server returned no workbook inspection result.')
      setModal({ state: annualReviewModalState(item), preview: item, requiredYears: result.required_school_years || [], error: null, eligibility: null, retryAction: 'inspect' })
    } catch (failure) {
      setModal({ state: 'error', preview: null, requiredYears: [], error: annualReviewRequestError(failure), eligibility: null, retryAction: 'inspect' })
    }
  }
  const retry = () => modal.retryAction === 'confirm' ? confirm() : selectedFileRef.current ? inspect({ target: { files: [selectedFileRef.current], value: '' } }) : chooseFile()
  const confirm = async () => {
    if (modal.state !== 'ready' || !preview?.id) return
    setModal(value => ({ ...value, state: 'confirming', error: null }))
    try {
      await confirmAnnualReviewImport(preview.id, { personnel_profile_id: person.id, correction_reason: correctionReason.trim() || undefined })
      const refreshed = await onImported()
      const refreshedPerson = (refreshed?.personnel || []).find(item => item.personnel?.id === person.id)
      setModal(value => ({ ...value, state: 'success', eligibility: refreshedPerson?.eligibility || null }))
    } catch (failure) {
      setModal(value => ({ ...value, state: 'error', retryAction: 'confirm', error: annualReviewRequestError(failure, 'The import was not saved. Review the workbook and try again.') }))
    }
  }
  const attentionTitle = preview?.match_status === 'wrong_person' ? 'Workbook does not match this personnel' : preview?.state?.includes('invalid_rating') ? 'Unrecognized Performance Rating' : preview?.state?.includes('school_year_mismatch') ? 'School years do not match this ranking period' : preview?.state?.includes('unsupported') ? 'Unsupported annual review format' : 'Annual review requires attention'
  const eligibility = modal.eligibility?.submission_readiness_status || modal.eligibility?.eligibility_status || 'pending'

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-6" onMouseDown={event => event.target === event.currentTarget && close()}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="annual-review-upload-title" aria-describedby="annual-review-upload-description" tabIndex={-1} className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl outline-none sm:max-w-2xl sm:rounded-2xl dark:bg-slate-950">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950"><div><h2 id="annual-review-upload-title" className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{modal.state === 'success' ? 'Annual Review Imported' : 'Upload Annual Review'}</h2><p id="annual-review-upload-description" className="mt-1 text-sm text-slate-600 dark:text-slate-300">{modal.state === 'success' ? 'The workbook is now part of this personnel’s annual-review record.' : 'Inspection stores a secure preview; eligibility changes only after confirmation.'}</p></div><button type="button" onClick={close} disabled={['inspecting', 'confirming'].includes(modal.state)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40 dark:hover:bg-slate-900" aria-label="Close upload modal"><X className="h-5 w-5" /></button></header>
      <div className="space-y-5 p-5">
        <div className="grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-3 dark:border-slate-800"><div><p className="text-xs font-bold text-slate-500">Personnel</p><p className="mt-1 font-bold text-slate-950 dark:text-white">{person.full_name}</p></div><div><p className="text-xs font-bold text-slate-500">Personnel ID</p><p className="mt-1 font-semibold tabular-nums">{person.institutional_id}</p></div><div><p className="text-xs font-bold text-slate-500">Position</p><p className="mt-1 font-semibold">{person.position_title || 'Not recorded'}</p></div><PresentRankField systemRank={person.current_rank_title} workbookRank={preview?.present_rank} check={preview?.rank_alignment?.present_rank_check} inspected={Boolean(preview)} /><WorkbookHeaderField label="Applied Status" value={preview?.applied_status} inspected={Boolean(preview)} /></div><RankAlignmentNotice alignment={preview?.rank_alignment} />
        {modal.state === 'idle' && <div className="py-6 text-center"><FileSpreadsheet className="mx-auto h-10 w-10 text-emerald-700" /><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">Choose one workbook containing both required annual-review results.</p><button type="button" onClick={chooseFile} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><UploadCloud className="h-4 w-4" />Choose Excel Workbook</button><p className="mt-3 text-xs leading-5 text-slate-500">.xlsx only · Maximum size: 10 MB<br />Inspection stores a preview; confirmation makes it authoritative.</p></div>}
        {modal.state === 'inspecting' && <div aria-live="polite" aria-busy="true" className="py-8 text-center"><LoaderCircle className="mx-auto h-9 w-9 animate-spin text-emerald-700" /><p className="mt-4 font-bold">Inspecting workbook…</p><p className="mt-2 text-sm text-slate-500">Validating the workbook, verifying personnel, and reading both performance ratings.</p></div>}
        {['ready', 'requires_attention', 'confirming', 'success'].includes(modal.state) && preview && <div aria-live="polite" className="space-y-5"><div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div className="min-w-0"><p className="text-xs font-bold text-slate-500">Workbook</p><p className="break-words font-bold">{preview.filename}</p><p className="mt-1 text-xs text-slate-500">1 workbook = 2 annual-review results</p></div></div>{modal.state === 'requires_attention' && <div role="alert"><h3 ref={errorHeadingRef} tabIndex={-1} className="font-black text-rose-800 outline-none dark:text-rose-200">{attentionTitle}</h3><p className="mt-1 text-sm leading-6 text-rose-700 dark:text-rose-200">{issueMessage({ ...preview, expected_personnel_name: person.full_name })}</p>{modal.requiredYears.length > 0 && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Required years: {modal.requiredYears.join(' and ')}</p>}</div>}<div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-bold text-slate-500">Selected personnel</p><p className="mt-1 font-bold">{person.full_name}</p><p className="text-xs text-slate-500">{person.institutional_id}</p></div><div><p className="text-xs font-bold text-slate-500">Personnel in workbook</p><p className="mt-1 font-bold">{preview.detected_personnel_name || 'Not readable'}</p><p className={`mt-1 text-xs font-bold ${preview.match_status === 'matched' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-200'}`}>{preview.match_status === 'matched' ? 'Personnel matched' : 'Personnel not matched'}</p></div></div><div><ReviewResult schoolYear={preview.review_1_school_year || modal.requiredYears[0]} rating={preview.review_1_rating} result={preview.review_1_result} /><ReviewResult schoolYear={preview.review_2_school_year || modal.requiredYears[1]} rating={preview.review_2_rating} result={preview.review_2_result} /></div><div className="flex items-center justify-between border-y border-slate-200 py-4 dark:border-slate-800"><div><p className="text-xs font-bold text-slate-500">2-Year Result</p><p className="mt-1 text-lg font-black">{title(preview.two_review_status || 'pending')}</p></div><Status value={preview.two_review_status || 'pending'} /></div>{preview.is_replacement && modal.state !== 'success' && <label className="block"><span className="text-sm font-bold">Reason for replacement</span><textarea value={correctionReason} onChange={event => setCorrectionReason(event.target.value)} rows="3" className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Explain why this workbook is changing." /></label>}{modal.state === 'ready' && <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Preview stored securely; confirmation makes these ratings authoritative for eligibility.</p>}{modal.state === 'success' && <div className="border-t border-slate-200 pt-4 dark:border-slate-800"><p className="text-xs font-bold text-slate-500">Submission readiness</p><div className="mt-2"><Status value={eligibility} label={eligibility === 'eligible' ? 'Ready to submit' : null} /></div>{eligibility === 'pending' && preview.two_review_status === 'passed' && <><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Annual review requirement passed. {(modal.eligibility?.eligibility_reasons || []).filter(reason => !/research output|research evidence/i.test(reason)).join(' ') || 'Review the remaining submission requirements below.'}</p><MissingHrRequirements items={modal.eligibility?.missing_hr_requirements} /></>}</div>}</div>}
        {modal.state === 'error' && <div role="alert" className="py-4"><AlertCircle className="h-7 w-7 text-rose-700" /><h3 ref={errorHeadingRef} tabIndex={-1} className="mt-3 text-lg font-black text-rose-800 outline-none dark:text-rose-200">{modal.error?.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{modal.error?.message}</p></div>}
        <input ref={inputRef} className="sr-only" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={inspect} aria-label="Choose annual-review workbook" />
      </div>
      <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">{modal.state === 'idle' && <button type="button" onClick={close} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-700">Cancel</button>}{['ready', 'requires_attention'].includes(modal.state) && <button type="button" onClick={chooseFile} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-700"><ArrowLeft className="h-4 w-4" />Choose Another File</button>}{modal.state === 'ready' && <button type="button" disabled={preview?.is_replacement && !correctionReason.trim()} onClick={confirm} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Confirm Import</button>}{modal.state === 'confirming' && <button type="button" disabled className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white opacity-70"><LoaderCircle className="h-4 w-4 animate-spin" />Confirming…</button>}{modal.state === 'error' && <><button type="button" onClick={chooseFile} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-700">Choose Another File</button><button type="button" onClick={retry} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white">Try Again</button></>}{modal.state === 'success' && <button type="button" onClick={close} className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-bold text-white">Done</button>}</footer>
    </section>
  </div>
}

export function ImportWorkspace({ periodId, locked, onConfirmed, compactAction = false }) {
  const input = useRef(null)
  const triggerRef = useRef(null)
  const dialogRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [imports, setImports] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmedCount, setConfirmedCount] = useState(0)
  const [itemErrors, setItemErrors] = useState({})
  const [reason, setReason] = useState({})
  const [selection, setSelection] = useState({})

  const close = () => {
    if (busy) return
    setIsOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }
  useEffect(() => {
    if (!isOpen) return undefined
    const dialog = dialogRef.current
    dialog?.focus()
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); close(); return }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, busy])

  const preview = async event => {
    const files = [...event.target.files]
    event.target.value = ''
    if (!files.length) return
    setBusy(true); setError(null)
    try {
      const result = await previewAnnualReviewImports(files, periodId)
      const next = result.imports || []
      setImports(current => [...current, ...next])
    } catch (e) {
      setError(annualReviewRequestError(e))
    } finally { setBusy(false) }
  }
  const canConfirm = item => item.id && item.state !== 'duplicate_upload' && item.match_status !== 'wrong_person' && (item.match_status === 'matched' || selection[item.id]) && (!item.is_replacement || String(reason[item.id] || '').trim())
  const confirm = async item => {
    setBusy(true); setItemErrors(value => ({ ...value, [item.id]: '' }))
    try {
      await confirmAnnualReviewImport(item.id, { personnel_profile_id: selection[item.id] || item.personnel_profile_id, correction_reason: reason[item.id] || undefined })
      setConfirmedCount(count => count + 1)
      setImports(current => current.filter(row => row.id !== item.id)); await onConfirmed()
    } catch (e) { setItemErrors(value => ({ ...value, [item.id]: annualReviewRequestError(e, 'This workbook could not be confirmed. Review this row and try again.').message })) }
    finally { setBusy(false) }
  }
  const ready = imports.filter(canConfirm)
  const confirmReady = async () => { for (const item of ready) await confirm(item) }
  return <>
    {compactAction ? <button ref={triggerRef} type="button" disabled={locked} onClick={() => setIsOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-base font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><UploadCloud className="h-4 w-4" />Upload Reviews</button> : <section aria-labelledby="import-heading" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950"><div><h2 id="import-heading" className="text-lg font-black text-slate-950 dark:text-white">Annual Reviews</h2><p className="mt-1 text-base leading-6 text-slate-600 dark:text-slate-300">Upload and check official faculty review workbooks.</p>{imports.length > 0 && <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{imports.length} workbook{imports.length === 1 ? '' : 's'} awaiting confirmation</p>}</div><button ref={triggerRef} type="button" disabled={locked} onClick={() => setIsOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-base font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><UploadCloud className="h-4 w-4" />Upload Annual Reviews</button></section>}
    <input ref={input} className="sr-only" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple onChange={preview} />
    {isOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={event => event.target === event.currentTarget && close()}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="bulk-import-heading" tabIndex={-1} className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none dark:bg-slate-950">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800"><div><h2 id="bulk-import-heading" className="text-xl font-black text-slate-950 dark:text-white">Upload Annual Reviews</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Choose one or more official .xlsx workbooks. Each file is checked before you confirm it.</p></div><button type="button" disabled={busy} onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40 dark:hover:bg-slate-900" aria-label="Close bulk upload"><X className="h-5 w-5" /></button></header>
        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600 dark:text-slate-300">.xlsx only · Maximum size: 10 MB per workbook</p><button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50 dark:border-slate-700"><FileSpreadsheet className="h-4 w-4" />{busy ? 'Inspecting…' : 'Choose workbooks'}</button></div>
        {confirmedCount > 0 && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">{confirmedCount} workbook{confirmedCount === 1 ? '' : 's'} confirmed successfully.</p>}
    {locked && <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">This evaluation period is closed. Existing annual-review workbooks remain available, but imports are disabled.</p>}
    {error && <div role="alert" className="mt-4 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"><AlertCircle className="h-5 w-5 shrink-0" /><div><strong>{error.title}</strong><p>{error.message}</p></div></div>}
    {imports.length > 0 && <div className="mt-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p aria-live="polite" className="text-sm text-slate-600 dark:text-slate-300">{imports.length} inspected · {ready.length} ready to confirm</p>{ready.length > 1 && <button type="button" disabled={busy} onClick={confirmReady} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Confirm {ready.length} Ready Imports</button>}</div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-y border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900"><th className="px-3 py-2.5">Workbook</th><th className="px-3 py-2.5">Personnel match</th><th className="px-3 py-2.5">First review</th><th className="px-3 py-2.5">Second review</th><th className="px-3 py-2.5">Result</th><th className="px-3 py-2.5">Action</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{imports.map((item, index) => <tr key={item.id || `${item.filename}-${index}`} className="align-top"><td className="max-w-52 px-3 py-3"><p className="break-words font-semibold">{item.filename}</p><p className="mt-1 text-xs text-slate-500">{title(item.state)}</p></td><td className="px-3 py-3"><p className="font-semibold">{item.detected_personnel_name || 'Not readable'}</p>{item.match_status === 'matched' ? <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Exact scoped match</p> : item.candidates?.length && item.match_status !== 'wrong_person' ? <><select aria-label={`Resolve personnel for ${item.filename}`} value={selection[item.id] || ''} onChange={e => setSelection(v => ({ ...v, [item.id]: e.target.value }))} className="mt-2 h-10 max-w-72 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">Select personnel—no automatic match</option>{item.candidates.map(person => <option key={person.id} value={person.id}>{person.full_name} · {person.institutional_id} · {person.assignment || 'College not recorded'}</option>)}</select><p className="mt-1 text-xs text-slate-500">Verify ID, college, and classification before selecting.</p></> : null}</td><td className="px-3 py-3"><p>{item.review_1_school_year || '—'}</p><strong>{title(item.review_1_rating)}</strong></td><td className="px-3 py-3"><p>{item.review_2_school_year || '—'}</p><strong>{title(item.review_2_rating)}</strong></td><td className="px-3 py-3"><Status value={item.two_review_status || 'pending'} />{item.two_review_reason && <p className="mt-2 max-w-52 text-xs text-slate-600 dark:text-slate-300">{item.two_review_reason}</p>}</td><td className="max-w-64 px-3 py-3">{item.is_replacement && item.state !== 'duplicate_upload' && <><label htmlFor={`reason-${item.id}`} className="text-xs font-bold">Correction reason</label><input id={`reason-${item.id}`} required value={reason[item.id] || ''} onChange={e => setReason(v => ({ ...v, [item.id]: e.target.value }))} placeholder="Why is this workbook changing?" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2 text-sm dark:border-slate-700 dark:bg-slate-950" /></>}<div className="mt-2 flex gap-2"><button type="button" disabled={busy || !canConfirm(item)} onClick={() => confirm(item)} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Confirm workbook</button><button type="button" aria-label={`Remove ${item.filename} from preview`} onClick={() => setImports(rows => rows.filter(row => row !== item))} className="rounded-lg border border-slate-300 p-2 dark:border-slate-700"><X className="h-4 w-4" /></button></div>{(!canConfirm(item) || itemErrors[item.id]) && <p role="alert" className="mt-2 text-xs leading-5 text-rose-700 dark:text-rose-300">{itemErrors[item.id] || issueMessage(item)}</p>}</td></tr>)}</tbody></table></div></div>}
        </div>
        <footer className="flex justify-end border-t border-slate-200 p-4 dark:border-slate-800"><button type="button" disabled={busy} onClick={close} className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">Close</button></footer>
      </section>
    </div>}
  </>
}

const formatDate = value => value ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(value).replace(' ', 'T'))) : 'Date unavailable'
const formatCycleDate = value => {
  if (!value) return null
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(date)
}

function AnnualReviewDetailWorkspace({ person, eligibility, portfolioEvaluationId, locked, item, onClose, onViewHistory, onUploadReview, onViewPortfolio, onViewWorkbook }) {
  const annual = eligibility.annual_review_requirement || {}
  const submissionReadiness = eligibility.submission_readiness_status || eligibility.eligibility_status || 'pending'
  const submissionReasons = (eligibility.eligibility_reasons || []).filter(reason => !/research output|research evidence/i.test(reason))
  const readinessLabel = submissionReadiness === 'eligible' ? 'Ready to submit' : null
  const requirements = [
    ['Personnel type', eligibility.personnel_type_requirement],
    ['Annual reviews', eligibility.annual_review_requirement],
    ['Service requirement', eligibility.service_requirement],
    ...(eligibility.research_output_requirement?.required ? [['Research evidence (after submission)', eligibility.research_output_requirement]] : [])
  ].filter(([, result]) => result?.status)
  return <article className="mx-auto max-w-4xl space-y-5">
    <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950/30"><ArrowLeft className="h-4 w-4" />Back to Faculty</button>
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800"><div><h2 className="text-2xl font-black text-slate-950 dark:text-white">{person.full_name}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{person.institutional_id}</p><dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm"><div><dt className="text-xs font-semibold text-slate-500">Job title</dt><dd className="font-bold text-slate-900 dark:text-slate-100">{person.position_title || 'Not recorded'}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Current academic rank</dt><dd className="font-bold text-slate-900 dark:text-slate-100">{person.current_rank_title || 'Not recorded'}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Department</dt><dd className="font-bold text-slate-900 dark:text-slate-100">{person.department_name || 'Not recorded'}</dd></div></dl></div><Status value={submissionReadiness} label={readinessLabel} /></header>
    {item?.can_manage === false && <ReadOnlyActions item={item} />}
    <div className="grid gap-4 md:grid-cols-2">
      <section className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><h3 className="font-extrabold text-slate-950 dark:text-white">Annual Review Status</h3><Status value={annual.status || 'pending'} /><p className="text-sm text-slate-600 dark:text-slate-300">{annual.import_id ? 'Confirmed annual review workbook on record.' : 'No confirmed annual review workbook.'}</p></section>
      <section className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><h3 className="font-extrabold text-slate-950 dark:text-white">Submission readiness</h3><Status value={submissionReadiness} label={readinessLabel} /><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{submissionReasons.length ? submissionReasons.join(' ') : 'Annual review, personnel type, and service requirements are met. A pending research check does not block portfolio submission.'}</p><MissingHrRequirements items={eligibility.missing_hr_requirements} /></section>
    </div>
    <section className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-extrabold text-slate-950 dark:text-white">Annual Review Workbooks</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{annual.import_id ? 'Current confirmed workbook' : 'No confirmed workbook for this period.'}</p></div>{annual.import_id && <button type="button" onClick={onViewWorkbook} className="min-h-9 rounded-lg px-2 text-sm font-bold text-emerald-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">View workbook details</button>}</div>{annual.import_id && <dl className="grid gap-3 border-t border-slate-200 pt-3 text-sm sm:grid-cols-2 dark:border-slate-800"><div><dt className="text-slate-500">{annual.review_1_school_year || 'First review'}</dt><dd className="font-bold">{title(annual.review_1_rating)}</dd></div><div><dt className="text-slate-500">{annual.review_2_school_year || 'Second review'}</dt><dd className="font-bold">{title(annual.review_2_rating)}</dd></div></dl>}</section>
    <section className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><h3 className="font-extrabold text-slate-950 dark:text-white">Eligibility Requirements</h3>{eligibility.research_output_requirement?.required && <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Research proof is verified by HR or the responsible Dean after portfolio submission and before evaluation. A pending research check does not block submission.</p>}<ul className="divide-y divide-slate-200 dark:divide-slate-800">{requirements.map(([label, result]) => <li key={label} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><p className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</p>{Array.isArray(result.reasons) && result.reasons.length > 0 && <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600 dark:text-slate-300">{result.reasons.join(' ')}</p>}</div><Status value={result.status} eligibility={label !== 'Annual reviews'} /></li>)}</ul></section>
    <footer className="flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><button type="button" onClick={onViewHistory} className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-700">Review History</button><button type="button" onClick={onUploadReview} disabled={locked || item?.can_manage === false} className="min-h-10 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{annual.import_id ? 'Replace Annual Review' : 'Upload Annual Review'}</button>{portfolioEvaluationId && <button type="button" onClick={onViewPortfolio} className="min-h-10 rounded-lg border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">View Portfolio Evaluation →</button>}</footer>
  </article>
}

function AnnualReviewHistoryDrawer({ person, periodId, refreshKey, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const [state, setState] = useState({ loading: true, rows: [], error: '' })
  const close = useCallback(() => { onClose(); requestAnimationFrame(() => returnFocusRef.current?.focus()) }, [onClose, returnFocusRef])
  useEffect(() => { let live = true; setState(value => ({ ...value, loading: true, error: '' })); fetchAnnualReviewHistory(person.id, periodId).then(rows => live && setState({ loading: false, rows: rows || [], error: '' })).catch(error => live && setState({ loading: false, rows: [], error: annualReviewRequestError(error, 'History could not be loaded.').message })); return () => { live = false } }, [person.id, periodId, refreshKey])
  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.focus()
    const handler = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])
  return <div className="fixed inset-0 z-[100] bg-slate-950/50" onMouseDown={event => event.target === event.currentTarget && close()}><aside ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="annual-review-history-title" tabIndex={-1} className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl outline-none dark:bg-slate-950"><header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Evidence record</p><h2 id="annual-review-history-title" className="mt-1 text-xl font-black text-slate-950 dark:text-white">Annual Review History</h2><p className="mt-1 text-sm text-slate-500">{person.full_name} · {person.institutional_id}</p></div><button type="button" onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-900" aria-label="Close annual-review history"><X className="h-5 w-5" /></button></header><div className="flex-1 overflow-y-auto p-5" aria-live="polite">{state.loading ? <div aria-busy="true" className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading history…</div> : state.error ? <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{state.error}</p> : state.rows.length ? <ol className="space-y-4">{state.rows.map(row => { const current = row.evaluation_period_id === periodId && !row.superseded_at; return <li key={row.id} className={`rounded-xl border p-4 ${current ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'}`}><div className="flex items-center justify-between gap-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${current ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{current ? 'Current' : 'Previous version'}</span><button type="button" onClick={() => downloadAnnualReviewImport(row.id, row.filename || undefined).catch(() => {})} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950"><Download className="h-3.5 w-3.5" />View workbook</button></div><p className="mt-3 break-words font-bold text-slate-950 dark:text-white">{row.filename || 'Annual-review workbook'}</p><p className="mt-1 text-xs text-slate-500">Uploaded {formatDate(row.confirmed_at || row.uploaded_at)}{row.uploader_name ? ` by ${row.uploader_name}` : ''}</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">{row.review_1_school_year || 'First review'}</dt><dd className="font-bold">{title(row.review_1_rating)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">{row.review_2_school_year || 'Second review'}</dt><dd className="font-bold">{title(row.review_2_rating)}</dd></div></dl>{current ? <p className="mt-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">Used for current eligibility</p> : <p className="mt-3 text-xs text-slate-500">Replaced {formatDate(row.superseded_at)}</p>}{row.correction_reason && <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300"><strong>Replacement reason:</strong> {row.correction_reason}</p>}</li> })}</ol> : <div className="py-12 text-center"><HistoryIcon className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 text-sm font-bold">No confirmed annual-review workbooks</p><p className="mt-1 text-xs text-slate-500">Confirmed current and previous versions will appear here.</p></div>}</div></aside></div>
}

export default function DeanAnnualReviewEligibilityPage({ cycleId, trackKey, trackKeys = null, embedded = false, hideCategoryFilter = false, deanWorkspace = false, selectedPersonnelId = '', portfolioByPersonnel = {}, onViewPortfolio, onSelectFaculty, onClearSelected, onDataChanged, refreshKey = 0 } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [embeddedPersonnelId, setEmbeddedPersonnelId] = useState('')
  const activePersonnelId = selectedPersonnelId || (embedded ? embeddedPersonnelId : '')
  const [state, setState] = useState({ phase: 'loading', data: null, error: '' })
  const defaultCategory = deanWorkspace ? 'all_visible' : embedded ? 'all_hr_assigned' : 'all'
  // HR's embedded annual-review roster includes Dean-managed rows for read-only visibility.
  // Keep those out of the HR workspace list when its category control is hidden.
  const selectedCategory = hideCategoryFilter && !deanWorkspace
    ? 'all_hr_assigned'
    : deanWorkspace ? 'all_visible' : searchParams.get('annual_category') || defaultCategory
  const [filters, setFilters] = useState(() => ({ search: searchParams.get('annual_search') || '', employment: searchParams.get('annual_employment') || 'all', review: searchParams.get('annual_review') || 'all', eligibility: searchParams.get('annual_eligibility') || 'all', assignment: searchParams.get('annual_position') || 'all', category: selectedCategory }))
  const [filterOpen, setFilterOpen] = useState(false)
  const annualQueryState = ['annual_search', 'annual_employment', 'annual_review', 'annual_eligibility', 'annual_position', 'annual_category'].map(key => searchParams.get(key) || '').join('|')
  useEffect(() => {
    setFilters({ search: searchParams.get('annual_search') || '', employment: searchParams.get('annual_employment') || 'all', review: searchParams.get('annual_review') || 'all', eligibility: searchParams.get('annual_eligibility') || 'all', assignment: searchParams.get('annual_position') || 'all', category: selectedCategory })
    setPage(1)
  }, [annualQueryState, searchParams, selectedCategory])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [uploadPerson, setUploadPerson] = useState(null)
  const [historyPerson, setHistoryPerson] = useState(null)
  const [viewing, setViewing] = useState(null)
  const viewReturnFocusRef = useRef(null)
  const closeViewer = useCallback(() => setViewing(null), [])
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const uploadReturnFocusRef = useRef(null)
  const historyReturnFocusRef = useRef(null)
  const load = useCallback(async () => { setState(v => ({ ...v, phase: 'loading', error: '' })); try { const requestedTracks = Array.isArray(trackKeys) && trackKeys.length ? trackKeys : trackKey ? [trackKey] : []; const responses = cycleId && requestedTracks.length ? await Promise.all(requestedTracks.map(key => fetchReviewerTrackRoster(cycleId, key))) : [await fetchDeanAnnualReviews()]; const datasets = responses.map(response => response?.data || response); const data = { ...datasets[0], personnel: datasets.flatMap(item => item?.personnel || []) }; setState({ phase: 'success', data, error: '' }); return data } catch (error) { setState({ phase: 'error', data: null, error: annualReviewRequestError(error, 'Annual reviews could not be loaded.').message }); throw error } }, [cycleId, trackKey, trackKeys])
  useEffect(() => { load() }, [load, refreshKey])
  const allRows = useMemo(() => (state.data?.personnel || []).filter(item => String(item.personnel?.personnel_group || '').toUpperCase() !== 'NON_TEACHING_FACULTY'), [state.data?.personnel])
  const positions = useMemo(() => [...new Set(allRows.map(item => item.personnel.position_title).filter(Boolean))].sort(), [allRows])
  const rows = useMemo(() => allRows.filter(item => {
    const p = item.personnel, e = item.eligibility, a = e.annual_review_requirement || {}
    const query = filters.search.toLowerCase().trim()
    const reviewStatus = !a.import_id ? 'missing' : a.status || 'pending'
    return (!query || `${p.full_name} ${p.institutional_id}`.toLowerCase().includes(query))
      && (filters.employment === 'all' || p.employment_status === filters.employment)
      && (filters.review === 'all' || reviewStatus === filters.review)
      && (filters.eligibility === 'all' || e.eligibility_status === filters.eligibility)
      && (filters.assignment === 'all' || p.position_title === filters.assignment)
      && (!embedded || filters.category === 'all_visible' || (() => {
        const hrManaged = item.responsible_authority?.authority_type === 'HR'
        if (filters.category === 'dean_faculty') return hrManaged && p.personnel_group === 'FACULTY'
        if (filters.category === 'non_teaching') return hrManaged && p.personnel_group === 'NON_TEACHING_FACULTY'
        return hrManaged
      })())
      && (!activePersonnelId || String(p.id) === String(activePersonnelId))
  }), [allRows, filters, activePersonnelId, embedded])
  const countRows = useMemo(() => hideCategoryFilter && !deanWorkspace
    ? allRows.filter(item => item.responsible_authority?.authority_type === 'HR')
    : allRows, [allRows, hideCategoryFilter, deanWorkspace])
  const counts = useMemo(() => ({
    missing: countRows.filter(item => !item.eligibility.annual_review_requirement?.import_id).length,
    pending: countRows.filter(item => item.eligibility.eligibility_status === 'pending').length,
    eligible: countRows.filter(item => item.eligibility.eligibility_status === 'eligible').length
  }), [countRows])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const visibleRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])
  const period = state.data?.evaluation_period; const locked = Boolean(period?.is_locked)
  const setFilter = (key, value) => {
    setFilters(current => ({ ...current, [key]: value }))
    const next = new URLSearchParams(searchParams)
    const queryKey = ({ search: 'annual_search', employment: 'annual_employment', review: 'annual_review', eligibility: 'annual_eligibility', assignment: 'annual_position', category: 'annual_category' })[key]
    if (!value || value === 'all') next.delete(queryKey); else next.set(queryKey, value)
    setSearchParams(next, { replace: true })
    setPage(1)
  }
  const clearFilters = () => {
    setFilters({ search: '', employment: 'all', review: 'all', eligibility: 'all', assignment: 'all', category: defaultCategory })
    const next = new URLSearchParams(searchParams)
    ;['annual_search', 'annual_employment', 'annual_review', 'annual_eligibility', 'annual_position', 'annual_category'].forEach(key => next.delete(key))
    setSearchParams(next, { replace: true }); onClearSelected?.(); if (embedded && !onClearSelected) setEmbeddedPersonnelId(''); setPage(1); setFilterOpen(false)
  }
  const activeFilterCount = [filters.employment !== 'all', filters.review !== 'all', filters.eligibility !== 'all', filters.assignment !== 'all', embedded && !hideCategoryFilter && !deanWorkspace && !['all_hr_assigned', 'all', 'all_visible'].includes(filters.category)].filter(Boolean).length
  const activeFilters = Boolean(filters.search || activeFilterCount || activePersonnelId)
  const selectedItem = activePersonnelId ? allRows.find(item => String(item.personnel.id) === String(activePersonnelId)) : null
  const selectPersonnel = id => { if (onSelectFaculty) onSelectFaculty(id); else if (embedded) setEmbeddedPersonnelId(String(id)) }
  const clearPersonnel = () => { onClearSelected?.(); if (embedded && !onClearSelected) setEmbeddedPersonnelId('') }
  const cycleStart = formatCycleDate(period?.submission_open_at || period?.start_date)
  const cycleEnd = formatCycleDate(period?.submission_close_at || period?.end_date || period?.evaluation_end_at)
  const cycleTitle = state.data?.ranking_cycle?.display_name || (state.data?.evaluation_cycle_id ? `AY ${state.data.evaluation_cycle_id} Faculty Ranking` : period?.name)
  const Root = embedded ? 'div' : 'main'
  return <Root className={embedded ? 'min-w-0 space-y-6' : 'mx-auto max-w-[1500px] space-y-6 py-4'}>{!embedded && <><Link to="/dean/faculty-ranking-reviews" className="inline-flex text-sm font-bold text-emerald-800 dark:text-emerald-300">← Faculty Evaluation</Link><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Annual Review &amp; Eligibility</h1><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Manage faculty annual reviews and eligibility.</p></div><button type="button" onClick={load} disabled={state.phase === 'loading'} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-60 dark:border-slate-700"><RefreshCw className={`h-4 w-4 ${state.phase === 'loading' ? 'animate-spin' : ''}`} />Refresh</button></header>
    {period ? <section aria-label="Current ranking cycle" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/25"><div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 shrink-0 text-emerald-800 dark:text-emerald-300" /><div><p className="text-base font-bold text-slate-950 dark:text-white">{cycleTitle}</p><p className="text-base leading-6 text-slate-600 dark:text-slate-300">{cycleStart && cycleEnd ? `${cycleStart} – ${cycleEnd}` : cycleEnd || cycleStart || period.name}</p></div></div><span className="rounded-full bg-white px-3 py-1 text-sm font-bold capitalize text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">{period.status_label || title(period.status)}</span></section> : state.data && <section role="status" className="rounded-xl border border-slate-200 px-5 py-8 text-center dark:border-slate-800"><CalendarDays className="mx-auto h-7 w-7 text-slate-400" /><h2 className="mt-3 font-bold text-slate-950 dark:text-white">No active ranking cycle</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Annual review records will appear when HR opens a faculty ranking cycle.</p></section>}</>}
    {state.error && <div role="alert" className="flex gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-900"><AlertCircle className="h-5 w-5 shrink-0" /><div><strong>Annual review data unavailable.</strong><p>{state.error}</p></div></div>}
    {state.phase === 'loading' && !state.data && <div aria-busy="true" className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />}{state.phase === 'error' && !state.data && <button onClick={load} className="rounded-lg bg-emerald-800 px-4 py-2 font-bold text-white">Try again</button>}
    {state.data && <>
      {period && <>
        <div hidden={Boolean(selectedItem)} className="space-y-6">
          <section className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800"><div><h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Annual Reviews &amp; Eligibility</h2><p className="mt-1 text-base leading-6 text-slate-600 dark:text-slate-300">{counts.missing} faculty {counts.missing === 1 ? 'member is' : 'members are'} missing annual reviews.</p></div><ImportWorkspace periodId={state.data.evaluation_period_id} locked={locked} compactAction onConfirmed={async () => { await load(); await onDataChanged?.() }} /></section>
          <section aria-label="Faculty search and filters" className="flex flex-wrap items-start gap-2"><label className="relative min-w-[min(100%,18rem)] flex-1"><span className="sr-only">Search faculty</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder="Search faculty name or ID" className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950" /></label>
            <details open={filterOpen} onToggle={event => setFilterOpen(event.currentTarget.open)} className="relative"><summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><Filter className="h-4 w-4" />Filter{activeFilterCount > 0 && <span className="rounded-full bg-emerald-100 px-1.5 text-xs text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">{activeFilterCount}</span>}<ChevronDown className="h-4 w-4" /></summary>
              <div className="absolute right-0 z-20 mt-2 grid w-[min(20rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-950">{embedded && !deanWorkspace && !hideCategoryFilter && <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">Personnel category<select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"><option value="all_hr_assigned">All HR-assigned personnel</option><option value="dean_faculty">Dean-role Faculty</option><option value="all_visible">All visible personnel</option></select></label>}<label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">Annual review status<select value={filters.review} onChange={e => setFilter('review', e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"><option value="all">All statuses</option><option value="missing">Missing</option><option value="pending">Pending</option><option value="passed">Passed</option><option value="not_passed">Not passed</option></select></label><label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">Evaluation eligibility<select value={filters.eligibility} onChange={e => setFilter('eligibility', e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"><option value="all">All statuses</option><option value="pending">Pending</option><option value="eligible">Eligible</option><option value="not_eligible">Not eligible</option></select></label><label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">Employment classification<select value={filters.employment} onChange={e => setFilter('employment', e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"><option value="all">All classifications</option><option value="permanent">Permanent</option><option value="probationary">Probationary</option></select></label><label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">Faculty position<select value={filters.assignment} onChange={e => setFilter('assignment', e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"><option value="all">All positions</option>{positions.map(value => <option key={value}>{value}</option>)}</select></label><button type="button" onClick={clearFilters} className="min-h-9 justify-self-start rounded-lg px-2 text-sm font-bold text-emerald-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Reset Filters</button></div>
            </details>
            {activeFilters && <span className="basis-full text-xs text-slate-600 dark:text-slate-300" aria-live="polite">{activePersonnelId ? 'Faculty member selected' : `${activeFilterCount + (filters.search ? 1 : 0)} filters active`}</span>}
          </section>
          <section aria-label="Faculty annual reviews" className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">{visibleRows.map(item => { const p = item.personnel, annual = item.eligibility.annual_review_requirement || {}, authority = item.responsible_authority || {}; const reviewStatus = !annual.import_id ? 'Missing' : title(annual.status || 'pending'); const category = p.personnel_group === 'NON_TEACHING_FACULTY' ? 'Non-Teaching Personnel' : authority.authority_type === 'HR' ? 'Dean-role Faculty' : 'Teaching Faculty'; const submissionReadiness = item.eligibility.submission_readiness_status || item.eligibility.eligibility_status; return <button key={p.id} type="button" onClick={() => selectPersonnel(p.id)} className="group flex min-h-[76px] w-full items-center justify-between gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"><span className="min-w-0"><span className="block truncate font-bold text-slate-950 group-hover:text-emerald-800 dark:text-white dark:group-hover:text-emerald-300">{p.full_name}</span><span className="mt-1 block truncate text-sm text-slate-600 dark:text-slate-300">{p.position_title || 'Position not recorded'}{embedded && <> · {category}</>}</span></span><span className="flex shrink-0 flex-wrap items-center justify-end gap-2"><Status value={!annual.import_id ? 'missing' : annual.status || 'pending'} />{embedded && <Status value={submissionReadiness} label={submissionReadiness === 'eligible' ? 'Ready to submit' : null} />}<span className="sr-only">Annual review: {reviewStatus}</span><ArrowLeft className="h-4 w-4 rotate-180 text-slate-400" aria-hidden="true" /></span></button>})}{!rows.length && <div className="py-12 text-center text-sm text-slate-600 dark:text-slate-300"><CheckCircle2 className="mx-auto mb-3 h-6 w-6 text-emerald-700" />No faculty match these filters.{activeFilters && <button type="button" onClick={clearFilters} className="ml-1 font-bold text-emerald-800 underline underline-offset-2 dark:text-emerald-300">Reset filters</button>}</div>}</section>
          {!activePersonnelId && <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p aria-live="polite" className="text-slate-600 dark:text-slate-300">{rows.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, rows.length)} of ${rows.length} faculty members` : 'No faculty members'}</p><div className="flex items-center gap-2"><label className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span>Rows</span><select aria-label="Rows per page" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1) }} className="h-9 rounded-lg border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-950"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label><button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="min-h-9 rounded-lg border border-slate-300 px-3 font-bold disabled:opacity-40 dark:border-slate-700">Previous</button><span className="tabular-nums text-slate-500">Page {page} of {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage(value => value + 1)} className="min-h-9 rounded-lg border border-slate-300 px-3 font-bold disabled:opacity-40 dark:border-slate-700">Next</button></div></div>}
        </div>
        {selectedItem && <AnnualReviewDetailWorkspace person={selectedItem.personnel} eligibility={selectedItem.eligibility} portfolioEvaluationId={portfolioByPersonnel[selectedItem.personnel.id]?.id} locked={locked} item={selectedItem} onClose={clearPersonnel} onViewHistory={() => setHistoryPerson(selectedItem.personnel)} onUploadReview={() => setUploadPerson(selectedItem.personnel)} onViewPortfolio={() => onViewPortfolio?.(selectedItem.personnel.id)} onViewWorkbook={() => setViewing({ person: selectedItem.personnel, review: selectedItem.eligibility.annual_review_requirement || {}, eligibility: selectedItem.eligibility })} />}
      </>}
    </>}
    {uploadPerson && state.data && <AnnualReviewUploadModal person={uploadPerson} periodId={state.data.evaluation_period_id} returnFocusRef={uploadReturnFocusRef} onClose={() => setUploadPerson(null)} onImported={async () => { const data = await load(); setHistoryRefreshKey(value => value + 1); await onDataChanged?.(); return data }} />}
    {viewing?.review.import_id && <AnnualReviewViewerDialog person={viewing.person} review={viewing.review} eligibility={viewing.eligibility} portfolioEvaluationId={portfolioByPersonnel[viewing.person.id]?.id} returnFocusRef={viewReturnFocusRef} onClose={closeViewer} onViewPortfolio={() => { const id = viewing.person.id; setViewing(null); onViewPortfolio?.(id) }} onViewHistory={() => { historyReturnFocusRef.current = viewReturnFocusRef.current; setHistoryPerson(viewing.person); setViewing(null) }} onUploadReview={() => { uploadReturnFocusRef.current = viewReturnFocusRef.current; setUploadPerson(viewing.person); setViewing(null) }} />}
    {historyPerson && state.data && <AnnualReviewHistoryDrawer person={historyPerson} periodId={state.data.evaluation_period_id} refreshKey={historyRefreshKey} returnFocusRef={historyReturnFocusRef} onClose={() => setHistoryPerson(null)} />}
  </Root>
}
