import React from 'react'
import { UserPlus } from 'lucide-react'

export default function PersonnelDirectoryHeader({ onOpenOnboarding }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          Personnel Directory
        </h1>
        <p className="text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-400 mt-1">
          View and manage personnel information, department assignments, employment status, academic ranks, and evaluation records.
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenOnboarding}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] text-white font-semibold text-sm leading-none shadow-xs transition cursor-pointer shrink-0"
      >
        <UserPlus className="w-4 h-4" />
        <span>Register Personnel</span>
      </button>
    </div>
  )
}
