import React from 'react'
import { UserPlus } from 'lucide-react'

export default function PersonnelGovernanceHeader({ onOpenOnboarding }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Personnel Governance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Manage faculty records, organizational assignments, and personnel account access.
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenOnboarding}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition cursor-pointer shrink-0"
      >
        <UserPlus className="w-4 h-4" />
        <span>Onboard Personnel</span>
      </button>
    </div>
  )
}
