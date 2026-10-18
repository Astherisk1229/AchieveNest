import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Check, ChevronLeft, ChevronRight, FileText, LoaderCircle, RotateCcw, Save, X } from 'lucide-react'
import PersonnelEvidencePreviewModal from '../personnel/modals/PersonnelEvidencePreviewModal'
import { approveDeanReviewItem, downloadDeanSummaryPdf, endorseDeanReview, getDeanReviewReport, rejectDeanReviewItem, returnDeanReview, saveDeanReviewItemRemarks, saveDeanSummaryComments, startDeanReview } from '../../services/deanWorkspaceService'
import FacultyEvaluationSummary from '../../components/evaluation/FacultyEvaluationSummary'
import { confirmDialog } from '../../components/ui/DialogProvider'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import PortfolioBookletDocument from '../../components/portfolio-booklet/PortfolioBookletDocument'
import { FACULTY_BOOKLET_FORMAT, NON_TEACHING_BOOKLET_FORMAT } from '../../components/portfolio-booklet/bookletFormats'
import { getEvaluationCriterionContext } from '../../utils/evaluationCriterionContext'
import { facultyEducationClassificationConflicts } from '../../utils/facultyAcademicBooklet'
import { submittedAccomplishmentDetails, submittedScoringOptions } from '../../utils/submittedAccomplishmentDetails'
import { submitPortfolioReturn } from './submitPortfolioReturn'
import { deanReviewDetailRoute } from '../../config/deanRoutes'
import { isEvaluationItemReviewed, nextUnreviewedEvaluationItem } from '../../utils/evaluationNavigation'

const pointsText = value => Number(value || 0).toFixed(2)
const validManualPoints = (value, cap) => value !== '' && Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= cap && Math.abs(Math.round(Number(value) * 100) - Number(value) * 100) < 0.000001
const evidenceFor = item => (item?.evidence_snapshot?.length
  ? item.evidence_snapshot
  : item?.evidence_id ? [{ id: item.evidence_id, original_filename: item.file_name || 'Supporting document', mime_type: item.mime_type || 'application/pdf' }] : [])
  .map(row => ({ ...row, id: row.id || row.evidence_id, original_filename: row.original_filename || row.file_name || 'Supporting document', mime_type: row.mime_type || row.detected_mime_type || 'application/pdf' }))
const decisionText = item => item?.verification_status === 'ineligible' ? 'Rejected' : item?.verification_status === 'verified' && item?.rating_status === 'rated' ? 'Approved' : 'Needs review'
const submittedBookletItem = item => {
  let payload = item?.scoring_payload || {}
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload || '{}') } catch { payload = {} }
  }
  let metadata = item?.category_metadata || payload?.category_metadata || {}
  if (typeof metadata === 'string') {
    try { metadata = JSON.parse(metadata || '{}') } catch { metadata = {} }
  }
  const subcategoryCode = String(item?.subcategory_code || metadata?.subcategory_code || item?.criterion_key || '').trim().toUpperCase()
  const educationSubcategories = ['A1_PHD_HOLDER', 'A1_PHD_UNITS', 'A1_MA_HOLDER', 'A1_MA_UNITS', 'A.1.1', 'A.1.2', 'A.1.3', 'A.1.4']
  if (!educationSubcategories.includes(subcategoryCode)) return item

  return {
    ...item,
    criterion_code: 'A.1',
    category_metadata: metadata,
    subcategory_code: subcategoryCode,
  }
}

