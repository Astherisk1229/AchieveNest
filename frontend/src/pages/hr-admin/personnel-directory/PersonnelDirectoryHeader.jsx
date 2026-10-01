import React from 'react'
import { UserPlus, FileSpreadsheet, Users, GraduationCap, Briefcase } from 'lucide-react'

// Directory-wide headcount from the server summary (not the current page of rows).
function DirectoryStat({ icon: Icon, label, value, loading, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none tabular-nums text-slate-950 dark:text-white">{loading ? <span className="inline-block h-6 w-10 animate-pulse rounded bg-slate-200 align-middle dark:bg-slate-700" aria-label="Loading" /> : (value ?? '—')}</p>
        <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

export default function PersonnelDirectoryHeader({ onOpenOnboarding, onOpenBatchImport, summary = null, summaryLoading = false }) {
  const unclassified = summary?.total_unclassified || 0
  return (
    <div className="space-y-5 pb-2">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-slate-50 tracking-tight leading-tight">
          Personnel Directory
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mt-1">
          Find personnel, review assignments, and manage access from one place.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenBatchImport}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm leading-none border border-slate-200 dark:border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#159552]" />
          <span>Import XLSX</span>
        </button>

        <button
          type="button"
          onClick={onOpenOnboarding}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm leading-none border border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4 text-white" />
          <span>Register Personnel</span>
        </button>
      </div>
    </div>

    <section aria-label="Personnel totals" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <DirectoryStat icon={Users} label="Total Personnel" value={summary?.total_personnel} loading={summaryLoading && !summary} tone="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" />
      <DirectoryStat icon={GraduationCap} label="Faculty" value={summary?.total_faculty} loading={summaryLoading && !summary} tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" />
      <DirectoryStat icon={Briefcase} label="Non-Teaching Faculty" value={summary?.total_non_teaching} loading={summaryLoading && !summary} tone="bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300" />
    </section>
    {unclassified > 0 && <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{unclassified} personnel record{unclassified === 1 ? ' has' : 's have'} no Faculty / Non-Teaching classification yet, so {unclassified === 1 ? 'it is' : 'they are'} counted only in Total Personnel.</p>}
    </div>
  )
}
