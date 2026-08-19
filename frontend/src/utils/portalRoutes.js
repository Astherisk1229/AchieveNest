/**
 * portalRoutes.js
 * Centralized portal route resolver mapping authenticated user roles and context
 * to canonical account, settings, and dashboard destinations.
 */

export const PORTAL_ROUTES = {
  hr_staff: {
    account: '/hr/account',
    settings: '/hr/settings',
    dashboard: '/hr/dashboard'
  },
  osad_staff: {
    account: '/osad/account',
    settings: '/osad/settings',
    dashboard: '/osad/dashboard'
  },
  student: {
    account: '/student/account',
    settings: '/student/settings',
    dashboard: '/student/dashboard'
  },
  personnel: {
    account: '/personnel/account',
    settings: '/personnel/settings',
    dashboard: '/personnel/dashboard'
  }
}

/**
 * Resolves the target portal route object for a given user identity or active role context.
 * @param {object|string} userOrRoleContext - User object or active role context string
 * @returns {object} { account, settings, dashboard }
 */
export function getPortalRoutes(userOrRoleContext) {
  let role = 'student'

  if (typeof userOrRoleContext === 'string') {
    role = userOrRoleContext
  } else if (userOrRoleContext && typeof userOrRoleContext === 'object') {
    role = userOrRoleContext.active_role_context || userOrRoleContext.user_type || 'student'
  }

  // Normalize assigned personnel roles (program_coordinator, department_secretary, org_moderator, etc.)
  const personnelRoles = ['personnel', 'faculty', 'department_secretary', 'program_coordinator', 'organization_moderator']
  if (personnelRoles.includes(role)) {
    return PORTAL_ROUTES.personnel
  }

  if (PORTAL_ROUTES[role]) {
    return PORTAL_ROUTES[role]
  }

  return PORTAL_ROUTES.student
}

export function getAccountRoute(userOrRoleContext) {
  return getPortalRoutes(userOrRoleContext).account
}

export function getSettingsRoute(userOrRoleContext) {
  return getPortalRoutes(userOrRoleContext).settings
}

export function getDashboardRoute(userOrRoleContext) {
  return getPortalRoutes(userOrRoleContext).dashboard
}

export default getPortalRoutes
