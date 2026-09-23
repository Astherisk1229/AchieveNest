import React, { useEffect, useState } from 'react'
import { AlertCircle, Check, ChevronRight, FileText, LoaderCircle, RotateCcw, Save, Send, X } from 'lucide-react'
import PersonnelEvidencePreviewModal from '../personnel/modals/PersonnelEvidencePreviewModal'
import { approveDeanReviewItem, endorseDeanReview, getDeanReviewReport, rejectDeanReviewItem, returnDeanReview, startDeanReview } from '../../services/deanWorkspaceService'
import FacultyEvaluationSummary from '../../components/evaluation/FacultyEvaluationSummary'

const label = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
const evidenceFor = item => (item.evidence_snapshot?.length ? item.evidence_snapshot : item.evidence_id ? [{ id: item.evidence_id, original_filename: item.file_name || 'Supporting evidence', mime_type: item.mime_type || 'application/pdf' }] : []).map(row => ({ ...row, id: row.id || row.evidence_id, original_filename: row.original_filename || row.file_name || 'Supporting evidence', mime_type: row.mime_type || row.detected_mime_type || 'application/pdf' }))

export default function DeanPortfolioEvaluationWorkspace({ data, onReload }) {
  const { review = {}, items = [] } = data || {}
  const [activeId, setActiveId] = useState(items[0]?.id || '')
  const [busyId, setBusyId] = useState('')
  const [note, setNote] = useState({})
  const [error, setError] = useState('')
  const [evidence, setEvidence] = useState(null)
  const [mobilePane, setMobilePane] = useState('portfolio')
  const [savedAt, setSavedAt] = useState('')
  const [report, setReport] = useState(null)
  const active = items.find(item => item.id === activeId) || items[0]
  const reviewed = items.filter(item => ['verified', 'ineligible'].includes(item.verification_status) && (item.verification_status !== 'verified' || item.rating_status === 'rated')).length
  const approved = items.filter(item => item.verification_status === 'verified' && item.rating_status === 'rated').length
  const rejected = items.filter(item => item.verification_status === 'ineligible').length
  const remaining = items.length - reviewed
  const total = items.reduce((sum, item) => sum + Number(item.awarded_points || 0), 0)
  const editable = ['submitted', 'in_evaluation'].includes(review.status)
  useEffect(() => { if (['ready_for_finalization', 'completed'].includes(review.status)) getDeanReviewReport(review.id).then(result => setReport(result.report?.snapshot || result.report?.report_payload || result.report)).catch(() => setReport(null)) }, [review.id, review.status])

  const perform = async (id, action) => {
    setBusyId(id); setError('')
    try { await action(); setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); await onReload() }
    catch (failure) { setError(failure?.error?.message || failure?.message || 'Decision was not saved. Try again.') }
    finally { setBusyId('') }
  }
  const start = () => perform('start', () => startDeanReview(review.id))
  const approve = item => perform(item.id, () => approveDeanReviewItem(review.id, item.id, note[item.id] || ''))
  const reject = item => {
    const reason = String(note[item.id] || '').trim()
    if (!reason) { setError('A rejection reason is required.'); return }
    perform(item.id, () => rejectDeanReviewItem(review.id, item.id, reason))
  }
  const returnPortfolio = () => {
    const reason = window.prompt('Why is the whole portfolio being returned for revision?')?.trim()
    if (reason) perform('return', () => returnDeanReview(review.id, reason))
  }
  const saveDraft = async () => {
    setBusyId('draft'); setError('')
    try { await onReload(); setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) }
    catch (failure) { setError(failure?.error?.message || failure?.message || 'Saved decisions could not be reloaded. Try again.') }
    finally { setBusyId('') }
  }
  if (report) return <FacultyEvaluationSummary report={report} />
  const endorse = () => {
    if (remaining) { setError(`Evaluation is incomplete. ${remaining} submitted achievement${remaining === 1 ? '' : 's'} still need a decision.`); const first=items.find(item => !['verified','ineligible'].includes(item.verification_status) || (item.verification_status==='verified'&&item.rating_status!=='rated')); if(first)setActiveId(first.id); return }
    if (window.confirm('Endorse this completed Dean evaluation to HR? You will no longer be able to change decisions.')) perform('endorse', () => endorseDeanReview(review.id))
  }

  if (review.status === 'submitted') return <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-950"><FileText className="mx-auto h-9 w-9 text-emerald-700" /><h2 className="mt-4 text-xl font-black">Submitted portfolio is ready</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">Start the evaluation to record decisions against Version {review.version_number || 1} and its locked criteria.</p>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}<button onClick={start} disabled={busyId === 'start'} className="mt-5 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busyId === 'start' ? 'Starting…' : 'Start Evaluation'}</button></section>

  return <div className="space-y-4">
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1 lg:hidden dark:bg-slate-900"><button onClick={() => setMobilePane('portfolio')} className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${mobilePane==='portfolio'?'bg-white shadow-sm dark:bg-slate-800':''}`}>Portfolio</button><button onClick={() => setMobilePane('evaluation')} className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${mobilePane==='evaluation'?'bg-white shadow-sm dark:bg-slate-800':''}`}>Evaluation · {reviewed}/{items.length}</button></div>
    {error && <div role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><strong>Action could not be completed</strong><p>{error}</p></div></div>}
    <div className="grid min-h-[640px] gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]">
      <section className={`${mobilePane==='evaluation'?'hidden lg:block':''} overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950`} aria-label="Exact submitted portfolio">
        <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-black">Submitted Portfolio · Version {review.version_number || 1}</h2><p className="mt-1 text-xs text-slate-500">Immutable submission order and attached evidence</p></header>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">{items.map((item,index) => { const proofs=evidenceFor(item); return <article id={`portfolio-item-${item.id}`} key={item.id} onClick={() => {setActiveId(item.id);setMobilePane('evaluation')}} className={`cursor-pointer px-5 py-5 transition ${active?.id===item.id?'bg-emerald-50/70 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-950/20':''}`}><div className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black tabular-nums dark:bg-slate-800">{index+1}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{item.criterion_code} · {label(item.portfolio_section || item.domain)}</p><h3 className="mt-1 font-bold text-slate-950 dark:text-white">{item.item_description}</h3><div className="mt-3 flex flex-wrap gap-2">{proofs.map(proof => <button key={proof.id} type="button" onClick={event => {event.stopPropagation();setEvidence(proof)}} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold hover:border-emerald-500 dark:border-slate-700"><FileText className="h-3.5 w-3.5" />{proof.original_filename}</button>)}{!proofs.length && <span className="text-xs font-semibold text-rose-700">Evidence unavailable</span>}</div></div><ChevronRight className="h-5 w-5 shrink-0 text-slate-400" /></div></article>})}</div>
      </section>
      <aside className={`${mobilePane==='portfolio'?'hidden lg:block':''} lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950`} aria-label="Locked criteria evaluation sheet">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="font-black">Locked HR Criteria</h2><p className="mt-1 text-xs text-slate-500">{review.criteria_snapshot?.version?.version_label || review.evaluation_scale_version_id}</p></header>
        {active ? <div className="p-5"><p className="text-xs font-black text-emerald-800 dark:text-emerald-300">{active.criterion_code}</p><h3 className="mt-1 text-lg font-black">{active.criterion_snapshot?.category?.name || active.criterion_title || active.item_description}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{active.criterion_snapshot?.level?.description || active.criterion_snapshot?.category?.description || 'Verify the submitted achievement and evidence against this locked criterion.'}</p><dl className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-200 py-4 text-sm dark:border-slate-800"><div><dt className="text-xs font-bold text-slate-500">Configured points</dt><dd className="mt-1 text-lg font-black tabular-nums">{Number(active.configured_points_snapshot || 0).toFixed(2)}</dd></div><div><dt className="text-xs font-bold text-slate-500">Awarded points</dt><dd className="mt-1 text-lg font-black tabular-nums">{Number(active.awarded_points || 0).toFixed(2)}</dd></div></dl><label className="mt-4 block"><span className="text-sm font-bold">{active.verification_status==='ineligible'?'Rejection reason':'Evaluator note'}</span><textarea disabled={!editable || busyId===active.id} value={note[active.id] ?? active.rejection_reason ?? active.evaluator_remarks ?? ''} onChange={event => setNote(value => ({...value,[active.id]:event.target.value}))} rows="4" placeholder="A reason is required when rejecting." className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><div className="mt-4 grid grid-cols-2 gap-2"><button disabled={!editable||busyId===active.id||!active.configured_points_snapshot} onClick={() => approve(active)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-40"><Check className="h-4 w-4" />Approve</button><button disabled={!editable||busyId===active.id} onClick={() => reject(active)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 px-3 py-2.5 text-sm font-bold text-rose-800 disabled:opacity-40 dark:text-rose-200"><X className="h-4 w-4" />Reject</button></div>{busyId===active.id&&<p aria-live="polite" className="mt-3 flex items-center gap-2 text-xs font-semibold"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Saving decision…</p>}</div> : <p className="p-8 text-sm text-slate-500">No submitted achievements.</p>}
        <div className="border-t border-slate-200 p-5 dark:border-slate-800"><p className="text-sm font-black">Progress · {reviewed}/{items.length}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-emerald-700" style={{width:`${items.length ? reviewed/items.length*100 : 0}%`}} /></div><div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs"><div><strong>{approved}</strong><br/>Approved</div><div><strong>{rejected}</strong><br/>Rejected</div><div><strong>{remaining}</strong><br/>Remaining</div><div><strong>{total.toFixed(2)}</strong><br/>Points</div></div>{savedAt&&<p className="mt-3 text-xs text-slate-500">Saved and reloaded {savedAt}</p>}<div className="mt-4 space-y-2"><button disabled={busyId==='draft'} onClick={saveDraft} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700"><Save className="h-4 w-4" />{busyId==='draft'?'Checking saved draft…':'Save Draft'}</button><div className="grid grid-cols-2 gap-2"><button disabled={!editable} onClick={returnPortfolio} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 px-2 py-2 text-xs font-bold disabled:opacity-40 dark:border-slate-700"><RotateCcw className="h-3.5 w-3.5" />Return</button><button disabled={!editable||remaining>0} onClick={endorse} className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-950 px-2 py-2 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-slate-950"><Send className="h-3.5 w-3.5" />Endorse to HR</button></div></div></div>
      </aside>
    </div>{evidence&&<PersonnelEvidencePreviewModal evidence={evidence} onClose={() => setEvidence(null)} />}
  </div>
}
