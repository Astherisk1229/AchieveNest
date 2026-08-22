import React from 'react'
import { CheckCircle2, AlertCircle, Clock, XCircle, ShieldCheck } from 'lucide-react'

export function CandidateStatusBadge({ status, type = 'eligibility' }) {
  if (type === 'eligibility') {
    switch (status) {
      case 'qualified':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-black flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#16834a]" />
            <span>Qualified</span>
          </span>
        )
      case 'below_threshold':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-extrabold flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <span>Below Threshold</span>
          </span>
        )
      case 'needs_review':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[10px] font-extrabold flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>Needs Review</span>
          </span>
        )
      case 'disqualified':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[10px] font-extrabold flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>Disqualified</span>
          </span>
        )
      default:
        return null
    }
  }

  if (type === 'confirmation') {
    switch (status) {
      case 'confirmed':
      case true:
        return (
          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#064e2b] dark:text-emerald-300 text-xs font-black flex items-center gap-1 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16834a]" />
            <span>Confirmed</span>
          </span>
        )
      case 'revoked':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 text-xs font-extrabold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Revoked</span>
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            Unconfirmed
          </span>
        )
    }
  }

  return null
}

export default CandidateStatusBadge
