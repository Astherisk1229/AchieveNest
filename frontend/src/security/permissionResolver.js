/**
 * permissionResolver.js
 * Pre-Render Authorization Resolver for AchieveNest.
 * 
 * Pure security functions that evaluate user session identity, account type,
 * assigned roles, active context, and permissions BEFORE rendering navigation or components.
 */

import {
  normalizeAccountType,
  normalizeRoleContext,
  normalizeAssignedRoles,
  isRoleAssigned,
  isValidAccountRoleCombination
} from '../utils/roleContext'

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
  dean: [
    'college.faculty.review'
  ],
  hr_staff: [
    'hr.personnel.manage',
    'hr.evaluation.manage'
  ],
  osad_staff: [
    'osad.academic_structure.manage',
    'osad.certificate_template.manage',
    'osad.award_candidate.review',
    'osad.award_candidate.advance',
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

  const accountType = normalizeAccountType(userSession.account_type || userSession.user_type)
  const assignedRoles = normalizeAssignedRoles(userSession.assigned_roles, accountType)
  const activeContext = normalizeRoleContext(userSession.active_role_context || userSession.role)

  // Security check 1: active context MUST be present in assigned roles
  if (!isRoleAssigned(activeContext, assignedRoles)) {
    return false
  }

  // Security check 2: active context MUST be a valid role for the account type
  if (accountType && !isValidAccountRoleCombination(accountType, activeContext)) {
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

  const accountType = normalizeAccountType(userSession.account_type || userSession.user_type)
  const activeContext = normalizeRoleContext(userSession.active_role_context || userSession.role)
  const assignedRoles = normalizeAssignedRoles(userSession.assigned_roles, accountType)

  // 1. Account type requirement check (defense-in-depth)
  if (Array.isArray(item.allowedAccountTypes) && item.allowedAccountTypes.length > 0) {
    if (!accountType || !item.allowedAccountTypes.includes(accountType)) {
      return false
    }
  }

  // 2. Active context MUST be valid, assigned, and compatible with account type
  if (!isRoleAssigned(activeContext, assignedRoles)) {
    return false
  }

  if (accountType && !isValidAccountRoleCombination(accountType, activeContext)) {
    return false
  }

  // 3. Item required active context check
  if (Array.isArray(item.requiredActiveContexts) && item.requiredActiveContexts.length > 0) {
    if (!item.requiredActiveContexts.includes(activeContext)) {
      return false
    }
  }

  // 4. Item required permissions check
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
