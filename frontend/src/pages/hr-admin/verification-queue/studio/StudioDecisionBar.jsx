import React from 'react'
import { RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function StudioDecisionBar({
  reviewedCount = 16,
  totalCount = 18,
  onOpenReturnModal,
  onOpenFinalizeModal
}) {
  const isComplete = reviewedCount >= totalCount

  return (
    <div className="px-6 py-3 bg-white dark:bg-[#131e2e] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-sans shrink-0">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
        <CheckCircle2 className={`w-4 h-4 ${isComplete ? 'text-[#1b4332] dark:text-emerald-400' : 'text-amber-500'}`} />
        <span>
          <strong className="text-slate-900 dark:text-white">{reviewedCount} / {totalCount}</strong> Evidence Items Reviewed
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenReturnModal}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Return for Revision</span>
        </button>

        <button
          type="button"
          onClick={onOpenFinalizeModal}
          className="px-5 py-2 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Finalize Verification</span>
        </button>
      </div>
    </div>
  )
}
