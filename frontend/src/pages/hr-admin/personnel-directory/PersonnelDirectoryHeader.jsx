import React from 'react'
import { UserPlus, FileSpreadsheet } from 'lucide-react'

export default function PersonnelDirectoryHeader({ onOpenOnboarding, onOpenBatchImport }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
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
  )
}
