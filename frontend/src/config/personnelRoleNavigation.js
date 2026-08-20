/**
 * personnelRoleNavigation.js
 * Centralized navigation bridge for AchieveNest.
 * 
 * Re-exports navigation lookup consuming NAVIGATION_CATALOG and permissionResolver.
 */

import { NAVIGATION_CATALOG } from './navigationCatalog'
import { getAuthorizedNavigation } from '../security/permissionResolver'
import { normalizeRoleContext } from '../utils/roleContext'

export { NAVIGATION_CATALOG }

/**
 * Returns authorized navigation items for a given user or role context.
 * If passed a string (role context), constructs a minimal user session context.
 * For unknown or unassigned roles, returns an empty array.
 */
export function getPersonnelNavigation(userOrRole = '') {
  let userSession = null

  if (typeof userOrRole === 'string') {
    const normRole = normalizeRoleContext(userOrRole)
    userSession = {
      role: normRole,
      active_role_context: normRole,
      assigned_roles: [normRole]
    }
  } else if (userOrRole && typeof userOrRole === 'object') {
    userSession = userOrRole
  }

  if (!userSession) return []

  return getAuthorizedNavigation(userSession, NAVIGATION_CATALOG)
}
