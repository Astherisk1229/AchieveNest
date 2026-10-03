import React, { useRef, useState } from 'react'
import { AlertTriangle, CalendarDays } from 'lucide-react'
import { archiveRankingCycle, deleteRankingCycle } from '../../../services/personnelEvaluationPeriodService'
import RankingCycleDialog, { buttonStyles, errorMessage } from './RankingCycleDialog'
import { formatRange } from './rankingCyclePresentation'

function CycleSummary({ cycle }) {
  return <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
    <p className="flex items-center gap-2 font-black text-slate-950 dark:text-white"><CalendarDays aria-hidden="true" className="h-4 w-4 text-emerald-800 dark:text-emerald-300"/>{cycle.display_name}</p>
    <dl className="mt-3 grid grid-cols-[9rem_1fr] gap-y-1.5 text-sm">
      <dt className="text-slate-500">Coverage</dt><dd className="font-semibold">{cycle.coverage?.label}</dd>
      <dt className="text-slate-500">Submission Period</dt><dd className="font-semibold">{formatRange(cycle.schedule?.submission_open_at, cycle.schedule?.submission_close_at)}</dd>
      <dt className="text-slate-500">Evaluation Period</dt><dd className="font-semibold">{formatRange(cycle.schedule?.evaluation_start_at, cycle.schedule?.evaluation_end_at)}</dd>
      <dt className="text-slate-500">Status</dt><dd><span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{cycle.lifecycle_status?.label}</span></dd>
    </dl>
  </div>
}

export function ArchiveCycleDialog({ cycle, onClose, onArchived }) {
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const key = useRef(crypto.randomUUID())
  const archive = async () => {
    setSaving(true); setError('')
    try { const result = await archiveRankingCycle(cycle.id, key.current); onArchived(result?.cycle || result) }
    catch (failure) { setError(errorMessage(failure, 'The ranking period could not be archived.')); setSaving(false) }
  }
  return <RankingCycleDialog width="max-w-lg" title="Archive Ranking Period" onClose={() => !saving && onClose()} footer={<>
    <button type="button" onClick={onClose} disabled={saving} className={buttonStyles.secondary}>Cancel</button>
    <button type="button" onClick={archive} disabled={!confirmed || saving} className={buttonStyles.danger}>{saving ? 'Archiving…' : 'Archive Period'}</button>
  </>}>
    <div className="space-y-4 p-5 sm:p-6">
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
        <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"/>
        <div><p className="font-bold text-amber-900 dark:text-amber-100">Archive this ranking period?</p><p className="mt-1 leading-5 text-amber-900/90 dark:text-amber-100/90">The period moves to the archive. All annual reviews, submissions, evaluations, criteria versions, and results are preserved and remain viewable in read-only mode.</p></div>
      </div>
      <CycleSummary cycle={cycle}/>
      <label className="flex items-start gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-400 accent-emerald-700"/>I understand that this action cannot be undone.</label>
      {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
    </div>
  </RankingCycleDialog>
}

/** Deletion exists only for cycles with no personnel coverage (and so no operational records). */
export function DeleteEmptyCycleDialog({ cycle, onClose, onDeleted }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const remove = async () => {
    setSaving(true); setError('')
    try { await deleteRankingCycle(cycle.id); onDeleted(cycle) }
    catch (failure) { setError(errorMessage(failure, 'The ranking period could not be deleted.')); setSaving(false) }
  }
  return <RankingCycleDialog width="max-w-lg" title="Delete Empty Period" onClose={() => !saving && onClose()} footer={<>
    <button type="button" onClick={onClose} disabled={saving} className={buttonStyles.secondary}>Cancel</button>
    <button type="button" onClick={remove} disabled={saving} className={buttonStyles.danger}>{saving ? 'Deleting…' : 'Delete Cycle'}</button>
  </>}>
    <div className="space-y-3 p-5 text-sm leading-6 text-slate-700 sm:p-6 dark:text-slate-300">
      <p><span className="font-bold text-slate-950 dark:text-white">{cycle.display_name}</span> has no personnel coverage, schedule, or records. Deleting it removes only this empty entry.</p>
      {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
    </div>
  </RankingCycleDialog>
}
