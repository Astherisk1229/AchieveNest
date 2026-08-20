import React from 'react'
import { Clock, CheckCircle2, RotateCcw, TrendingUp, ShieldCheck } from 'lucide-react'

export default function CoordinatorMetricsSidebar({
  pendingCount = 0,
  verifiedCount = 0,
  returnedCount = 0,
  averageReviewTime = { displayValue: '—', subtext: 'No completed review data' },
  activeStatus = 'All',
  onStatusSelect
}) {
  const isPendingActive = activeStatus === 'Pending'
  const isVerifiedActive = activeStatus === 'Verified'
  const isReturnedActive = activeStatus === 'Returned'

  return (
    <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 font-sans">
      
      {/* Sidebar Section Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#1b4332] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-black tracking-tight uppercase">Verification Summary</h2>
        </div>
        <span className="text-[10px] font-bold text-slate-400">Queue Metrics</span>
      </div>

      {/* Grid Container for Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
        
        {/* Metric 1: Pending Reviews */}
        <button
          type="button"
          aria-pressed={isPendingActive}
          onClick={() => onStatusSelect && onStatusSelect('Pending')}
          className={`p-3.5 rounded-2xl border text-left transition duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 flex flex-col justify-between ${
            isPendingActive
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 text-amber-950 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isPendingActive ? 'text-amber-100' : 'text-amber-800 dark:text-amber-300'}`}>
              Pending Reviews
            </span>
            <Clock className={`w-4 h-4 ${isPendingActive ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${isPendingActive ? 'text-white' : 'text-amber-950 dark:text-white'}`}>
              {pendingCount}
            </span>
            <span className={`text-[10px] font-bold ${isPendingActive ? 'text-amber-100' : 'text-amber-700 dark:text-amber-400'}`}>
              Click to queue →
            </span>
          </div>
        </button>

        {/* Metric 2: Verified */}
        <button
          type="button"
          aria-pressed={isVerifiedActive}
          onClick={() => onStatusSelect && onStatusSelect('Verified')}
          className={`p-3.5 rounded-2xl border text-left transition duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 flex flex-col justify-between ${
            isVerifiedActive
              ? 'bg-[#1b4332] text-white border-emerald-900 shadow-sm'
              : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 text-emerald-950 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isVerifiedActive ? 'text-emerald-200' : 'text-emerald-800 dark:text-emerald-300'}`}>
              Verified
            </span>
            <CheckCircle2 className={`w-4 h-4 ${isVerifiedActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${isVerifiedActive ? 'text-white' : 'text-emerald-950 dark:text-white'}`}>
              {verifiedCount}
            </span>
            <span className={`text-[10px] font-bold ${isVerifiedActive ? 'text-emerald-200' : 'text-emerald-700 dark:text-emerald-400'}`}>
              Click to queue →
            </span>
          </div>
        </button>

        {/* Metric 3: Returned */}
        <button
          type="button"
          aria-pressed={isReturnedActive}
          onClick={() => onStatusSelect && onStatusSelect('Returned')}
          className={`p-3.5 rounded-2xl border text-left transition duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-500/50 flex flex-col justify-between ${
            isReturnedActive
              ? 'bg-rose-700 text-white border-rose-800 shadow-sm'
              : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100/80 dark:hover:bg-rose-900/40 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isReturnedActive ? 'text-rose-100' : 'text-rose-800 dark:text-rose-300'}`}>
              Returned
            </span>
            <RotateCcw className={`w-4 h-4 ${isReturnedActive ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`} />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${isReturnedActive ? 'text-white' : 'text-rose-950 dark:text-white'}`}>
              {returnedCount}
            </span>
            <span className={`text-[10px] font-bold ${isReturnedActive ? 'text-rose-100' : 'text-rose-700 dark:text-rose-400'}`}>
              Click to queue →
            </span>
          </div>
        </button>

        {/* Metric 4: Avg Review Time (Non-Interactive Informational Card) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Avg Review Time
            </span>
            <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {averageReviewTime.displayValue || '—'}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {averageReviewTime.subtext}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
