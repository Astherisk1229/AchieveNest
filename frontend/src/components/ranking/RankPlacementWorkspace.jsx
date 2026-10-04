import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Download, RefreshCw } from 'lucide-react'
import {
  cancelApprovedRank, cancelPlacement, confirmPlacement, correctApprovedRank, correctPlacement, downloadSignedApprovedRank,
  loadRankPlacementView, rankActionError, requestApprovedRankRecovery, retryPlacement, retryRankActivation, suggestPlacement
} from '../../services/rankPlacementViewService'
import { CorrectApprovedRankDialog, PlacementDateDialog, ReasonDialog } from './RankActionDialogs'
import { getDeanRoster } from '../../services/deanWorkspaceService'

const rankStatuses = {
  active: ['Current Rank', 'border-emerald-200 bg-emerald-50 text-emerald-800'],
  approved_pending_effectivity: ['Pending Approved Future Rank', 'border-amber-200 bg-amber-50 text-amber-900'],
  historical: ['Historical Rank', 'border-slate-200 bg-slate-50 text-slate-700'],
  cancelled: ['Cancelled Future Rank', 'border-rose-200 bg-rose-50 text-rose-800'],
  corrected: ['Corrected Record', 'border-violet-200 bg-violet-50 text-violet-800'],
  activation_failed: ['Activation Failed', 'border-rose-300 bg-rose-50 text-rose-900']
}
const placementStatuses = {
  current: ['Current Placement', 'border-emerald-200 bg-emerald-50 text-emerald-800'],
  pending_future: ['Pending Future Placement', 'border-amber-200 bg-amber-50 text-amber-900'],
  historical: ['Historical Placement', 'border-slate-200 bg-slate-50 text-slate-700'],
  cancelled: ['Cancelled Placement', 'border-rose-200 bg-rose-50 text-rose-800'],
  corrected: ['Corrected Placement', 'border-violet-200 bg-violet-50 text-violet-800'],
  activation_failed: ['Activation Failed', 'border-rose-300 bg-rose-50 text-rose-900']
}
const rankNotificationTypes = new Set(['approved_rank_recorded','pending_future_rank_created','rank_record_corrected','pending_rank_cancelled','approved_rank_effective','present_rank_changed','approved_rank_activation_delayed'])
const display = value => String(value || 'Not recorded').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
const date = value => value ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) : '—'

function Status({ value, placement = false }) {
  const [label, style] = (placement ? placementStatuses : rankStatuses)[value] || [display(value), 'border-slate-200 bg-white text-slate-700']
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${style}`}>{label}</span>
}

function LoadingState() {
  return <main className="mx-auto max-w-7xl space-y-5 py-4" aria-busy="true" aria-label="Loading rank and placement information"><div className="h-8 w-72 animate-pulse rounded bg-slate-200"/><div className="h-24 animate-pulse rounded-xl bg-slate-100"/><div className="h-64 animate-pulse rounded-xl bg-slate-100"/></main>
}

const todayIso = () => new Date().toISOString().slice(0, 10)

// HR-only actions on one rank record. The backend enforces the same status rules; this only hides actions that cannot apply.
function RankRowActions({ row, onAction }) {
  const status = row.status
  const future = (row.effectivity_date || '') > todayIso()
  const button = 'ml-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600'
  return <>
    {['active', 'approved_pending_effectivity', 'activation_failed', 'correction_pending'].includes(status) && <button type="button" className={button} onClick={() => onAction('correct-rank', row)}>Correct</button>}
    {['approved_pending_effectivity', 'cancellation_pending'].includes(status) && future && <button type="button" className={button} onClick={() => onAction('cancel-rank', row)}>Cancel</button>}
    {status === 'activation_failed' && <>
      <button type="button" className={button} onClick={() => onAction('recover-correction', row)}>Request correction</button>
      <button type="button" className={button} onClick={() => onAction('recover-cancellation', row)}>Request cancellation</button>
    </>}
  </>
}

function HistoryTable({ rows, type, role, onDownload, onRetry, onAction }) {
  const [page, setPage] = useState(1); const pageSize = 8; const pages = Math.max(1, Math.ceil(rows.length / pageSize)); const visible = rows.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [rows.length])
  if (!rows.length) return <div className="border-y border-slate-200 px-4 py-10 text-center"><p className="font-bold text-slate-800">No {type === 'rank' ? 'rank' : 'placement'} history yet.</p><p className="mt-1 text-sm text-slate-500">Verified records will appear here when available.</p></div>
  return <>
    <div className="overflow-x-auto"><table className="w-full min-w-[760px] table-fixed text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th scope="col" className="w-[28%] px-4 py-3">{type === 'rank' ? 'Rank' : 'Placement'}</th><th scope="col" className="w-[22%] px-4 py-3">Status</th><th scope="col" className="w-[18%] px-4 py-3">Effectivity</th>{role !== 'reviewer' && <th scope="col" className="w-[20%] px-4 py-3">Details</th>}<th scope="col" className="px-4 py-3 text-right">Actions</th></tr></thead>
    <tbody className="divide-y divide-slate-200">{visible.map((row, index) => { const id = row.id || row.record_id || row.approved_rank_record_id || row.placement_id; const reason = row.correction?.reason || row.cancellation_reason || row.correction_reason || row.recovery_reason; return <tr key={id || `${type}-${index}`} className="align-top hover:bg-slate-50/70"><td className="truncate px-4 py-3 font-bold text-slate-900" title={type === 'rank' ? display(row.approved_rank_code || row.rank_code) : (row.qualification_source_label || display(row.qualification_tier_code))}>{type === 'rank' ? display(row.approved_rank_code || row.rank_code) : (row.qualification_source_label || display(row.qualification_tier_code))}</td><td className="px-4 py-3"><Status value={row.status} placement={type === 'placement'}/></td><td className="px-4 py-3 tabular-nums text-slate-700">{date(row.effectivity_date || row.effective_from)}</td>{role !== 'reviewer' && <td className="px-4 py-3"><span className="block max-w-xs truncate text-slate-600" title={reason || ''}>{reason || (row.activation_failure_reason ? 'Administrative intervention required' : '—')}</span></td>}<td className="px-4 py-3 text-right">{type === 'rank' && role !== 'reviewer' && id && <button type="button" onClick={() => onDownload(id)} aria-label={`Download signed document for ${display(row.approved_rank_code || row.rank_code)}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><Download className="h-3.5 w-3.5"/>Signed document</button>}{type === 'rank' && role === 'hr' && row.status === 'activation_failed' && <button type="button" onClick={() => onRetry(id)} aria-label="Retry rank activation" className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><RefreshCw className="h-3.5 w-3.5"/>Retry</button>}{type === 'rank' && role === 'hr' && id && onAction && <RankRowActions row={{ ...row, id }} onAction={onAction}/>}</td></tr>})}</tbody></table></div>
    {pages > 1 && <nav aria-label={`${type} history pagination`} className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm"><p className="text-slate-500">Page {page} of {pages}</p><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Previous</button><button type="button" disabled={page === pages} onClick={() => setPage(value => value + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Next</button></div></nav>}
  </>
}


