import React from 'react'
import { STAGES } from './rankingCyclePresentation'

const lifecycleTone = {
  UPCOMING: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900',
  ONGOING: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900',
  COMPLETED: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  ARCHIVED: 'bg-white text-slate-500 ring-slate-300 dark:bg-slate-950 dark:text-slate-400 dark:ring-slate-700',
  CANCELLED: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900',
  INCOMPLETE: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900',
}

export function LifecycleBadge({ status, wrap = false }) {
  if (!status) return null
  return <span className={`inline-flex ${wrap ? 'text-center leading-4' : 'whitespace-nowrap'} rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${lifecycleTone[status.key] || lifecycleTone.COMPLETED}`}>{status.label}</span>
}

export function CoverageBadges({ coverage }) {
  const groups = coverage?.groups || []
  if (!groups.length) return <span className="text-sm text-slate-500">Not set</span>
  return <div className="flex flex-wrap gap-1.5">{groups.map(group => <span key={group} className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${group === 'FACULTY' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900' : 'bg-indigo-50 text-indigo-800 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-900'}`}>{group === 'FACULTY' ? 'Teaching Faculty' : 'Non-Teaching Faculty'}</span>)}</div>
}

/** Four-step indicator for Annual Reviews → Submissions → Evaluation → Results. */
export function StageSteps({ stage }) {
  if (!stage) return <span className="text-sm text-slate-500">Not started</span>
  return <div className="min-w-0">
    <p className="text-sm font-bold text-slate-900 dark:text-white">{stage.label}</p>
    <div className="mt-1.5 flex gap-1" aria-hidden="true">{STAGES.map((item, index) => <span key={item.key} className={`h-1.5 flex-1 rounded-full ${index < stage.index ? 'bg-emerald-700 dark:bg-emerald-500' : index === stage.index ? 'bg-emerald-400 dark:bg-emerald-700' : 'bg-slate-200 dark:bg-slate-800'}`}/>)}</div>
    <p className="mt-1 text-xs text-slate-500">Stage {stage.index + 1} of {STAGES.length}</p>
  </div>
}
