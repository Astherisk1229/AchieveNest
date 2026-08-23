import React from 'react'
import { RotateCcw, CheckCircle2 } from 'lucide-react'

export default function StudioDecisionBar({
  reviewedCount = 0,
  totalCount = 0,
  isReadyForFinalize = false,
  onOpenReturnModal,
  onOpenFinalizeModal
}) {
  return (
    <div className="px-6 py-3 bg-white dark:bg-[#131e2e] border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 font-sans shrink-0">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isReadyForFinalize ? 'text-[#176B43] dark:text-emerald-400' : 'text-amber-500'}`} />
        <span>
          <strong className="text-slate-900 dark:text-white">{reviewedCount} / {totalCount}</strong> Evidence Decisions Completed
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenReturnModal}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Return for Revision</span>
        </button>

        <button
          type="button"
          disabled={!isReadyForFinalize}
          onClick={onOpenFinalizeModal}
          className="px-5 py-2 rounded-xl bg-[#176B43] hover:bg-[#125334] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Finalize Evaluation</span>
        </button>
      </div>
    </div>
  )
}
