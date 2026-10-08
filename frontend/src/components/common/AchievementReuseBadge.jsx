import React from 'react'
import { Lock } from 'lucide-react'
import AchievementReuseEligibilityService from '../../services/AchievementReuseEligibilityService'

export default function AchievementReuseBadge({
  accomplishment,
  className = ''
}) {
  const eligibility = AchievementReuseEligibilityService.evaluateReuseEligibility(accomplishment)

  if (eligibility.badgeType === 'locked') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 ${className}`}
        title={`This accomplishment was included in a finalized evaluation${eligibility.lastUsedAY ? ` (${eligibility.lastUsedAY})` : ''}.`}
      >
        <Lock className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>{eligibility.displayLabel}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 ${className}`}
      title={eligibility.statusLabel}
    >
      <span>{eligibility.displayLabel}</span>
    </span>
  )
}
