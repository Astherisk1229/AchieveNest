/**
 * AchieveNest Plan 10 — Student Account Status Contract & Presentation Helper
 * 
 * Maps raw database/API lifecycle states into authoritative display badges,
 * ensuring high contrast and strict semantic separation from enrollment status.
 */

export const STUDENT_ACCOUNT_STATUSES = {
  PENDING_FIRST_LOGIN: 'pending_first_login',
  ACTIVE: 'active',
  LOCKED: 'locked',
  DISABLED: 'disabled',
  ARCHIVED: 'archived',
  UNKNOWN: 'unknown'
}

export function resolveStudentAccountStatus(rawStatus, mustChangePassword) {
  if (!rawStatus || typeof rawStatus !== 'string') {
    return {
      statusKey: STUDENT_ACCOUNT_STATUSES.UNKNOWN,
      label: 'Unknown',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      isPendingFirstLogin: false
    }
  }

  const normalized = rawStatus.trim().toLowerCase()

  if (normalized === 'active' && Boolean(mustChangePassword)) {
    return {
      statusKey: STUDENT_ACCOUNT_STATUSES.PENDING_FIRST_LOGIN,
      label: 'Pending First Login',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-bold',
      isPendingFirstLogin: true
    }
  }

  switch (normalized) {
    case 'active':
      return {
        statusKey: STUDENT_ACCOUNT_STATUSES.ACTIVE,
        label: 'Active',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-bold',
        isPendingFirstLogin: false
      }
    case 'locked':
      return {
        statusKey: STUDENT_ACCOUNT_STATUSES.LOCKED,
        label: 'Locked',
        badgeClass: 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 font-bold',
        isPendingFirstLogin: false
      }
    case 'disabled':
    case 'suspended':
      return {
        statusKey: STUDENT_ACCOUNT_STATUSES.DISABLED,
        label: normalized === 'suspended' ? 'Suspended' : 'Disabled',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold',
        isPendingFirstLogin: false
      }
    case 'archived':
      return {
        statusKey: STUDENT_ACCOUNT_STATUSES.ARCHIVED,
        label: 'Archived',
        badgeClass: 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium',
        isPendingFirstLogin: false
      }
    default:
      return {
        statusKey: STUDENT_ACCOUNT_STATUSES.UNKNOWN,
        label: 'Unknown',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        isPendingFirstLogin: false
      }
  }
}
