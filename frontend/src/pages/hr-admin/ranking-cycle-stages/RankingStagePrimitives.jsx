import React from 'react'
import { AlertCircle, RefreshCw, Search, X } from 'lucide-react'

const tones = {
  not_submitted: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  draft: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  submitted: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
  ready_for_evaluation: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
  in_progress: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  returned_for_revision: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
  completed: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  eligible: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  not_eligible: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
}

export function StageBadge({ value, label }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tones[value] || tones.pending}`}>{label || String(value || 'Pending').replaceAll('_', ' ')}</span>
}

export function PersonnelCell({ person }) {
  const initials = String(person?.full_name || 'Personnel').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  return <div className="flex min-w-0 items-center gap-3">{person?.avatar_url ? <img src={person.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"/> : <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200">{initials}</span>}<div className="min-w-0"><p className="truncate font-bold text-slate-950 dark:text-white">{person?.full_name}</p><p className="mt-0.5 truncate text-xs tabular-nums text-slate-500">{person?.institutional_id || 'ID not recorded'}</p><p className="mt-0.5 truncate text-xs text-slate-500">{person?.position_title || 'Position not recorded'}</p></div></div>
}

export function StageHeader({ title, description, phase, onRefresh }) {
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-black tracking-[-0.025em] text-slate-950 dark:text-white">{title}</h1><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p></div><button type="button" onClick={onRefresh} disabled={phase === 'loading'} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-900"><RefreshCw className={`h-4 w-4 ${phase === 'loading' ? 'animate-spin' : ''}`}/>Refresh</button></header>
}

export function StageToolbar({ search, onSearch, status, onStatus, options }) {
  return <div className={`grid gap-3 ${options.length ? 'sm:grid-cols-[minmax(0,1fr)_220px]' : 'max-w-xl'}`}><label className="relative"><span className="sr-only">Search personnel</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={search} onChange={event => onSearch(event.target.value)} placeholder="Search personnel or ID" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950"/></label>{options.length > 0 && <label><span className="sr-only">Filter by status</span><select value={status} onChange={event => onStatus(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950"><option value="all">All statuses</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}</div>
}

export function StageTable({ columns, rows, emptyTitle, emptyDescription, renderRow }) {
  return <section className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-900"><tr>{columns.map(column => <th key={column.label} scope="col" className={column.className || 'px-4 py-3'}>{column.label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{rows.map(renderRow)}{rows.length === 0 && <tr><td colSpan={columns.length} className="px-5 py-14 text-center"><p className="font-bold text-slate-800 dark:text-slate-100">{emptyTitle}</p><p className="mt-1 text-xs text-slate-500">{emptyDescription}</p></td></tr>}</tbody></table></section>
}

export function StageState({ phase, error, onRetry, children }) {
  if (phase === 'loading') return <div aria-busy="true" className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/>
  if (phase === 'error') return <div role="alert" className="flex items-start justify-between gap-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><span className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>{error}</span><button type="button" onClick={onRetry} className="shrink-0 font-bold underline underline-offset-4">Try again</button></div>
  return children
}

export function DetailDrawer({ title, subtitle, onClose, children }) {
  if (!title) return null
  return <div className="fixed inset-0 z-50 bg-slate-950/50" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><aside role="dialog" aria-modal="true" aria-label={title} className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-slate-950"><header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800"><div><h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div><button type="button" onClick={onClose} aria-label="Close details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-900"><X className="h-5 w-5"/></button></header><div className="flex-1 overflow-y-auto p-5">{children}</div></aside></div>
}

export function PrimaryButton({ children, onClick, disabled = false }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-800 px-3 text-xs font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{children}</button>
}
