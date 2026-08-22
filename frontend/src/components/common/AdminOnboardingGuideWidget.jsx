import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Check, Lock, ExternalLink } from 'lucide-react'
import useAdminSetupGuide from '../../hooks/useAdminSetupGuide'
import { SETUP_STEP_STATUS } from '../../models/AdminSetupStatusModel'

export default function AdminOnboardingGuideWidget({ currentUser, activeRoleContext }) {
  const {
    guide,
    roleContext,
    isExpanded,
    isDismissed,
    toggleExpanded,
    toggleDismissed
  } = useAdminSetupGuide(currentUser, activeRoleContext)

  // Hide widget if no guide is applicable (e.g. regular Personnel)
  if (!guide) return null

  if (isDismissed) {
    return (
      <div className="text-center py-1">
        <button
          type="button"
          onClick={toggleDismissed}
          className="text-[10px] font-extrabold text-slate-400 hover:text-[#064e2b] dark:hover:text-emerald-400 transition cursor-pointer"
        >
          + Show Setup Guide
        </button>
      </div>
    )
  }

  const { metrics, steps } = guide
  const { completedCount, totalApplicable, progressPercent } = metrics

  // Title matching Codex reference
  const guideTitle = 'Getting started'

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131e2e] shadow-md shadow-slate-200/50 dark:shadow-none font-sans text-xs select-none transition-all duration-200 p-4">
      
      {/* Header Button */}
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-inset cursor-pointer group"
        aria-expanded={isExpanded}
        aria-controls="admin-setup-guide-checklist"
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-extrabold text-slate-900 dark:text-white truncate text-sm leading-snug">
            {guideTitle}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-sans text-xs font-normal text-slate-400 dark:text-slate-400">
              {completedCount} of {totalApplicable}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Linear Progress Bar Track (Matching Codex Image) */}
        <div
          className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`Setup progress: ${completedCount} of ${totalApplicable} complete`}
        >
          <div
            className="h-full rounded-full bg-slate-900 dark:bg-emerald-400 transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </button>

      {/* Inline Expanded Checklist Drawer (Matching Codex Reference Image 2) */}
      {isExpanded && (
        <div
          id="admin-setup-guide-checklist"
          className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 max-h-[min(360px,45vh)] overflow-y-auto space-y-3 animate-in fade-in duration-150 pr-0.5"
        >
          {/* Step Rows */}
          <div className="space-y-3">
            {steps.map(step => {
              const isComplete = step.status === SETUP_STEP_STATUS.COMPLETE
              const isBlocked = step.status === SETUP_STEP_STATUS.BLOCKED

              return (
                <div key={step.id} className="flex items-start justify-between gap-2.5 group">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1 pt-0.5">
                    {/* Circle Check Status Indicator (Matching Codex) */}
                    {isComplete ? (
                      <div className="w-4 h-4 rounded-full bg-slate-900 dark:bg-emerald-400 text-white dark:text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : isBlocked ? (
                      <div className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Lock className="w-2.5 h-2.5" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0 mt-0.5 group-hover:border-slate-500 transition" />
                    )}

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className={`block text-xs leading-snug transition ${
                        isComplete
                          ? 'line-through text-slate-400 dark:text-slate-500 font-normal'
                          : 'text-slate-800 dark:text-slate-200 font-medium'
                      }`}>
                        {step.title}
                      </span>
                      {isBlocked && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium leading-tight">
                          {step.blockingReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Link / Destination Badge */}
                  {!isBlocked ? (
                    <Link
                      to={step.destination}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0 transition cursor-pointer"
                      title={step.actionLabel || 'Navigate'}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-500 shrink-0">
                      Blocked
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
            <span className="text-slate-400">{guide.description}</span>
            <button
              type="button"
              onClick={toggleDismissed}
              className="font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