// Where a reviewer or HR came from, so the page names whose record this is and links back.
const SUBJECT_ORIGINS = [
  { prefix: '/dean/personnel/', backTo: '/dean/college-personnel', backLabel: 'College Personnel Roster' },
  { prefix: '/hr/personnel/', backTo: '/hr/personnel-directory', backLabel: 'Personnel Directory' },
  { prefix: '/department/personnel/', backTo: null, backLabel: null }
]

function useRecordSubject(role, personnelId) {
  const location = useLocation()
  const fromState = location.state?.person
  const [person, setPerson] = useState(fromState && fromState.id === personnelId ? fromState : null)
  const origin = SUBJECT_ORIGINS.find(item => location.pathname.startsWith(item.prefix)) || null
  useEffect(() => {
    if (role === 'personnel' || person || !personnelId || !location.pathname.startsWith('/dean/')) return undefined
    let active = true
    // Opened directly (reload or shared link): look the name up in the Dean's own roster.
    getDeanRoster().then(data => {
      const match = (data?.personnel || []).find(item => item.id === personnelId)
      if (active && match) setPerson({ id: match.id, full_name: match.full_name, institutional_id: match.institutional_id })
    }).catch(() => {})
    return () => { active = false }
  }, [role, personnelId, person, location.pathname])
  return { person, origin }
}

