import React from 'react'

export default function AutomaticDerivedControl({
  tenureYears = 0,
  maxPoints = 10
}) {
  const serviceYears = Math.max(0, parseInt(tenureYears || 0, 10))
  const calculatedPoints = Math.min(maxPoints, Math.floor(serviceYears / 2))

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          C.3 Service Length Computation
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
          Explicit Formula
        </span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Explicit Rating Sheet Rule: <strong>1.0 point for every 2 completed years</strong> of service at NDMU (Max: {maxPoints}.00 pts).
      </p>
      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500">Verified Service Length:</span>
        <strong className="text-slate-900 dark:text-white font-bold">{serviceYears} Completed Years</strong>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Calculated Points:</span>
        <strong className="text-[#176B43] dark:text-emerald-400 font-extrabold text-sm">
          {calculatedPoints}.00 / {maxPoints}.00 Points
        </strong>
      </div>
    </div>
  )
}
