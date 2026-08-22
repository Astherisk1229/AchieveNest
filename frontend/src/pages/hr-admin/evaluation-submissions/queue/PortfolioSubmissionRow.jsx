import React from 'react'
import { FileCheck, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function PortfolioSubmissionRow({ submission, onInspect }) {
  const getCollegeAcronym = (collegeStr) => {
    if (!collegeStr) return 'NDMU'
    if (collegeStr.startsWith('CEAC')) return 'CEAC'
    if (collegeStr.startsWith('CBA')) return 'CBA'
    if (collegeStr.startsWith('CAS')) return 'CAS'
    return collegeStr.split(' ')[0]
  }

  const isReady = (submission.completedItemsCount || 16) >= (submission.totalItemsCount || 18)

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Faculty Identity & Details */}
      <div className="flex items-center gap-3.5">
        <img
          src={submission.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt={submission.faculty_name}
          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
        />
        <div className="space-y-1.5 leading-normal">
          <div className="flex items-center gap-2 flex-wrap leading-tight">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {submission.faculty_name}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-[#dde8d8] text-[#346538] dark:bg-emerald-950/60 dark:text-[#245F42] border border-[#D4E3D2] dark:border-emerald-800/60 font-bold text-xs uppercase">
              {getCollegeAcronym(submission.college)}
            </span>
            <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
              · {submission.department}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 font-normal leading-normal">
            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-200 mr-2">{submission.employee_id}</span>
            <span>{submission.email}</span>
          </p>

          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 leading-normal">
            <span className="text-[#064e2b] dark:text-emerald-400 font-semibold">{submission.submissionType || 'Ranking Portfolio'}</span> · {submission.totalItemsCount || 18} Evidence Items · Submitted {submission.submittedDate || 'Aug 14, 2026'}
          </p>
        </div>
      </div>

      {/* Readiness & Action Button */}
      <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
        {/* Readiness Badge */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[11px] font-extrabold">
            {isReady ? (
              <span className="text-[#064e2b] dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Review
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {(submission.totalItemsCount || 18) - (submission.completedItemsCount || 16)} Items Pending
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {submission.completedItemsCount || 16} of {submission.totalItemsCount || 18} items complete
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onInspect(submission)}
          className="px-4 py-2.5 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
        >
          <span>
            {submission.status === 'in_review' || submission.status === 'UNDER_HR_REVIEW'
              ? 'Continue Review'
              : submission.status === 'ready_finalization' || submission.status === 'READY_FOR_FINALIZATION'
              ? 'Finalize Evaluation'
              : submission.status === 'returned' || submission.status === 'RETURNED_FOR_REVISION'
              ? 'View Returned Submission'
              : submission.status === 'completed' || submission.status === 'COMPLETED'
              ? 'View Evaluation'
              : 'Start Review'}
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
