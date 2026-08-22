import React from 'react'

export default function EvaluationScoreStrip({ scores = {} }) {
  const areaA = scores.areaA?.total || 0
  const areaBAwarded = scores.areaB?.awardedTotal || 0
  const areaBRaw = scores.areaB?.rawTotal || 0
  const areaC = scores.areaC?.total || 0
  const grandTotal = scores.grandTotalAwarded || 0

  return (
    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between font-sans shrink-0">
      <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
        <span className="font-black text-slate-400 uppercase tracking-wider text-[10px]">Score Strip:</span>

        <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          A: <strong className="text-slate-900 dark:text-white">{areaA}</strong>/70
        </span>

        <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
          B: <strong className="text-slate-900 dark:text-white">{areaBAwarded}</strong>/50
          {areaBRaw > areaBAwarded && (
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold ml-0.5">
              (Raw: {areaBRaw} · Capped)
            </span>
          )}
        </span>

        <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          C: <strong className="text-slate-900 dark:text-white">{areaC}</strong>/40
        </span>
      </div>

      <div className="px-3 py-1 rounded-xl bg-[#176B43] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs">
        <span className="text-[10px] text-[#245F42] uppercase tracking-wider">TOTAL</span>
        <span className="text-xs font-black">{grandTotal} / 160 pts Max</span>
      </div>
    </div>
  )
}