export default function DeanPortfolioEvaluationWorkspace({ data, onReload, onReturned, readOnly: periodReadOnly = false }) {
  const { review = {}, items = [], score_previews: scorePreviews = {} } = data || {}
  const latestVersion = data?.latest_version
  const superseded = Boolean(latestVersion?.id && latestVersion.id !== review.id && Number(latestVersion.version_number) > Number(review.version_number || 1))
  const readOnly = periodReadOnly || superseded
  const [activeId, setActiveId] = useState(items[0]?.id || '')
  const [serviceYearsSelected, setServiceYearsSelected] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [note, setNote] = useState({})
  const [judgmentPoints, setJudgmentPoints] = useState({})
  const [error, setError] = useState('')
  const [evidence, setEvidence] = useState(null)
  const [mobilePane, setMobilePane] = useState('portfolio')
  const [savedAt, setSavedAt] = useState('')
  const [reportState, setReportState] = useState({ phase: 'idle', report: null, context: null, error: '' })
  const [reportReload, setReportReload] = useState(0)
  const [returnDialog, setReturnDialog] = useState({ open: false, instructions: '', error: '' })
  const [returnSuccess, setReturnSuccess] = useState('')
  const returnInFlight = useRef(false)
  const evaluationPaneRef = useRef(null)

  const activeIndex = Math.max(0, items.findIndex(item => item.id === activeId))
  const active = items[activeIndex]
  const context = getEvaluationCriterionContext(active || {})
  const reviewGroup = String(review.personnel_group_at_submission || review.personnel_group || (String(review.criteria_snapshot?.sheet?.applies_to || '').toUpperCase() === 'NON_TEACHING_FACULTY' ? 'NON_TEACHING_FACULTY' : 'FACULTY')).toUpperCase()
  const preview = active ? scorePreviews[active.id] : null
  const manual = preview?.mode === 'manual'
  const graduate = preview?.mode === 'graduate_units'
  const cap = Number(preview?.maximum_points || 0)
  const unresolvedScore = Boolean(active && (!preview || preview.mode === 'unavailable' || preview.reason))
  const proofs = evidenceFor(active)
  const submittedDetails = submittedAccomplishmentDetails(active)
  const dateDetails = submittedDetails.filter(row => /\b(date|year|period)\b/i.test(row.label))
  const supplementaryDetails = submittedDetails.filter(row => !dateDetails.some(date => date.key === row.key))
  const scoringOptions = submittedScoringOptions(active)
  const reviewed = items.filter(isEvaluationItemReviewed).length
  const remaining = items.length - reviewed
  const editable = !readOnly && review.status === 'in_evaluation'
  const isSubmitted = review.status === 'submitted'
  const serviceYearsCredit = review.service_years_credit
  const pointsValue = active ? judgmentPoints[active.id] ?? (active.rating_status === 'rated' ? active.awarded_points : '') : ''
  const remarkSuggestion = graduate ? 'Graduate units counted toward the level total.' : context.generatedRemark
  const scoreLabel = value => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : `${pointsText(value)} pts`

  const bookletUser = useMemo(() => ({
    full_name: review.personnel_name || review.faculty_name || review.full_name || '',
    personnel_group: review.personnel_group_at_submission || review.personnel_group,
    designation_title: review.designation || review.position_title || '',
    department_name: review.college_name || review.college_name_snapshot || review.department_name || review.department_name_snapshot || '',
    faculty_engagement: review.faculty_engagement,
    employment_status: review.employment_status,
    employment_status_label: review.employment_status_label,
    current_rank_title: review.current_rank_title || review.present_rank || '',
  }), [review])
  const bookletPortfolio = useMemo(() => ({
    items: items.map(submittedBookletItem), scoreAudience: 'evaluator',
    graduate_units: data?.graduate_units,
    academic_year: review.academic_year || review.period_academic_year || review.evaluation_period?.academic_year || '',
    current_rank_title: review.current_rank_title || review.present_rank || '',
    tenure_years: review.tenure_years,
  }), [data?.graduate_units, items, review])
  const bookletFormat = reviewGroup === 'NON_TEACHING_FACULTY' ? NON_TEACHING_BOOKLET_FORMAT : FACULTY_BOOKLET_FORMAT
  const educationConflicts = reviewGroup === 'FACULTY' ? facultyEducationClassificationConflicts(items) : []

  useEffect(() => {
    if (!items.some(item => item.id === activeId)) setActiveId(items[0]?.id || '')
  }, [activeId, items])
  useEffect(() => {
    if (!['ready_for_finalization', 'completed'].includes(review.status)) return undefined
    let current = true
    setReportState({ phase: 'loading', evaluationId: review.id, report: null, context: null, error: '' })
    getDeanReviewReport(review.id)
      .then(result => {
        if (current) {
          const report = result.report?.snapshot || result.report?.report_payload || result.report
          setReportState({ phase: 'success', evaluationId: review.id, report: report ? { ...report, generated_at: report.generated_at || result.report?.generated_at } : null, context: result.summary_context || null, error: '' })
        }
      })
      .catch(failure => {
        if (current) setReportState({ phase: 'error', evaluationId: review.id, report: null, context: null, error: failure?.response?.data?.error?.message || failure?.message || 'The evaluation summary could not be loaded.' })
      })
    return () => { current = false }
  }, [review.id, review.status, reportReload])

  const perform = async (id, action, clearFields = '') => {
    setBusyId(id)
    setError('')
    let persisted = false
    try {
      await action()
      persisted = true
      const refreshed = await onReload()
      if (clearFields) {
        setNote(current => { const next = { ...current }; delete next[id]; return next })
        if (clearFields === 'decision') setJudgmentPoints(current => { const next = { ...current }; delete next[id]; return next })
      }
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      if (clearFields === 'decision') {
        const next = nextUnreviewedEvaluationItem(refreshed?.items || items, id)
        if (next) {
          setActiveId(next.id)
          setServiceYearsSelected(false)
          setMobilePane('evaluation')
          requestAnimationFrame(() => evaluationPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' }))
        }
      }
    } catch (failure) {
      if (!persisted) {
        try { await onReload() } catch { /* Keep the original action error visible. */ }
      }
      setError(persisted
        ? 'The action reached the server, but the latest evaluation could not be loaded. Refresh this page before continuing.'
        : failure?.response?.data?.error?.message || failure?.error?.message || failure?.message || 'The decision could not be saved.')
    } finally {
      setBusyId('')
    }
  }
  const approve = () => {
    if (!active) return
    const points = manual ? Number(pointsValue) : null
    if (unresolvedScore) { setError(preview?.reason || 'The scoring rule could not be loaded. Refresh this review.'); return }
    if (manual && !validManualPoints(pointsValue, cap)) {
      setError(`Enter points greater than 0 and no more than ${cap}, with at most two decimal places.`)
      return
    }
    const remarks = note[active.id] ?? remarkSuggestion
    perform(active.id, () => approveDeanReviewItem(review.id, active.id, remarks || '', points), 'decision')
  }
  const reject = () => {
    if (!active) return
    const reason = String(note[active.id] || '').trim()
    if (!reason) { setError('Enter a reason before rejecting this accomplishment.'); return }
    perform(active.id, () => rejectDeanReviewItem(review.id, active.id, reason), 'decision')
  }
  const selectItem = id => {
    if (busyId || !items.some(item => item.id === id)) return
    setServiceYearsSelected(false)
    setActiveId(id)
    setError('')
    setMobilePane('evaluation')
  }
  const selectServiceYears = () => {
    if (busyId) return
    setServiceYearsSelected(true)
    setError('')
    setMobilePane('evaluation')
    requestAnimationFrame(() => evaluationPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' }))
  }
  const navigate = offset => {
    const next = items[activeIndex + offset]
    if (next) selectItem(next.id)
  }
  const saveRemarks = async () => {
    if (!active || note[active.id] === undefined) return
    await perform(active.id, () => saveDeanReviewItemRemarks(review.id, active.id, note[active.id]), 'remarks')
  }
  const openReturnDialog = () => {
    if (busyId || !editable) return
    setError('')
    setReturnSuccess('')
    setReturnDialog({ open: true, instructions: '', error: '' })
  }
  const closeReturnDialog = () => {
    if (!returnInFlight.current) setReturnDialog({ open: false, instructions: '', error: '' })
  }
  const returnPortfolio = async () => {
    const reason = returnDialog.instructions.trim()
    if (!reason || returnInFlight.current || busyId) return
    setBusyId('return')
    setReturnDialog(current => ({ ...current, error: '' }))
    let returned = false
    try {
      await submitPortfolioReturn(reason, returnInFlight, value => returnDeanReview(review.id, value))
      returned = true
      setReturnDialog({ open: false, instructions: '', error: '' })
      if (onReturned) await onReturned()
      else {
        setReturnSuccess('Portfolio returned successfully. Waiting for faculty revision.')
        await onReload()
      }
    } catch (failure) {
      if (returned) setError('The portfolio was returned, but the Faculty Evaluation list could not be loaded. Please use Back to Faculty Evaluation.')
      else setReturnDialog(current => ({ ...current, error: failure?.response?.data?.error?.message || failure?.error?.message || failure?.message || 'The portfolio could not be returned. Please try again.' }))
    } finally {
      setBusyId('')
    }
  }
  const endorse = async () => {
    if (remaining) {
      setError(`${remaining} accomplishment${remaining === 1 ? '' : 's'} still need a decision.`)
      const first = items.find(item => item.verification_status !== 'ineligible' && (item.verification_status !== 'verified' || item.rating_status !== 'rated'))
      if (first) selectItem(first.id)
      return
    }
    if (await confirmDialog({ title: 'Endorse to HR?', message: 'Endorse this completed Dean evaluation to HR? You will no longer be able to change decisions.', confirmLabel: 'Endorse to HR', tone: 'default' })) {
      perform('endorse', () => endorseDeanReview(review.id))
    }
  }

  if (['ready_for_finalization', 'completed'].includes(review.status)) {
    if (reportState.evaluationId === review.id && reportState.report) return <FacultyEvaluationSummary report={reportState.report} context={reportState.context} onDownloadPdf={() => downloadDeanSummaryPdf(review.id)} onSaveComments={async comments => {
      await saveDeanSummaryComments(review.id, comments)
      setReportReload(value => value + 1)
    }} />
    if (reportState.evaluationId === review.id && reportState.phase === 'error') return <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900"><p className="font-semibold">{reportState.error}</p><button type="button" onClick={() => setReportReload(value => value + 1)} className="mt-3 rounded-lg bg-rose-900 px-3 py-2 font-bold text-white">Retry summary</button></section>
    return <section aria-busy="true" className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-700"><LoaderCircle className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading evaluation summary…</section>
  }

  if (review.status === 'returned_for_revision') return <div className="space-y-4">
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/25">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">Returned for Revision</p>
      <h2 className="mt-1 text-lg font-bold">{review.full_name || review.personnel_name || 'Faculty member'} · Portfolio Version {review.version_number || 1}</h2>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Waiting for the faculty member to submit a corrected portfolio.</p>
      <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 dark:border-emerald-900 dark:bg-slate-950"><h3 className="text-sm font-bold">Revision instructions</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{review.return_reason || 'No written instructions were provided.'}</p></div>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" aria-label="Original submitted portfolio">
      <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-800"><h2 className="font-bold">Original submitted portfolio · Version {review.version_number || 1}</h2><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">This version and its evidence are read only.</p></header>
      <div className="h-[65dvh] min-h-[420px]"><PortfolioBookletDocument user={bookletUser} portfolio={bookletPortfolio} format={bookletFormat} onOpenProof={row => { const proof = evidenceFor(row.source)[0]; if (proof) setEvidence(proof) }} /></div>
    </section>
    {items.some(item => decisionText(item) !== 'Needs review') && <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><h2 className="font-bold">Previous evaluation decisions</h2><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Decisions recorded on this submitted version are preserved for reference.</p><ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">{items.filter(item => decisionText(item) !== 'Needs review').map(item => <li key={item.id} className="py-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{item.item_description}</span><span>{decisionText(item)}{decisionText(item) === 'Approved' && item.awarded_points != null ? ` · ${pointsText(item.awarded_points)} pts` : ''}</span></div>{(item.rejection_reason || item.evaluator_remarks) && <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{item.rejection_reason || item.evaluator_remarks}</p>}</li>)}</ul></section>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
    {evidence && <PersonnelEvidencePreviewModal evidence={evidence} onClose={() => setEvidence(null)} />}
  </div>

  return <div className="space-y-4">
    {superseded && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <p><strong>You are viewing Version {review.version_number || 1}.</strong> Version {latestVersion.version_number} is the latest submitted portfolio and may contain corrected accomplishments.</p>
      <Link to={deanReviewDetailRoute(latestVersion.id)} className="rounded-lg bg-emerald-800 px-3 py-2 font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Open latest version</Link>
    </div>}
    {educationConflicts.length > 0 && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <p><strong>Education classification needs review.</strong> {educationConflicts.map(({ title }) => title).join('; ')} is labeled as an undergraduate degree but was submitted under graduate degree or units criteria. Return the portfolio for revision before scoring it.</p>
    </div>}
    <section aria-label="Evaluation score summary" className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Approved score summary</h2>
        <div className="flex min-w-[150px] flex-1 items-center justify-end gap-3 sm:flex-none">
          <span className="whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-300">{reviewed} of {items.length} reviewed</span>
          <div role="progressbar" aria-label="Evaluation progress" aria-valuemin="0" aria-valuemax={items.length} aria-valuenow={reviewed} className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 sm:block dark:bg-slate-800"><div className="h-full bg-emerald-700" style={{ width: `${items.length ? reviewed / items.length * 100 : 0}%` }} /></div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          { label: 'Total Approved Points', value: review.total_score, prominent: true },
          { label: 'A. Professional Development', value: review.area_a_score },
          { label: 'B. Productivity', value: review.area_b_score },
          { label: 'C. Service & Leadership', value: review.area_c_score },
        ].map(({ label: scoreTitle, value, prominent }) => <div key={scoreTitle} className={`min-w-0 rounded-lg px-3 py-2.5 ${prominent ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-slate-50 dark:bg-slate-900'}`}>
          <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">{scoreTitle}</p>
          <p className={`mt-1 tabular-nums font-bold text-slate-950 dark:text-white ${prominent ? 'text-xl' : 'text-lg'}`}>{scoreLabel(value)}</p>
        </div>)}
      </div>
    </section>
    {isSubmitted && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div><h2 className="text-lg font-bold">{readOnly ? 'Historical submission' : 'Portfolio ready for inspection'}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Version {review.version_number || 1} is preserved with its submitted evidence.</p></div>
      <div className="flex flex-wrap gap-2">{!readOnly && <button type="button" onClick={() => perform('start', () => startDeanReview(review.id))} disabled={Boolean(busyId)} className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">{busyId === 'start' ? 'Starting…' : 'Start Evaluation'}</button>}</div>
    </section>}

    {!isSubmitted && <div className="flex gap-1 rounded-lg bg-slate-100 p-1 lg:hidden dark:bg-slate-900" role="tablist" aria-label="Evaluation panels">
      <button type="button" role="tab" aria-selected={mobilePane === 'portfolio'} onClick={() => setMobilePane('portfolio')} className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${mobilePane === 'portfolio' ? 'bg-white text-emerald-900 shadow-sm dark:bg-slate-800 dark:text-emerald-200' : 'text-slate-600 dark:text-slate-300'}`}>Portfolio</button>
      <button type="button" role="tab" aria-selected={mobilePane === 'evaluation'} onClick={() => setMobilePane('evaluation')} className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${mobilePane === 'evaluation' ? 'bg-white text-emerald-900 shadow-sm dark:bg-slate-800 dark:text-emerald-200' : 'text-slate-600 dark:text-slate-300'}`}>Evaluation</button>
    </div>}
    {error && <div role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><strong>Action could not be completed</strong><p className="mt-1">{error}</p></div></div>}
    {returnSuccess && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">{returnSuccess}</div>}

    <div className={`grid gap-4 lg:h-[calc(100dvh-12rem)] lg:min-h-[620px] ${isSubmitted ? '' : 'lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]'}`}>
      <section className={`${mobilePane === 'evaluation' ? 'hidden lg:flex' : 'flex'} h-[70dvh] min-h-[480px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:h-auto dark:border-slate-800 dark:bg-slate-950`} aria-label="Submitted portfolio">
        <header className="shrink-0 border-b border-slate-200 px-4 py-3 dark:border-slate-800"><h2 className="font-bold">Submitted portfolio · Version {review.version_number || 1}</h2><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">Read-only booklet and submitted evidence</p></header>
        <PortfolioBookletDocument user={bookletUser} portfolio={bookletPortfolio} format={bookletFormat} selectedSourceId={isSubmitted ? null : serviceYearsSelected ? 'derived-service-years-C3' : active?.id}
          onSelectRow={isSubmitted ? undefined : row => { if (row.source?.id) selectItem(row.source.id); else if (row.criterionKey === 'C.3') selectServiceYears() }}
          onOpenProof={row => { const proof = evidenceFor(row.source)[0]; if (proof) setEvidence(proof) }} />
      </section>

      {!isSubmitted && <aside ref={evaluationPaneRef} className={`${mobilePane === 'portfolio' ? 'hidden lg:block' : 'block'} h-[70dvh] min-h-[480px] min-w-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white lg:h-auto dark:border-slate-800 dark:bg-slate-950`} aria-label="Evaluation of selected accomplishment">
        {serviceYearsSelected ? <div className="space-y-4 p-4">
          <section><p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Selected criterion</p><h3 className="mt-0.5 text-base font-bold leading-snug">C.3 · No. of Years of Service at NDMU</h3><p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200">This value comes from the HR employment record and is scored automatically.</p></section>
          <section className="border-t border-slate-200 pt-3 dark:border-slate-800"><h4 className="text-sm font-bold">Service record</h4><dl className="mt-2 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><div><dt className="text-xs font-medium text-slate-600 dark:text-slate-300">Completed service</dt><dd className="mt-1 font-bold">{serviceYearsCredit ? `${serviceYearsCredit.years} ${serviceYearsCredit.years === 1 ? 'year' : 'years'}` : 'Unavailable'}</dd></div><div><dt className="text-xs font-medium text-slate-600 dark:text-slate-300">Automatically scored</dt><dd className="mt-1 font-bold tabular-nums">{serviceYearsCredit ? `${pointsText(serviceYearsCredit.points)} pts` : 'Unavailable'}</dd></div></dl><p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Score follows the locked C.3 criteria. Maximum: {serviceYearsCredit ? `${pointsText(serviceYearsCredit.maximum_points)} pts` : 'Unavailable'}.</p></section>
        </div> : active ? <div className="space-y-4 p-4">
          <section><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Selected accomplishment</p><h3 className="mt-0.5 text-base font-bold leading-snug">{active.item_description}</h3></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${decisionText(active) === 'Approved' ? 'bg-emerald-50 text-emerald-800' : decisionText(active) === 'Rejected' ? 'bg-rose-50 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>{decisionText(active)}</span></div>
            {(context.subcategory || context.level) && <p className="mt-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">{[context.subcategory, context.level].filter(Boolean).join(' · ')}</p>}
            {dateDetails.length > 0 && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{dateDetails.map(row => `${row.label}: ${row.value}`).join(' · ')}</p>}
            {supplementaryDetails.length > 0 && <details className="mt-2 text-sm">
              <summary className="w-fit cursor-pointer rounded text-xs font-bold text-emerald-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Accomplishment details</summary>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">{supplementaryDetails.map(row => <div key={row.key} className="min-w-0"><dt className="text-xs font-medium text-slate-600 dark:text-slate-300">{row.label}</dt><dd className="break-words font-semibold text-slate-900 dark:text-white">{row.value}</dd></div>)}</dl>
            </details>}
          </section>

          <section className="border-t border-slate-200 pt-3 dark:border-slate-800"><h4 className="text-sm font-bold">Applicable HR criterion</h4><p className="mt-1 font-semibold">{active.criterion_code ? `${active.criterion_code} · ` : ''}{context.category || active.criterion_title || 'Criterion unavailable'}</p>
            {decisionText(active) === 'Approved' && <div role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><span className="font-bold">Saved approval: {pointsText(graduate ? preview?.graduate_level_points ?? preview?.proposed_points : active.awarded_points)} pts</span>{Number(review.version_number || 1) > 1 && active.evaluated_at && review.submitted_at && active.evaluated_at < review.submitted_at && <span> · Carried from the returned version</span>}</div>}
            {manual ? <label className="mt-3 block"><span className="text-sm font-bold">Awarded Points</span><span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">Enter more than 0 and up to {pointsText(cap)} pts (2 decimal places max).</span><input type="number" min="0" max={cap} step="0.01" inputMode="decimal" disabled={!editable || Boolean(busyId) || unresolvedScore} value={pointsValue} onChange={event => setJudgmentPoints(current => ({ ...current, [active.id]: event.target.value }))} className="mt-2 w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900" /></label>
              : <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900"><div><p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{graduate ? 'Graduate level points if approved' : 'Points if Approved'}</p><p className="text-lg font-bold tabular-nums">{preview?.proposed_points == null ? 'Unavailable' : `${pointsText(preview.proposed_points)} pts`}</p></div><p className="text-right text-xs font-semibold text-slate-700 dark:text-slate-200">{graduate ? 'Graduate units · Read-only' : preview?.mode === 'automatic' ? 'Automatic · Read-only' : preview?.mode === 'fixed' ? 'Fixed by HR criteria · Read-only' : 'Scoring unavailable'}</p></div>}
            {(preview?.scoring_basis || scoringOptions.length > 0 || (manual && preview?.maximum_additional_total_points != null) || (preview?.additional_total_points != null && preview.proposed_points != null)) && <details className="mt-2 text-xs">
              <summary className="w-fit cursor-pointer rounded font-bold text-emerald-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Scoring details</summary>
              <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {preview?.scoring_basis && <p>{preview.scoring_basis}</p>}
                {scoringOptions.length > 0 && <div><p className="font-bold">Matched locked HR options</p><ul className="mt-1 space-y-1">{scoringOptions.map((option, index) => <li key={`${option.label}-${index}`} className="flex justify-between gap-3"><span>{option.label}</span><span className="shrink-0 tabular-nums">{pointsText(option.points)} pts</span></li>)}</ul></div>}
                {manual && preview?.maximum_additional_total_points != null && <p>Maximum contribution after category and area limits: {pointsText(preview.maximum_additional_total_points)} pts.</p>}
                {preview?.additional_total_points != null && preview.proposed_points != null && <p className="font-semibold text-emerald-900 dark:text-emerald-200">{graduate && Number(preview.additional_total_points) === 0 && Number(preview.proposed_points) > 0 ? 'This graduate level is already included in the approved score summary.' : <>{decisionText(active) === 'Approved' ? 'Contributes' : 'Will add'} {pointsText(preview.additional_total_points)} pts to the approved total{Math.abs(Number(preview.additional_total_points) - Number(preview.proposed_points)) > 0.001 ? ' after category and area limits' : ''}.</>}</p>}
              </div>
            </details>}
            {unresolvedScore && <p className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">{preview?.reason || 'The backend score preview is unavailable. Refresh this review before approving.'}</p>}
          </section>

          <section className="border-t border-slate-200 pt-3 dark:border-slate-800"><h4 className="text-sm font-bold">Supporting evidence</h4>{proofs.length ? <div className="mt-2 space-y-2">{proofs.map((proof, index) => <button type="button" key={proof.id || index} onClick={() => setEvidence(proof)} className="flex w-full items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:text-emerald-200 dark:hover:bg-emerald-950/20"><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate">{proof.original_filename}</span></button>)}</div> : <p className="mt-2 text-sm text-rose-700">No supporting document is attached to this item.</p>}</section>

          <section className="border-t border-slate-200 pt-3 dark:border-slate-800"><label className="block text-sm font-bold" htmlFor={`remarks-${active.id}`}>Evaluator remarks</label><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">A reason is required when rejecting.</p><textarea id={`remarks-${active.id}`} rows="3" maxLength="2000" disabled={!editable || Boolean(busyId)} value={note[active.id] ?? active.rejection_reason ?? active.evaluator_remarks ?? remarkSuggestion} onChange={event => setNote(current => ({ ...current, [active.id]: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900" /></section>

          <div className="grid grid-cols-2 gap-2"><button type="button" onClick={reject} disabled={!editable || Boolean(busyId)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-300 px-3 py-2.5 text-sm font-bold text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:opacity-40 dark:text-rose-200"><X className="h-4 w-4" />Reject</button><button type="button" onClick={approve} disabled={!editable || Boolean(busyId) || unresolvedScore || (manual && !validManualPoints(pointsValue, cap))} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 py-2.5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:opacity-40"><Check className="h-4 w-4" />Approve</button></div>
          {editable && <button type="button" onClick={saveRemarks} disabled={Boolean(busyId) || note[active.id] === undefined} className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"><Save className="h-3.5 w-3.5" />Save remarks</button>}
          {busyId === active.id && <p aria-live="polite" className="flex items-center gap-2 text-xs font-semibold"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Saving decision…</p>}
          {savedAt && <p role="status" className="text-xs text-slate-600 dark:text-slate-300">Saved and reloaded at {savedAt}</p>}
          {items.length > 0 && remaining === 0 && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">All accomplishment decisions are complete. You can revisit any item or continue below.</p>}
          <nav aria-label="Submitted accomplishments" className="flex items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><button type="button" onClick={() => navigate(-1)} disabled={Boolean(busyId) || activeIndex === 0} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40 dark:border-slate-700"><ChevronLeft className="h-4 w-4" />Previous</button><span className="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">{activeIndex + 1} of {items.length}</span><button type="button" onClick={() => navigate(1)} disabled={Boolean(busyId) || activeIndex >= items.length - 1} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40 dark:border-slate-700">Next<ChevronRight className="h-4 w-4" /></button></nav>
        </div> : <p className="p-5 text-sm text-slate-600 dark:text-slate-300">No submitted accomplishments are available for evaluation.</p>}
      </aside>}
    </div>

     {!isSubmitted && !readOnly && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800"><div className="flex flex-wrap items-center gap-2"><button type="button" disabled={!editable || Boolean(busyId)} onClick={openReturnDialog} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-40 dark:border-slate-700 dark:text-slate-100"><RotateCcw className="h-4 w-4" />Return portfolio</button></div><div className="flex items-center gap-3"><p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{remaining} remaining</p><button type="button" disabled={!editable || Boolean(busyId) || remaining > 0} onClick={endorse} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-slate-950">Endorse to HR</button></div></footer>}

    <ConfirmDialog isOpen={returnDialog.open} title="Return Portfolio for Revision"
      message={`${review.personnel_name || review.faculty_name || review.full_name || 'Faculty member'} · Portfolio Version ${review.version_number || 1}\nExplain what needs to be corrected. The faculty member will see your instructions when the portfolio is returned.`}
      tone="default" inputLabel="Revision Instructions" inputRequired
      inputValue={returnDialog.instructions} inputPlaceholder="e.g., Please upload the correct certificate for your research accomplishment."
      inputHint="The entire portfolio will be returned for correction." inputError={returnDialog.error} inputMaxLength={500}
      onInputChange={instructions => setReturnDialog(current => ({ ...current, instructions, error: '' }))}
      cancelLabel="Cancel" confirmLabel={busyId === 'return' ? 'Returning…' : 'Return Portfolio'}
      isProcessing={busyId === 'return'} onCancel={closeReturnDialog} onConfirm={returnPortfolio} />

    {evidence && <PersonnelEvidencePreviewModal evidence={evidence} onClose={() => setEvidence(null)} />}
  </div>
}
