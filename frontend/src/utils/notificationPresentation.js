/**
 * Shared notification presentation for NotificationsPage and NotificationPopover.
 * Destinations use the real routes in App.jsx and config/navigationCatalog.js:
 * - student achievements: /student/achievements (StudentAchievementsPage reads state.highlightId)
 * - Program Coordinator verification workspace: /personnel/dashboard?tab=workspace (&record=<id> selects it)
 */

export const PORTFOLIO_REFERENCE = 'student_portfolio_records'

/** Which portal the viewer is in, from the current path. */
export function portalFromPath(pathname = '') {
  if (pathname.startsWith('/student')) return 'student'
  if (pathname.startsWith('/osad')) return 'osad'
  if (pathname.startsWith('/personnel') || pathname.startsWith('/dean')) return 'personnel'
  return null
}

/** @returns {{ path: string, state: object|null } | null} */
export function notificationTarget(item = {}, portal = null) {
  if (item.target_path) return { path: item.target_path, state: null }
  const referenceType = item.reference_type || item.entity_type || null
  const referenceId = item.reference_id || item.entity_id || null

  if (referenceType === PORTFOLIO_REFERENCE && referenceId) {
    if (portal === 'student') return { path: '/student/achievements', state: { highlightId: referenceId } }
    if (portal === 'personnel') {
      return { path: `/personnel/dashboard?tab=workspace&record=${encodeURIComponent(referenceId)}`, state: null }
    }
    return null
  }
  if (['personnel_portfolio_submission', 'personnel_evaluations'].includes(referenceType)) {
    return { path: '/personnel/portfolio/edit', state: referenceId ? { highlightId: referenceId } : null }
  }
  return null
}

/**
 * Tone per notification type. Student achievement types:
 * student_achievement_submitted, portfolio_verified, portfolio_revision_requested, portfolio_rejected.
 */
export function notificationTone(type = '') {
  const value = String(type || '').toLowerCase()
  if (['portfolio_verified', 'success', 'endorsed'].includes(value)) return 'success'
  if (['portfolio_revision_requested', 'warning', 'returned'].includes(value)) return 'warning'
  if (['portfolio_rejected', 'danger', 'rejected'].includes(value)) return 'danger'
  if (value === 'student_achievement_submitted') return 'submitted'
  return 'info'
}

export const TONE_CLASSES = {
  success: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#159552] dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  danger: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  submitted: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  info: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
}

export function actionLabel(type = '', portal = null) {
  const tone = notificationTone(type)
  if (tone === 'warning') return portal === 'student' ? 'Revise Achievement' : 'View Details'
  if (tone === 'submitted') return 'Review Submission'
  return 'View Details'
}
