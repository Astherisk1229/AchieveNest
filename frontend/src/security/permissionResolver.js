/**
 * permissionResolver.js
 * Pre-Render Authorization Resolver for AchieveNest.
 * 
 * Pure security functions that evaluate user session identity, assigned roles,
 * active context, and permissions BEFORE rendering navigation or components.
 */

import { normalizeRoleContext, normalizeAssignedRoles, isRoleAssigned } from '../utils/roleContext'

/**
 * Default permissions mapped per canonical role context.
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  student: [
    'student.dashboard.read',
    'student.achievement.manage',
    'student.portfolio.read',
    'student.account.manage'
  ],
  personnel: [
    'portfolio.personal.read',
    'portfolio.personal.update',
    'personnel.account.manage'
  ],
  program_coordinator: [
    'achievement.student.verify'
  ],
  organization_moderator: [
    'organization.event.manage',
    'organization.attendance.manage',
    'organization.certificate.issue'
  ],
  department_secretary: [
    'department.portfolio.review'
  ],
  hr_staff: [
    'hr.personnel.manage',
    'hr.evaluation.manage'
  ],
  osad_staff: [
    'osad.academic_structure.manage',
    'osad.certificate_template.manage',
    'osad.awardee.confirm'
  ]
}

/**
 * Extract active permissions for the user session.
 */
export function getSessionPermissions(userSession) {
  if (!userSession) return []
  if (Array.isArray(userSession.permissions) && userSession.permissions.length > 0) {
    return userSession.permissions
  }
  const activeRole = normalizeRoleContext(userSession.active_role_context || userSession.role)
  return DEFAULT_ROLE_PERMISSIONS[activeRole] || []
}

/**
 * Evaluates whether a user session has a specific permission.
 */
export function can(userSession, permission, _resourceContext = null) {
  if (!userSession || !permission) return false

  const assignedRoles = normalizeAssignedRoles(userSession.assigned_roles, userSession.role)
  const activeContext = normalizeRoleContext(userSession.active_role_context || userSession.role)

  // Security check: active context MUST be present in assigned roles
  if (!isRoleAssigned(activeContext, assignedRoles)) {
    return false
  }

  const permissions = getSessionPermissions(userSession)
  return permissions.includes(permission)
}

/**
 * Evaluates whether a navigation catalog item is authorized for rendering.
 */
export function canAccessNavigationItem(userSession, item) {
  if (!userSession || !item) return false

  const assignedRoles = normalizeAssignedRoles(userSession.assigned_roles, userSession.role)
  const activeContext = normalizeRoleContext(userSession.active_role_context || userSession.role)

  // 1. Active context MUST be valid and assigned to the user
  if (!isRoleAssigned(activeContext, assignedRoles)) {
    return false
  }

  // 2. Item required active context check
  if (Array.isArray(item.requiredActiveContexts) && item.requiredActiveContexts.length > 0) {
    if (!item.requiredActiveContexts.includes(activeContext)) {
      return false
    }
  }

  // 3. Item required permissions check
  if (Array.isArray(item.requiredPermissions) && item.requiredPermissions.length > 0) {
    const hasAllPermissions = item.requiredPermissions.every(perm => can(userSession, perm))
    if (!hasAllPermissions) return false
  }

  return true
}

/**
 * Pre-filters the central navigation catalog BEFORE JSX rendering.
 * Unauthorized items are completely excluded from the returned array so they
 * NEVER enter the DOM.
 */
export function getAuthorizedNavigation(userSession, catalog = []) {
  if (!userSession || !Array.isArray(catalog)) return []

  return catalog.filter(item => canAccessNavigationItem(userSession, item))
}
