import React, { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import portfolioService from '../../../services/portfolioConfigurationService'
import CriteriaSheetRenderer from '../ranking-criteria/CriteriaSheetRenderer'
import RankingCycleDialog, { LockedBadge, buttonStyles, errorMessage } from './RankingCycleDialog'
import { formatDate } from './rankingCyclePresentation'

/**
 * Read-only preview of the exact criteria version bound (or about to be bound) to a cycle track.
 * It always loads by version id, so completed and archived cycles render the version they used.
 */
export default function CriteriaPreviewDialog({ versionId, onClose }) {
  const [state, setState] = useState({ phase: 'loading', tree: null, error: '' })
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    let active = true
    setState({ phase: 'loading', tree: null, error: '' })
    portfolioService.fetchEvaluationScaleVersion(versionId)
      .then(payload => { if (active) setState({ phase: 'ready', tree: payload?.data || payload, error: '' }) })
      .catch(failure => { if (active) setState({ phase: 'error', tree: null, error: errorMessage(failure, 'The criteria could not be loaded.') }) })
    return () => { active = false }
  }, [versionId])

  const tree = state.tree
  const sheet = tree?.sheet
  const version = tree?.version
  const title = sheet ? `${sheet.name} v${version?.version_number}` : 'Criteria'

  return <RankingCycleDialog layer="z-[60]" width="max-w-4xl" title="View Criteria" description={state.phase === 'ready' ? title : 'Read-only criteria preview'} onClose={onClose} footer={<button type="button" onClick={onClose} className={buttonStyles.secondary}>Close</button>}>
    <div className="border-b border-slate-200 px-5 sm:px-6 dark:border-slate-800" role="tablist" aria-label="Criteria preview sections">
      {[['overview', 'Overview'], ['breakdown', 'Criteria Breakdown']].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${tab === key ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{label}</button>)}
    </div>
    <div className="px-5 py-5 sm:px-6">
      {state.phase === 'loading' && <div role="status" className="space-y-3"><span className="sr-only">Loading criteria…</span><div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/><div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/></div>}
      {state.phase === 'error' && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{state.error}</p>}
      {state.phase === 'ready' && tab === 'overview' && <div className="space-y-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300"><FileText className="h-5 w-5"/></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950 dark:text-white">{title}</h3><LockedBadge/></div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Effective {version?.effective_start_date ? formatDate(version.effective_start_date) : 'date not recorded'} · Total points {Number(sheet?.overall_max_points ?? version?.total_max_points ?? 0)} · Passing {Number(sheet?.passing_score ?? version?.passing_score ?? 0)}</p>
          </div>
        </div>
        {sheet?.description && <section><h4 className="text-sm font-black text-slate-900 dark:text-white">Description</h4><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{sheet.description}</p></section>}
        <section>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">Criteria Categories</h4>
          <ol className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {(tree.areas || []).map((area, index) => <li key={area.id} className="flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm"><span className="text-slate-800 dark:text-slate-100"><span className="mr-2 tabular-nums text-slate-500">{index + 1}.</span>{area.name}</span><span className="shrink-0 font-bold tabular-nums text-slate-900 dark:text-white">{Number(area.max_points)} points</span></li>)}
          </ol>
          <p className="mt-3 text-xs leading-5 text-slate-500">This version is locked to the cycle. Publishing a newer criteria version later does not change cycles that already use this one.</p>
        </section>
      </div>}
      {state.phase === 'ready' && tab === 'breakdown' && <CriteriaSheetRenderer tree={tree}/>}
    </div>
  </RankingCycleDialog>
}
