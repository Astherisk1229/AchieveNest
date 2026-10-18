import React, { useEffect, useState } from 'react'
import { Download, Printer } from 'lucide-react'

const number = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const present = value => value !== null && value !== undefined && value !== ''
const display = value => present(value) ? value : '—'
const score = value => present(value) ? number.format(Number(value)) : '—'

const compactNumber = value => {
  if (!present(value) || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString('en-PH', { maximumFractionDigits: 2 })
}

const percentage = value => {
  if (!present(value) || Number.isNaN(Number(value))) return '—'
  const numeric = Number(value)
  return numeric >= 0 && numeric <= 1 ? numeric.toFixed(2).replace(/^0/, '') : compactNumber(numeric)
}

const criterionDetails = item => {
  const snapshot = item.criterion_snapshot || {}
  return {
    code: item.criterion_code || snapshot.code || snapshot.criterion_code || '—',
    title: snapshot.title || snapshot.name || snapshot.criterion || item.item_description || item.achievement || 'Criterion snapshot',
  }
}

export default function NonTeachingRankingScale({ result, preview = false, context = {}, onSaveComments, embedded = false, showApprovalLines = true }) {
  const summary = result.summary || {}
  const recordedRank = field => Object.prototype.hasOwnProperty.call(summary, field) ? summary[field] : context[field]
  const savedAppliedRank = recordedRank('rank_applied_for')
  const appliedRank = savedAppliedRank === 'Non-teaching rank sequence not configured'
    ? context.rank_applied_for
    : savedAppliedRank || context.rank_applied_for
  const savedAppliedStatus = recordedRank('rank_applied_for_status')
  const appliedStatus = !savedAppliedRank && ['PENDING_CONFIRMATION', 'UNRESOLVED', 'QUALIFICATION_REQUIRED', 'OK'].includes(savedAppliedStatus)
    ? context.rank_applied_for_status || savedAppliedStatus
    : savedAppliedStatus || context.rank_applied_for_status
  const presentRank = recordedRank('present_rank') || context.present_rank
  const mastersRequiredLabel = ['Assistant Instructor', 'Senior Instructor'].includes(presentRank)
    ? 'Assistant Professor (verified Master’s required)'
    : 'Verified Master’s required for advancement'
  const appliedRankDisplay = appliedRank || (appliedStatus === 'MASTERS_REQUIRED'
    ? mastersRequiredLabel : appliedStatus === 'RULE_REVIEW_REQUIRED'
    || (recordedRank('present_rank') === 'Assistant Instructor' && appliedStatus === 'TERMINAL')
    ? 'Pending rank-rule review' : appliedStatus === 'TERMINAL' ? 'No next rank under current rules' : 'Rank progression requires review')
  const comments = context.comments !== undefined ? context.comments : summary.comments || ''
  const effectivity = context.effectivity || summary.effectivity || context.review_completed_at || 'Pending approval'
  const savedRecommendationIsLegacy = summary.recommended_rank_status === 'legacy_recommendation_unavailable'
  const recommendationStatus = savedRecommendationIsLegacy
    ? context.recommended_rank_status || summary.recommended_rank_status
    : summary.recommended_rank_status || context.recommended_rank_status
  const recommendedRank = (savedRecommendationIsLegacy ? null : summary.recommended_rank)
    || context.recommended_rank || ({
    pending_rule_review: 'Rank recommendation pending rule review',
    retained_masters_required: recordedRank('present_rank') || 'Present rank retained',
    pending_rank_application_confirmation: 'Rank application confirmation required',
    passing_score_unavailable: 'Passing score unavailable',
    present_rank_unresolved: 'Present rank requires review',
    legacy_recommendation_unavailable: 'Unavailable for this saved evaluation',
  }[recommendationStatus] || 'Pending evaluation completion')
  const [editingComments, setEditingComments] = useState(false)
  const [draftComments, setDraftComments] = useState(comments)
  const [savingComments, setSavingComments] = useState(false)
  const [commentsError, setCommentsError] = useState('')
  const printSummary = (saveAsPdf = false) => {
    const originalTitle = document.title
    const restoreTitle = () => { document.title = originalTitle }
    window.addEventListener('afterprint', restoreTitle, { once: true })
    if (saveAsPdf) document.title = `Non-Teaching-Evaluation-${result.personnel?.name || 'Summary'}`
    try { window.print() } catch (error) {
      window.removeEventListener('afterprint', restoreTitle)
      restoreTitle()
      throw error
    }
  }
  useEffect(() => { setDraftComments(comments); setCommentsError('') }, [comments])
  const saveComments = async () => {
    if (!onSaveComments || savingComments) return
    setSavingComments(true)
    setCommentsError('')
    try { await onSaveComments(draftComments.trim()); setEditingComments(false) }
    catch (error) { setCommentsError(error?.response?.data?.error?.message || error?.message || 'Comments could not be saved.') }
    finally { setSavingComments(false) }
  }
  const performance = normalizedSection(summary.performance_personal_indicators, result.items, item => String(item.criterion_code || '').toUpperCase().startsWith('A'))
  const service = normalizedSection(summary.service_leadership, result.items, item => !String(item.criterion_code || '').toUpperCase().startsWith('A'))
  const performanceTotal = present(performance.points_earned) ? performance.points_earned : result.scores?.areas?.A
  const serviceTotal = present(service.points_earned)
    ? service.points_earned
    : sumKnown([result.scores?.areas?.B, result.scores?.areas?.C])
  const resultLabel = summary.result || result.scores?.passing_status || (Number(result.scores?.total || 0) >= Number(result.scores?.passing || Infinity) ? 'Passed' : 'Retained')
  const passed = String(resultLabel).toLowerCase() === 'passed'
  const retained = String(resultLabel).toLowerCase() === 'retained'
  return <div className={embedded ? 'space-y-3' : ''}>
    <style>{`@media print { body * { visibility: hidden !important; } [data-evaluation-summary], [data-evaluation-summary] * { visibility: visible !important; } [data-evaluation-summary] { position: absolute; inset: 0; width: 100%; } [data-print-hidden] { display: none !important; } @page { size: A4; margin: 12mm; } }`}</style>
    {!embedded && <div data-print-hidden className="border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
      <div><h1 className="text-xl font-black tracking-[-0.025em] text-slate-950 dark:text-white">{preview ? 'Non-Teaching Evaluation Summary' : 'Non-Teaching Faculty Evaluation Result'}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{preview ? 'Saved review summary' : 'Official completed personnel ranking scale'}</p></div>
    </div>}
    <div data-print-hidden className={`flex flex-wrap items-center justify-end gap-2 ${embedded ? '' : 'px-5 py-3'}`}>
      {context.comments_editable && onSaveComments && <button type="button" onClick={() => setEditingComments(value => !value)} aria-expanded={editingComments} className="min-h-10 rounded-lg border border-emerald-700 bg-white px-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{editingComments ? 'Close comments' : 'Edit comments'}</button>}
      <button type="button" onClick={() => printSummary()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:border-emerald-700 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Printer className="h-4 w-4"/>Print</button>
      <button type="button" onClick={() => printSummary(true)} title="Choose Save as PDF in the print dialog" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><Download className="h-4 w-4"/>Save PDF</button>
    </div>
    {editingComments && context.comments_editable && onSaveComments && <div data-print-hidden className="space-y-3 border-b border-slate-200 bg-white p-4"><label htmlFor="non-teaching-summary-comments" className="block text-sm font-bold">Evaluation summary comments</label><textarea id="non-teaching-summary-comments" value={draftComments} onChange={event => setDraftComments(event.target.value)} rows={3} maxLength={2000} className="w-full rounded-lg border border-slate-300 p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"/><div className="flex items-center justify-between gap-3"><span role="alert" className="text-sm text-rose-700">{commentsError}</span><button type="button" disabled={savingComments || draftComments.trim() === String(comments || '').trim()} onClick={saveComments} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{savingComments ? 'Saving…' : 'Save comments'}</button></div></div>}

    <article data-evaluation-summary className={`mx-auto w-full max-w-[980px] bg-white px-4 py-5 text-[13px] leading-snug text-slate-950 sm:px-8 sm:py-7 print:m-0 print:max-w-none print:p-0 print:text-[10px] ${embedded ? '' : 'my-5'}`}>
      <header className="relative text-center">
        <p className="font-bold uppercase">Notre Dame of Marbel University</p>
        <p>City of Koronadal, South Cotabato</p>
        <h2 className="mt-2 text-lg font-black uppercase underline decoration-1 underline-offset-4 print:text-[14px]">Non-Teaching Personnel Ranking Scale</h2>
        {preview && <p className="mt-2 font-bold uppercase text-amber-800 print:text-black">Saved review summary</p>}
      </header>

      <section className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2" aria-label="Personnel ranking details">
        <FormField label="Name" value={result.personnel?.name || summary.personnel_information?.name}/>
        <FormField label="Department" value={result.personnel?.department || result.personnel?.college || summary.personnel_information?.department}/>
        <FormField label="Specific Job" value={result.personnel?.position || summary.personnel_information?.position}/>
        <FormField label="Period Covered" value={summary.period_covered || result.evaluation_period?.name || result.evaluation_period?.academic_year}/>
        <FormField label="Employee's Progress last Ranking" value={recordedRank('employee_progress_last_ranking') || 'No prior rank recorded'}/>
        <FormField label="Present Rank" value={presentRank || 'No present rank recorded'}/>
        <FormField label="Rank Applied For" value={appliedRankDisplay}/>
      </section>

      <div className="mt-5 overflow-x-auto border border-slate-950 print:overflow-visible">
        <table className="w-full min-w-[720px] border-collapse text-left print:min-w-0" aria-label="Non-teaching personnel ranking scale criteria">
          <thead><tr className="bg-slate-100 print:bg-slate-100">
            <th className="w-[52%] border-b border-r border-slate-950 px-2 py-1.5 text-center font-bold">Criteria</th>
            <th className="w-[12%] border-b border-r border-slate-950 px-2 py-1.5 text-center font-bold">Weight</th>
            <th className="w-[10%] border-b border-r border-slate-950 px-2 py-1.5 text-center font-bold">%</th>
            <th className="w-[10%] border-b border-r border-slate-950 px-2 py-1.5 text-center font-bold">DS</th>
            <th className="w-[16%] border-b border-slate-950 px-2 py-1.5 text-right font-bold">Points Earned</th>
          </tr></thead>
          <tbody>
            <SectionRow code="A" title="Performance and Personal Indicators"/>
            {performance.items.map((item, index) => <OfficialRow key={item.criterion_code || index} item={item} index={index}/>) }
            {performance.items.length === 0 && <EmptyOfficialRow/>}
            <TotalRow label="Category Total" value={performanceTotal}/>
            <SectionRow code="B" title="Service and Leadership"/>
            {service.items.map((item, index) => <OfficialRow key={item.criterion_code || index} item={item} index={index}/>) }
            {service.items.length === 0 && <EmptyOfficialRow/>}
            <TotalRow label="Category Total" value={serviceTotal}/>
            <tr className="bg-slate-100 font-black print:bg-slate-100"><td className="border-r border-slate-950 px-2 py-2 uppercase">Total</td><td colSpan="3" className="border-r border-slate-950 px-2 py-2 text-right">Maximum {score(result.scores?.maximum)}</td><td className="px-2 py-2 text-right tabular-nums">{score(result.scores?.total)}</td></tr>
          </tbody>
        </table>
      </div>

      <section className="mt-4 space-y-3" aria-label="Evaluation outcome">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-bold">
          <span>Passing Score: {score(result.scores?.passing ?? summary.passing_score)} points</span>
          <StatusBox checked={passed} label="Passed"/>
          <StatusBox checked={retained} label="Retained"/>
          <span className="ml-auto">Effectivity: <Blank value={effectivity}/></span>
        </div>
        <p><strong>Recommended Rank:</strong> <Blank value={recommendedRank}/></p>
        <p><strong>Comments:</strong> <span className="inline-block min-w-[70%] border-b border-slate-950 px-2">{comments || 'No summary comments added'}</span></p>
      </section>

      {showApprovalLines && <section className="mt-6 grid gap-6 sm:grid-cols-2 print:grid-cols-2" aria-label="Approval lines">
        <SignatureLine label="Recommended for Approval" value={summary.approvals?.chair?.name}/>
        <div><p className="font-bold">Members:</p><div className="mt-5 grid grid-cols-2 gap-4"><SignatureLine label="Member"/><SignatureLine label="Member"/></div></div>
        <SignatureLine label="Chair"/>
        <SignatureLine label="Approved / President" value={summary.approvals?.president?.name}/>
      </section>}

    </article>
  </div>
}

function normalizedSection(section, items, predicate) {
  if (section && typeof section === 'object' && Array.isArray(section.items)) return section
  const fallback = (items || []).filter(predicate).map(item => {
    const criterion = criterionDetails(item)
    return {
      criterion_code: criterion.code,
      indicator: criterion.title,
      document: item.achievement || item.item_description || criterion.title,
      weight: item.configured_points,
      points_earned: item.awarded_points,
    }
  })
  return { items: fallback, points_earned: typeof section === 'number' ? section : undefined }
}

function sumKnown(values) {
  const known = values.filter(present).map(Number)
  return known.length ? known.reduce((total, value) => total + value, 0) : undefined
}

function FormField({ label, value }) { return <p className="flex min-w-0 gap-2"><strong className="shrink-0">{label}:</strong><span className="min-w-0 flex-1 border-b border-slate-950 px-1 font-semibold">{display(value)}</span></p> }
function SectionRow({ code, title }) { return <tr className="bg-slate-200 font-black print:bg-slate-200"><td colSpan="5" className="border-b border-slate-950 px-2 py-1.5">{code}. {title}</td></tr> }
function EmptyOfficialRow() { return <tr><td className="border-b border-r border-slate-950 px-2 py-2 text-slate-500">No frozen criterion rows were recorded.</td><td className="border-b border-r border-slate-950"/><td className="border-b border-r border-slate-950"/><td className="border-b border-r border-slate-950"/><td className="border-b border-slate-950"/></tr> }
function OfficialRow({ item, index }) {
  const label = item.indicator || item.document || item.title || 'Criterion'
  const code = item.criterion_code || `${index + 1}`
  const weight = item.weight ?? item.maximum_points ?? item.max_points
  return <tr><td className="border-b border-r border-slate-950 px-2 py-1.5"><span className="font-semibold">{code}</span> {label}</td><td className="border-b border-r border-slate-950 px-2 py-1.5 text-center tabular-nums">{present(weight) ? `${compactNumber(weight)} pts` : '—'}</td><td className="border-b border-r border-slate-950 px-2 py-1.5 text-center tabular-nums">{percentage(item.percentage)}</td><td className="border-b border-r border-slate-950 px-2 py-1.5 text-center tabular-nums">{compactNumber(item.ds)}</td><td className="border-b border-slate-950 px-2 py-1.5 text-right font-semibold tabular-nums">{score(item.points_earned)}</td></tr>
}
function TotalRow({ label, value }) { return <tr className="font-bold"><td className="border-b border-r border-slate-950 px-2 py-1.5 text-right">{label}</td><td colSpan="3" className="border-b border-r border-slate-950"/><td className="border-b border-slate-950 px-2 py-1.5 text-right tabular-nums">{score(value)}</td></tr> }
function StatusBox({ checked, label }) { return <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center border border-slate-950 text-[11px] leading-none">{checked ? 'X' : ''}</span>{label}</span> }
function Blank({ value }) { return <span className="inline-block min-w-32 border-b border-slate-950 px-2 text-center font-semibold">{display(value)}</span> }
function SignatureLine({ label, value }) { return <div className="pt-5 text-center"><p className="min-h-5 border-b border-slate-950 font-semibold">{present(value) ? value : ''}</p><p className="mt-1 text-xs">{label}</p></div> }
