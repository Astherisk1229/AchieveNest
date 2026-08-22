import React from 'react'
import { UserPlus } from 'lucide-react'

export default function PersonnelDirectoryHeader({ onOpenOnboarding }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <div>
        <h1 className="text-3xl font-extrabold text-[#102A43] dark:text-[#E6EFE9] tracking-tight leading-tight">
          Personnel Directory
        </h1>
        <p className="text-sm font-medium leading-relaxed text-[#4F6475] dark:text-[#B1C0B6] mt-1">
          View and manage personnel information, department assignments, employment status, academic ranks, and evaluation records.
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenOnboarding}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#159552] hover:bg-[#117A43] text-white font-semibold text-sm leading-none shadow-xs border border-[#159552] focus:ring-2 focus:ring-[#159552]/22 transition cursor-pointer shrink-0 disabled:bg-[#E6ECE8] disabled:text-[#87958C] disabled:border-[#D4DED7] disabled:cursor-not-allowed"
      >
        <UserPlus className="w-4 h-4 text-white" />
        <span>Register Personnel</span>
      </button>
    </div>
  )
}