export default function RankPlacementWorkspace({ role, personnelId }) {
  const { person: subject, origin } = useRecordSubject(role, personnelId)
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')
  const [suggestion, setSuggestion] = useState(null)
  const [state, setState] = useState({ phase: 'loading', ranks: [], rankCompatibility: {}, placements: [], notifications: [], error: '' })
  const load = () => { setState(current => ({ ...current, phase: 'loading', error: '' })); loadRankPlacementView(role, personnelId).then(data => setState({ phase: 'ready', ...data, error: '' })).catch(error => setState({ phase: 'error', ranks: [], placements: [], notifications: [], error: error?.error?.message || error?.message || 'Rank and placement information could not be loaded.' })) }
  useEffect(load, [role, personnelId])
  const currentRank = useMemo(() => state.ranks.find(row => row.status === 'active' || row.status === 'current'), [state.ranks]); const pendingRank = useMemo(() => state.ranks.find(row => row.status === 'approved_pending_effectivity'), [state.ranks]); const currentPlacement = useMemo(() => state.placements.find(row => row.status === 'current'), [state.placements]); const pendingPlacement = useMemo(() => state.placements.find(row => row.status === 'pending_future'), [state.placements]); const presentRank = currentRank?.approved_rank_code || currentRank?.rank_code || state.rankCompatibility.current_present_rank
  if (state.phase === 'loading') return <LoadingState/>
  if (state.phase === 'error') return <main className="mx-auto max-w-3xl py-10"><div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900"><AlertCircle className="h-5 w-5"/><h1 className="mt-2 font-black">Rank and placement information unavailable</h1><p className="mt-1 text-sm">{state.error}</p><button type="button" onClick={load} className="mt-4 rounded-lg bg-rose-900 px-3 py-2 text-sm font-bold text-white focus-visible:ring-2 focus-visible:ring-rose-700">Try again</button></div></main>
  const download = async id => { try { await downloadSignedApprovedRank(id) } catch { setState(current => ({ ...current, error: 'The signed approved ranking document could not be downloaded.' })) } }; const retry = async id => { try { await retryRankActivation(id); load() } catch (error) { setState(current => ({ ...current, error: rankActionError(error, 'The activation could not be retried.') })) } }
  const finish = message => { setDialog(null); setNotice(message); load() }
  const onRankAction = (kind, row) => setDialog({ kind, row })
  const suggest = async () => { try { setNotice(''); setSuggestion(await suggestPlacement(personnelId)) } catch (error) { setState(current => ({ ...current, error: rankActionError(error, 'A placement could not be suggested.') })) } }
  const retryPlacementRow = async row => { try { await retryPlacement(row.id); finish('Placement activation retried.') } catch (error) { setState(current => ({ ...current, error: rankActionError(error, 'The placement could not be activated.') })) } }
  const notices = state.notifications.filter(item => rankNotificationTypes.has(item.type)).slice(0, 6)
  return <main className="mx-auto max-w-7xl space-y-8 py-4"><header>{role !== 'personnel' && origin?.backTo && <Link to={origin.backTo} className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><ArrowLeft className="h-4 w-4" />{origin.backLabel}</Link>}<h1 className="text-2xl font-black tracking-tight text-slate-950">{role === 'personnel' ? 'Rank and Placement' : `Rank and Placement${subject?.full_name ? ` — ${subject.full_name}` : ''}`}</h1><p className="mt-1 max-w-2xl text-sm text-slate-600">{role === 'personnel' ? 'Your current, pending, and historical ranking records.' : subject?.institutional_id ? `${subject.institutional_id} · Current, pending, and historical ranking records.` : 'Current, pending, and historical ranking records for this personnel.'}</p></header>
    {state.error && <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">{state.error}</p>}
    <section aria-labelledby="current-rank-heading" className="border-y border-slate-200 py-5"><h2 id="current-rank-heading" className="text-base font-black text-slate-950">Current status</h2><dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Rank</dt><dd className="mt-1 font-black text-slate-900">{display(presentRank)}</dd>{!state.rankCompatibility.history_initialized && presentRank && <p className="mt-0.5 text-xs text-slate-500">Legacy Present Rank · history not initialized</p>}</div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Pending Approved Future Rank</dt><dd className="mt-1 font-black text-slate-900">{display(pendingRank?.approved_rank_code || pendingRank?.rank_code)}</dd><p className="mt-0.5 text-xs text-slate-500">Effectivity {date(pendingRank?.effectivity_date)}</p></div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Placement</dt><dd className="mt-1 font-black text-slate-900">{currentPlacement?.qualification_source_label || display(currentPlacement?.qualification_tier_code || 'Unknown / not initialized')}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Pending Placement</dt><dd className="mt-1 font-black text-slate-900">{pendingPlacement?.qualification_source_label || display(pendingPlacement?.qualification_tier_code)}</dd><p className="mt-0.5 text-xs text-slate-500">Effectivity {date(pendingPlacement?.effective_from)}</p></div></dl></section>
    {notice && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</p>}
    {role === 'hr' && <section aria-labelledby="placement-actions-heading" className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="placement-actions-heading" className="font-black text-slate-950">Rank placement</h2><p className="mt-1 text-sm text-slate-500">Suggest a placement from verified credentials, then confirm it with an effective date.</p></div><button type="button" onClick={suggest} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-black text-white">Suggest placement</button></div>
      {suggestion && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"><p className="font-bold text-slate-900">Suggestion: {display(suggestion.status)}</p><p className="mt-1 text-slate-600">{suggestion.explanation}</p>{suggestion.status === 'suggested' && <button type="button" onClick={() => setDialog({ kind: 'confirm-placement', row: suggestion })} className="mt-3 rounded-lg border border-emerald-700 px-3 py-1.5 text-xs font-black text-emerald-800">Confirm placement</button>}</div>}
      {state.placements.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th scope="col" className="py-2 pr-3">Placement</th><th scope="col" className="py-2 pr-3">Status</th><th scope="col" className="py-2 pr-3">Effectivity</th><th scope="col" className="py-2 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-200">{state.placements.map(row => <tr key={row.id}><td className="py-2 pr-3 font-bold text-slate-900">{row.qualification_source_label || display(row.qualification_tier_code)}</td><td className="py-2 pr-3"><Status value={row.status} placement/></td><td className="py-2 pr-3 tabular-nums">{date(row.effective_from)}</td><td className="py-2 text-right">{['pending_future', 'activation_failed'].includes(row.status) && <><button type="button" onClick={() => setDialog({ kind: 'correct-placement', row })} className="ml-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold">Correct</button><button type="button" onClick={() => setDialog({ kind: 'cancel-placement', row })} className="ml-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold">Cancel</button></>}{row.status === 'activation_failed' && <button type="button" onClick={() => retryPlacementRow(row)} className="ml-2 rounded-lg bg-emerald-800 px-2.5 py-1.5 text-xs font-bold text-white">Retry</button>}</td></tr>)}</tbody></table></div>}
    </section>}
    <section aria-labelledby="rank-history-heading" className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="px-4 py-4"><h2 id="rank-history-heading" className="font-black text-slate-950">Rank History</h2><p className="mt-1 text-sm text-slate-500">{role === 'reviewer' ? 'Rank, status, and effectivity only.' : 'Approved rank records and authorized details.'}</p></div><HistoryTable rows={state.ranks} type="rank" role={role} onDownload={download} onRetry={retry} onAction={onRankAction}/></section>
    {role === 'personnel' && <section aria-labelledby="rank-notifications-heading"><h2 id="rank-notifications-heading" className="font-black text-slate-950">Recent Rank Notifications</h2>{notices.length ? <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">{notices.map(item => <li key={item.id} className="py-3"><p className="font-bold text-slate-900">{item.title}</p><p className="mt-0.5 text-sm text-slate-600">{item.message}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No rank-status notifications yet.</p>}</section>}
    {dialog?.kind === 'cancel-rank' && <ReasonDialog title="Cancel pending approved rank" description="Only a future-dated pending rank can be cancelled. The personnel is notified with this reason." label="Reason for cancelling" confirmLabel="Cancel approved rank" onClose={() => setDialog(null)} onSubmit={async reason => { await cancelApprovedRank(dialog.row.id, reason); finish('The pending approved rank was cancelled.') }}/>}
    {dialog?.kind === 'recover-correction' && <ReasonDialog title="Request correction" description="Moves the failed activation into the correction path." label="Reason" confirmLabel="Request correction" onClose={() => setDialog(null)} onSubmit={async reason => { await requestApprovedRankRecovery(dialog.row.id, 'correction', reason); finish('Correction requested for the failed activation.') }}/>}
    {dialog?.kind === 'recover-cancellation' && <ReasonDialog title="Request cancellation" description="Moves the failed activation into the cancellation path." label="Reason" confirmLabel="Request cancellation" onClose={() => setDialog(null)} onSubmit={async reason => { await requestApprovedRankRecovery(dialog.row.id, 'cancellation', reason); finish('Cancellation requested for the failed activation.') }}/>}
    {dialog?.kind === 'correct-rank' && <CorrectApprovedRankDialog record={dialog.row} onClose={() => setDialog(null)} onSubmit={async values => { await correctApprovedRank(dialog.row.id, values); finish('The approved rank was corrected. The original record is kept in history.') }}/>}
    {dialog?.kind === 'confirm-placement' && <PlacementDateDialog title="Confirm placement" description="The placement becomes current on this date, or stays pending if the date is in the future." confirmLabel="Confirm placement" onClose={() => setDialog(null)} onSubmit={async ({ effectiveDate }) => { await confirmPlacement(dialog.row.id, effectiveDate); setSuggestion(null); finish('Placement confirmed.') }}/>}
    {dialog?.kind === 'correct-placement' && <PlacementDateDialog title="Correct placement" description="A corrected pending placement replaces this one." confirmLabel="Save correction" withReason initialDate={dialog.row.effective_from} onClose={() => setDialog(null)} onSubmit={async ({ effectiveDate, reason }) => { await correctPlacement(dialog.row.id, reason, effectiveDate); finish('Placement corrected.') }}/>}
    {dialog?.kind === 'cancel-placement' && <ReasonDialog title="Cancel placement" label="Reason for cancelling" confirmLabel="Cancel placement" onClose={() => setDialog(null)} onSubmit={async reason => { await cancelPlacement(dialog.row.id, reason); finish('Placement cancelled.') }}/>}
  </main>
}
