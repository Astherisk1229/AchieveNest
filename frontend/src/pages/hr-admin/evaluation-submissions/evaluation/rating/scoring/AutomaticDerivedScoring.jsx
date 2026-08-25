import React from 'react'

export default function AutomaticDerivedScoring({
  tenureYears = 0,
  maxPoints = 10
}) {
  const calculatedPoints = Math.min(maxPoints, Math.floor(Math.max(0, parseInt(tenureYears || 0, 10)) / 2))

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Service Tenure Computation
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
          Rule-Based Calculation
        </span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Formula: <strong>1.0 point per 2 completed years of service</strong> at NDMU (Max: {maxPoints} pts).
      </p>
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Verified Service Length:</span>
        <strong className="text-slate-900 dark:text-white font-bold">{tenureYears} Years</strong>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Calculated Points:</span>
        <strong className="text-[#176B43] dark:text-emerald-400 font-extrabold text-sm">{calculatedPoints}.00 / {maxPoints}.00</strong>
      </div>
    </div>
  )
}
