import React from 'react'
import { FileCheck, ShieldCheck, Clock, RotateCcw, CheckCircle2 } from 'lucide-react'

export default function VerificationQueueHeader({ stats = {} }) {
  const pendingCount = stats.pending ?? 8
  const inReviewCount = stats.inReview ?? 2
  const returnedCount = stats.returned ?? 3
  const completedCount = stats.completed ?? 24

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-[#1b4332] dark:text-emerald-400" />
          <span>Verification Queue</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Review submitted faculty portfolios for ranking, promotion, and tenure evaluation.
        </p>
      </div>

      {/* Workload Task Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400">Pending Review</p>
            <p className="text-base font-black text-slate-900 dark:text-white">{pendingCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#1b4332]/10 text-[#1b4332] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400">In Review</p>
            <p className="text-base font-black text-slate-900 dark:text-white">{inReviewCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400">Returned</p>
            <p className="text-base font-black text-slate-900 dark:text-white">{returnedCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#1b4332]/10 text-[#1b4332] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400">Completed</p>
            <p className="text-base font-black text-slate-900 dark:text-white">{completedCount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
