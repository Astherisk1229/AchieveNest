import React, { useEffect, useState } from 'react'
import { AlertCircle, Check, ChevronRight, FileText, LoaderCircle, MessageSquareWarning, RotateCcw, Save, Send, X } from 'lucide-react'
import PersonnelEvidencePreviewModal from '../personnel/modals/PersonnelEvidencePreviewModal'
import { approveDeanReviewItem, createDeanDeficiency, endorseDeanReview, getDeanReviewReport, rejectDeanReviewItem, returnDeanReview, startDeanReview } from '../../services/deanWorkspaceService'
import FacultyEvaluationSummary from '../../components/evaluation/FacultyEvaluationSummary'
import FacultyPhaseOWorkspace from '../../components/evaluation/FacultyPhaseOWorkspace'

const label = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
const evidenceFor = item => (item.evidence_snapshot?.length ? item.evidence_snapshot : item.evidence_id ? [{ id: item.evidence_id, original_filename: item.file_name || 'Supporting evidence', mime_type: item.mime_type || 'application/pdf' }] : []).map(row => ({ ...row, id: row.id || row.evidence_id, original_filename: row.original_filename || row.file_name || 'Supporting evidence', mime_type: row.mime_type || row.detected_mime_type || 'application/pdf' }))
const submittedDetailsFor = item => item.scoring_payload?.category_metadata?.details || {}

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
  const [deficiency, setDeficiency] = useState({ open: false, itemId: '', reason: '' })
  const active = items.find(item => item.id === activeId) || items[0]
  const reviewed = items.filter(item => ['verified', 'ineligible'].includes(item.verification_status) && (item.verification_status !== 'verified' || item.rating_status === 'rated')).length
  const approved = items.filter(item => item.verification_status === 'verified' && item.rating_status === 'rated').length
  const rejected = items.filter(item => item.verification_status === 'ineligible').length
  const remaining = items.length - reviewed
  const total = items.reduce((sum, item) => sum + Number(item.awarded_points || 0), 0)
  const isSubmitted = review.status === 'submitted'
  const editable = review.status === 'in_evaluation'
  const deficiencyAllowed = review.status !== 'completed'
  useEffect(() => { if (review.status === 'completed') getDeanReviewReport(review.id).then(result => setReport(result.report?.snapshot || result.report?.report_payload || result.report)).catch(() => setReport(null)) }, [review.id, review.status])

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
  const openDeficiency = item => {
    setError('')
    setDeficiency({ open: true, itemId: item?.id || '', reason: '' })
  }
  const closeDeficiency = () => {
    if (busyId !== 'deficiency') setDeficiency({ open: false, itemId: '', reason: '' })
  }
  const submitDeficiency = async event => {
    event.preventDefault()
    const reason = deficiency.reason.trim()
    if (!reason) { setError('Correction details are required.'); return }
    setBusyId('deficiency'); setError('')
    try {
      await createDeanDeficiency(review.id, reason, deficiency.itemId)
      setDeficiency({ open: false, itemId: '', reason: '' })
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      await onReload()
    } catch (failure) {
      setError(failure?.response?.data?.error?.message || failure?.error?.message || failure?.message || 'The correction request could not be created.')
    } finally { setBusyId('') }
  }
  const saveDraft = async () => {
    setBusyId('draft'); setError('')
    try { await onReload(); setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) }
    catch (failure) { setError(failure?.error?.message || failure?.message || 'Saved decisions could not be reloaded. Try again.') }
    finally { setBusyId('') }
  }
  if (review.status === 'ready_for_finalization') return <FacultyPhaseOWorkspace evaluationId={review.id} mode="reviewer" onChanged={onReload} />
  if (report) return <FacultyEvaluationSummary report={report} />
  const endorse = () => {
    if (remaining) { setError(`Evaluation is incomplete. ${remaining} submitted achievement${remaining === 1 ? '' : 's'} still need a decision.`); const first=items.find(item => !['verified','ineligible'].includes(item.verification_status) || (item.verification_status==='verified'&&item.rating_status!=='rated')); if(first)setActiveId(first.id); return }
    if (window.confirm('Endorse this completed Dean evaluation to HR? You will no longer be able to change decisions.')) perform('endorse', () => endorseDeanReview(review.id))
  }

  const deficiencyDialog = deficiency.open && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-label="Request Correction"><form onSubmit={submitDeficiency} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-950"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">Request Correction</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Create an item-level deficiency without returning the whole portfolio.</p></div><button type="button" onClick={closeDeficiency} disabled={busyId === 'deficiency'} aria-label="Close correction request" className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button></div><div className="mt-5 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Linked portfolio item</p><p className="mt-1 font-bold">{items.find(item => item.id === deficiency.itemId)?.item_description || 'Whole portfolio'}</p></div><label className="mt-5 block"><span className="text-sm font-bold">Correction details</span><textarea autoFocus required maxLength="500" rows="5" value={deficiency.reason} onChange={event => setDeficiency(current => ({ ...current, reason: event.target.value }))} disabled={busyId === 'deficiency'} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Explain what supporting information must be reviewed or revised." /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={closeDeficiency} disabled={busyId === 'deficiency'} className="rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40">Cancel</button><button type="submit" disabled={busyId === 'deficiency' || !deficiency.reason.trim()} className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{busyId === 'deficiency' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MessageSquareWarning className="h-4 w-4" />}{busyId === 'deficiency' ? 'Creating…' : 'Create Deficiency Request'}</button></div></form></div>

  return <div className="space-y-4">
    {isSubmitted && <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 dark:border-slate-800 dark:bg-slate-950"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><FileText className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" /><div><h2 className="text-lg font-black">Submitted portfolio is ready for inspection</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Review Version {review.version_number || 1}, its revised details, and attached evidence before starting the evaluation. Scoring remains unavailable until evaluation begins.</p></div></div><div className="flex shrink-0 flex-wrap gap-2"><button onClick={start} disabled={busyId === 'start'} className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busyId === 'start' ? 'Starting…' : 'Start Evaluation'}</button>{deficiencyAllowed && items[0] && <button onClick={() => openDeficiency(items[0])} className="rounded-lg border border-amber-300 px-5 py-2.5 text-sm font-bold text-amber-900 dark:text-amber-200">Request Correction</button>}</div></div></section>}
    {!isSubmitted&&<div className="flex gap-1 rounded-lg bg-slate-100 p-1 lg:hidden dark:bg-slate-900"><button onClick={() => setMobilePane('portfolio')} className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${mobilePane==='portfolio'?'bg-white shadow-sm dark:bg-slate-800':''}`}>Portfolio</button><button onClick={() => setMobilePane('evaluation')} className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${mobilePane==='evaluation'?'bg-white shadow-sm dark:bg-slate-800':''}`}>Evaluation · {reviewed}/{items.length}</button></div>}
    {error && <div role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><strong>Action could not be completed</strong><p>{error}</p></div></div>}
    <div className={`grid min-h-[640px] gap-4 ${isSubmitted ? '' : 'lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]'}`}>
      <section className={`${mobilePane==='evaluation'?'hidden lg:block':''} overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950`} aria-label="Exact submitted portfolio">
        <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-black">Submitted Portfolio · Version {review.version_number || 1}</h2><p className="mt-1 text-xs text-slate-500">Immutable submission order and attached evidence</p></header>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">{items.map((item,index) => { const proofs=evidenceFor(item); const details=submittedDetailsFor(item); return <article id={`portfolio-item-${item.id}`} key={item.id} onClick={() => {if(!isSubmitted){setActiveId(item.id);setMobilePane('evaluation')}}} className={`px-5 py-5 transition ${isSubmitted?'':'cursor-pointer'} ${!isSubmitted&&active?.id===item.id?'bg-emerald-50/70 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-950/20':''}`}><div className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black tabular-nums dark:bg-slate-800">{index+1}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{item.criterion_code} · {label(item.portfolio_section || item.domain)}</p><h3 className="mt-1 font-bold text-slate-950 dark:text-white">{item.item_description}</h3>{details.venue&&<dl className="mt-3 text-sm"><dt className="text-xs font-bold text-slate-500">Venue</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{details.venue}</dd></dl>}<div className="mt-3 flex flex-wrap gap-2">{proofs.map(proof => <button key={proof.id} type="button" onClick={event => {event.stopPropagation();setEvidence(proof)}} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold hover:border-emerald-500 dark:border-slate-700"><FileText className="h-3.5 w-3.5" />{proof.original_filename}</button>)}{!proofs.length && <span className="text-xs font-semibold text-rose-700">Evidence unavailable</span>}</div></div>{!isSubmitted&&<ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />}</div></article>})}</div>
      </section>
      {!isSubmitted&&<aside className={`${mobilePane==='portfolio'?'hidden lg:block':''} lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950`} aria-label="Locked criteria evaluation sheet">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="font-black">Locked HR Criteria</h2><p className="mt-1 text-xs text-slate-500">{review.criteria_snapshot?.version?.version_label || review.evaluation_scale_version_id}</p></header>
        {active ? <div className="p-5"><p className="text-xs font-black text-emerald-800 dark:text-emerald-300">{active.criterion_code}</p><h3 className="mt-1 text-lg font-black">{active.criterion_snapshot?.category?.name || active.criterion_title || active.item_description}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{active.criterion_snapshot?.level?.description || active.criterion_snapshot?.category?.description || 'Verify the submitted achievement and evidence against this locked criterion.'}</p><dl className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-200 py-4 text-sm dark:border-slate-800"><div><dt className="text-xs font-bold text-slate-500">Configured points</dt><dd className="mt-1 text-lg font-black tabular-nums">{Number(active.configured_points_snapshot || 0).toFixed(2)}</dd></div><div><dt className="text-xs font-bold text-slate-500">Awarded points</dt><dd className="mt-1 text-lg font-black tabular-nums">{Number(active.awarded_points || 0).toFixed(2)}</dd></div></dl><label className="mt-4 block"><span className="text-sm font-bold">{active.verification_status==='ineligible'?'Rejection reason':'Evaluator note'}</span><textarea disabled={!editable || busyId===active.id} value={note[active.id] ?? active.rejection_reason ?? active.evaluator_remarks ?? ''} onChange={event => setNote(value => ({...value,[active.id]:event.target.value}))} rows="4" placeholder="A reason is required when rejecting." className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><div className="mt-4 grid grid-cols-2 gap-2"><button disabled={!editable||busyId===active.id||!active.configured_points_snapshot} onClick={() => approve(active)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-40"><Check className="h-4 w-4" />Approve</button><button disabled={!editable||busyId===active.id} onClick={() => reject(active)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 px-3 py-2.5 text-sm font-bold text-rose-800 disabled:opacity-40 dark:text-rose-200"><X className="h-4 w-4" />Reject</button></div>{busyId===active.id&&<p aria-live="polite" className="mt-3 flex items-center gap-2 text-xs font-semibold"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Saving decision…</p>}</div> : <p className="p-8 text-sm text-slate-500">No submitted achievements.</p>}
        <div className="border-t border-slate-200 p-5 dark:border-slate-800"><p className="text-sm font-black">Progress · {reviewed}/{items.length}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-emerald-700" style={{width:`${items.length ? reviewed/items.length*100 : 0}%`}} /></div><div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs"><div><strong>{approved}</strong><br/>Approved</div><div><strong>{rejected}</strong><br/>Rejected</div><div><strong>{remaining}</strong><br/>Remaining</div><div><strong>{total.toFixed(2)}</strong><br/>Points</div></div>{savedAt&&<p className="mt-3 text-xs text-slate-500">Saved and reloaded {savedAt}</p>}<div className="mt-4 space-y-2"><button disabled={busyId==='draft'} onClick={saveDraft} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700"><Save className="h-4 w-4" />{busyId==='draft'?'Checking saved draft…':'Save Draft'}</button>{deficiencyAllowed && <button disabled={busyId==='deficiency'} onClick={() => openDeficiency(active)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-sm font-bold text-amber-900 disabled:opacity-40 dark:text-amber-200"><MessageSquareWarning className="h-4 w-4" />Request Correction</button>}<div className="grid grid-cols-2 gap-2"><button disabled={!editable} onClick={returnPortfolio} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 px-2 py-2 text-xs font-bold disabled:opacity-40 dark:border-slate-700"><RotateCcw className="h-3.5 w-3.5" />Return</button><button disabled={!editable||remaining>0} onClick={endorse} className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-950 px-2 py-2 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-slate-950"><Send className="h-3.5 w-3.5" />Endorse to HR</button></div></div></div>
      </aside>}
    </div>{evidence&&<PersonnelEvidencePreviewModal evidence={evidence} onClose={() => setEvidence(null)} />}{deficiencyDialog}
  </div>
}
