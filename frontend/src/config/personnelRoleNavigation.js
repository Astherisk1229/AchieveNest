/**
 * personnelRoleNavigation.js
 * Centralized navigation bridge for AchieveNest.
 * 
 * Re-exports navigation lookup consuming NAVIGATION_CATALOG and permissionResolver.
 */

import { NAVIGATION_CATALOG } from './navigationCatalog'
import { getAuthorizedNavigation } from '../security/permissionResolver'
import { normalizeRoleContext, normalizeAccountType, CANONICAL_ROLES, CANONICAL_ACCOUNT_TYPES } from '../utils/roleContext'

export { NAVIGATION_CATALOG }

/**
 * Returns authorized navigation items for a given user session or role context.
 * For unknown or unassigned roles, returns an empty array.
 */
export function getAuthorizedNavigationForSession(userOrRole = '') {
  let userSession = null

  if (typeof userOrRole === 'string') {
    const normRole = normalizeRoleContext(userOrRole)
    let accountType = CANONICAL_ACCOUNT_TYPES.PERSONNEL

    if (normRole === CANONICAL_ROLES.HR_STAFF) {
      accountType = CANONICAL_ACCOUNT_TYPES.HR_ADMIN
    } else if (normRole === CANONICAL_ROLES.OSAD_STAFF) {
      accountType = CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN
    } else if (normRole === CANONICAL_ROLES.STUDENT) {
      accountType = CANONICAL_ACCOUNT_TYPES.STUDENT
    }

    userSession = {
      account_type: accountType,
      user_type: accountType,
      role: normRole,
      active_role_context: normRole,
      assigned_roles: [normRole]
    }
  } else if (userOrRole && typeof userOrRole === 'object') {
    userSession = {
      ...userOrRole,
      account_type: normalizeAccountType(userOrRole.account_type || userOrRole.user_type),
      active_role_context: normalizeRoleContext(userOrRole.active_role_context || userOrRole.role)
    }
  }

  if (!userSession) return []

  return getAuthorizedNavigation(userSession, NAVIGATION_CATALOG)
}

/**
 * Alias for backward compatibility.
 */
export const getPersonnelNavigation = getAuthorizedNavigationForSession

const TAB_ALIASES = Object.freeze({
  'academic-structure': ['colleges', 'programs'], accounts: ['students', 'student-accounts'],
  organizations: ['orgs', 'student-organizations'], 'password-resets': ['resets'],
  awards: ['criteria', 'award-categories'], 'candidate-review': ['awardees', 'candidates'],
  'certificate-templates': ['templates'], reports: ['accreditation', 'compliance'],
  audit: ['activity-log', 'logs', 'audit-logs']
})

export function isNavigationItemActive(item, pathname = '', activeTab = 'overview') {
  const currentPath = pathname.split('?')[0]
  const itemPath = item.path.split('?')[0]
  if (item.tab && currentPath === itemPath) {
    const itemTab = item.tab.toLowerCase()
    const currentTab = String(activeTab || 'overview').toLowerCase()
    return currentTab === itemTab || (TAB_ALIASES[itemTab] || []).includes(currentTab)
  }
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}
