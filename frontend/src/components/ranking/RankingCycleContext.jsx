import React from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { ChevronRight, Eye, FileText, Lock, Settings2 } from 'lucide-react'
import { GROUP_LABELS, TRACK_KEYS, criteriaLabel } from '../../pages/hr-admin/ranking-cycles/rankingCyclePresentation'
import { LifecycleBadge } from '../../pages/hr-admin/ranking-cycles/RankingCycleBadges'

const stages = [['annual-reviews','Annual Reviews'],['submissions','Submissions'],['evaluation','Evaluation'],['results','Results']]
const legacyStages = { overview: 'annual-reviews', evaluations: 'evaluation' }

/**
 * Personnel Ranking workspace header: cycle identity, Faculty | Non-Teaching Faculty context (only when
 * the period covers both), the locked criteria reference, Period Settings, and the four workflow stages.
 */
export default function RankingCycleContext({ cycle, track, trackKey, onViewCriteria, onOpenSettings }) {
  const { stage = 'annual-reviews' } = useParams()
  const base = `/hr/ranking-cycles/${encodeURIComponent(cycle.id)}`
  const currentStage = legacyStages[stage] || (stages.some(([key]) => key === stage) ? stage : 'annual-reviews')
  const tracks = cycle.tracks || []
  const showSwitch = tracks.length > 1
  return <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 px-4 pt-4 text-sm text-slate-500 sm:px-6"><Link className="hover:text-emerald-800" to="/hr/ranking-cycles">Ranking Periods</Link><ChevronRight aria-hidden="true" className="h-4 w-4"/><span className="font-semibold text-slate-800 dark:text-slate-200">{cycle.display_name}</span>{track && <><ChevronRight aria-hidden="true" className="h-4 w-4"/><span>{GROUP_LABELS[track.personnel_group]}</span></>}</nav>
    <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-[-0.025em] text-slate-950 dark:text-white">Personnel Ranking</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-800 dark:text-slate-100">{cycle.display_name}</span><LifecycleBadge status={cycle.lifecycle_status}/>{cycle.current_stage && <span>Current stage: {cycle.current_stage.label}</span>}</p>
        {track && <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-300"><FileText aria-hidden="true" className="h-4 w-4 text-slate-400"/><span>Criteria: <span className="font-semibold text-slate-800 dark:text-slate-100">{criteriaLabel(track.criteria)}</span></span>{track.criteria && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900"><Lock aria-hidden="true" className="h-3 w-3"/>Locked</span>}{track.criteria && onViewCriteria && <button type="button" onClick={() => onViewCriteria(track.criteria.version_id)} className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300"><Eye aria-hidden="true" className="h-3.5 w-3.5"/>View Criteria</button>}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showSwitch && <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1 dark:bg-slate-900" role="group" aria-label="Personnel type">{tracks.map(item => { const key = TRACK_KEYS[item.personnel_group]; return <NavLink key={item.id} to={`${base}/${key}/${currentStage}`} aria-current={trackKey === key ? 'page' : undefined} className={`rounded-lg px-3.5 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${trackKey === key ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}>{GROUP_LABELS[item.personnel_group]}</NavLink> })}</div>}
        {onOpenSettings && <button type="button" onClick={onOpenSettings} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"><Settings2 aria-hidden="true" className="h-4 w-4"/>Period Settings</button>}
      </div>
    </div>
    {cycle.is_read_only && <p className="mx-4 mb-4 flex items-start gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-sm text-slate-700 sm:mx-6 dark:bg-slate-900 dark:text-slate-300"><Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0"/>{cycle.is_archived ? 'This period is archived. Everything stays viewable; submissions, evaluations, and results cannot change.' : 'This period is completed. It is read-only for submissions and evaluations.'}</p>}
    {track && <nav aria-label="Ranking period stages" className="flex overflow-x-auto px-4 sm:px-6">{stages.map(([key,label])=><NavLink key={key} to={`${base}/${trackKey}/${key}`} className={({isActive})=>`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold ${isActive?'border-emerald-700 text-emerald-800 dark:text-emerald-300':'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{label}</NavLink>)}</nav>}
  </div>
}
