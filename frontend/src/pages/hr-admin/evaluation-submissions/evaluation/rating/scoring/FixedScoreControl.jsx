import React from 'react'
import { Award } from 'lucide-react'

export default function FixedScoreControl({
  title = 'Fixed Qualification Score',
  points = 40,
  maxPoints = 40,
  label = 'Ph.D. / Doctorate Degree Holder'
}) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-[#176B43] dark:text-emerald-400" />
          <span>{title}</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
          Fixed Rule
        </span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Qualification: <strong className="text-slate-900 dark:text-white">{label}</strong>
      </p>
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80 dark:border-slate-800">
        <span className="text-slate-500">Points Awarded:</span>
        <strong className="text-[#176B43] dark:text-emerald-400 font-extrabold text-sm">
          {points}.00 / {maxPoints}.00 Points
        </strong>
      </div>
    </div>
  )
}
