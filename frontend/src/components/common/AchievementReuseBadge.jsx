import React from 'react'
import { Lock, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import AchievementReuseEligibilityService from '../../services/AchievementReuseEligibilityService'

export default function AchievementReuseBadge({
  accomplishment,
  targetAcademicYear = 'AY 2026-2027',
  className = ''
}) {
  const eligibility = AchievementReuseEligibilityService.evaluateReuseEligibility(
    accomplishment,
    targetAcademicYear
  )

  if (eligibility.badgeType === 'eligible') {
    return null
  }

  if (eligibility.badgeType === 'locked') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 ${className}`}
        title={`Used in ${eligibility.lastUsedAY}. Locked for 2 years until ${eligibility.eligibleAgainAY}.`}
      >
        <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>{eligibility.statusLabel}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 ${className}`}
    >
      <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>Eligible for Reuse</span>
    </span>
  )
}
