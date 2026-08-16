import React from 'react'
import { Award, CheckCircle2, AlertCircle, Send, FileText, ShieldCheck, Sparkles, Clock, AlertTriangle } from 'lucide-react'

export default function PortfolioSummaryCard({ portfolio, totals, onSubmitToDepSec, error }) {
  if (!portfolio || !totals) return null

  const isDraft = portfolio.status === 'DRAFT' || portfolio.status === 'RETURNED_TO_PERSONNEL'
  const isSubmitted = portfolio.status === 'SUBMITTED_TO_DEP_SEC' || portfolio.status === 'UNDER_DEP_SEC_REVIEW'
  const isEndorsed = portfolio.status === 'ENDORSED_TO_HR'
  const isApproved = portfolio.status === 'HR_APPROVED'

  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> HR Approved & Locked
        </span>
      )
    }
    if (isEndorsed) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <ShieldCheck className="w-3.5 h-3.5" /> Endorsed to HR
        </span>
      )
    }
    if (isSubmitted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" /> Under Dept. Sec Review
        </span>
      )
    }
    if (portfolio.status === 'RETURNED_TO_PERSONNEL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3.5 h-3.5" /> Revision Requested
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
        <FileText className="w-3.5 h-3.5" /> Draft Portfolio
      </span>
    )
  }

  const { claimed } = totals
  const totalRaw = claimed.overflowA + claimed.acceptedA + claimed.overflowB + claimed.acceptedB + claimed.overflowC + claimed.acceptedC

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl mb-6">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {portfolio.personnel_name}
            </h2>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {portfolio.academic_rank} • {portfolio.department_name} ({portfolio.academic_year})
          </p>
        </div>

        {/* Action Button */}
        {isDraft && (
          <button
            onClick={onSubmitToDepSec}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md hover:shadow-emerald-600/20"
          >
            <Send className="w-4 h-4" /> Submit to Dept. Secretary
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Accomplishments & Portfolio Submission Status Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {/* Total Portfolio Records Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
            <span>Total Portfolio Dossier</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {(portfolio.area_a_items?.length || 0) + (portfolio.area_b_items?.length || 0) + (portfolio.area_c_items?.length || 0)}
            </span>
            <span className="text-sm text-slate-500 font-medium">Logged Entries</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{portfolio.status || 'DRAFT'}</span>
          </p>
        </div>

        {/* Area A Records Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            <span>Area A: Prof. Dev</span>
            <span className="text-xs text-emerald-600 font-bold font-mono">{portfolio.area_a_items?.length || 0} Entries</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Degrees, Memberships, Seminars
          </p>
        </div>

        {/* Area B Records Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            <span>Area B: Productivity</span>
            <span className="text-xs text-emerald-600 font-bold font-mono">{portfolio.area_b_items?.length || 0} Entries</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publications, Lectures, Research
          </p>
        </div>

        {/* Area C Records Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            <span>Area C: Service</span>
            <span className="text-xs text-emerald-600 font-bold font-mono">{portfolio.area_c_items?.length || 0} Entries</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Leadership & Community Involvement
          </p>
        </div>
      </div>
    </div>
  )
}
