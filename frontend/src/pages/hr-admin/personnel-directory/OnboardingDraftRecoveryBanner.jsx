import React from 'react'
import { Info, RotateCcw, Trash2 } from 'lucide-react'

/**
 * OnboardingDraftRecoveryBanner Component
 * Displays a clean, accessible alert banner at the top of OnboardPersonnelModal
 * when an unfinished onboarding form draft is detected.
 */
export default function OnboardingDraftRecoveryBanner({
  draft,
  onResume,
  onRequestStartFresh
}) {
  if (!draft) return null

  const targetName = draft.identity?.firstName || draft.identity?.lastName
    ? `${draft.identity.firstName} ${draft.identity.lastName}`.trim()
    : 'Personnel Member'

  const formattedTime = draft.updatedAt
    ? new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'recently'

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Unfinished Onboarding Form Draft Restored"
      className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-snug min-w-0">
          <p className="font-bold text-amber-950 dark:text-amber-100">Unfinished Onboarding Draft Found</p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium truncate">
            We found an unsubmitted draft for <strong className="font-bold">{targetName}</strong> saved at {formattedTime}.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <button
          type="button"
          onClick={onRequestStartFresh}
          className="px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-slate-800 text-amber-900 dark:text-amber-200 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          <span>Start Fresh</span>
        </button>

        <button
          type="button"
          onClick={onResume}
          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Resume Draft</span>
        </button>
      </div>
    </div>
  )
}
