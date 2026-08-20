/**
 * roleContext.js
 * Utility module for normalizing, validating, and managing personnel role contexts.
 * Canonical Role Identifiers:
 * - 'personnel'
 * - 'program_coordinator'
 * - 'organization_moderator'
 * - 'department_secretary'
 * - 'hr_staff'
 * - 'osad_staff'
 * - 'student'
 */

export const CANONICAL_ROLES = {
  PERSONNEL: 'personnel',
  PROGRAM_COORDINATOR: 'program_coordinator',
  ORGANIZATION_MODERATOR: 'organization_moderator',
  DEPARTMENT_SECRETARY: 'department_secretary',
  HR_STAFF: 'hr_staff',
  OSAD_STAFF: 'osad_staff',
  STUDENT: 'student'
}

export function normalizeRoleContext(roleStr = '') {
  if (!roleStr || typeof roleStr !== 'string') return CANONICAL_ROLES.PERSONNEL
  const clean = roleStr.toLowerCase().trim()

  switch (clean) {
    case 'faculty':
    case 'personnel':
    case 'staff':
      return CANONICAL_ROLES.PERSONNEL

    case 'program_coordinator':
    case 'coordinator':
      return CANONICAL_ROLES.PROGRAM_COORDINATOR

    case 'organization_moderator':
    case 'org_moderator':
    case 'moderator':
      return CANONICAL_ROLES.ORGANIZATION_MODERATOR

    case 'department_secretary':
    case 'dept_secretary':
    case 'dep_sec':
    case 'secretary':
      return CANONICAL_ROLES.DEPARTMENT_SECRETARY

    case 'hr_staff':
    case 'hr':
      return CANONICAL_ROLES.HR_STAFF

    case 'osad_staff':
    case 'osad':
      return CANONICAL_ROLES.OSAD_STAFF

    case 'student':
      return CANONICAL_ROLES.STUDENT

    default:
      return clean
  }
}

export function normalizeAssignedRoles(roles = [], primaryType = 'personnel') {
  const normPrimary = normalizeRoleContext(primaryType)
  const normList = Array.isArray(roles) ? roles.map(r => normalizeRoleContext(r)) : []
  
  if (normPrimary && !normList.includes(normPrimary)) {
    normList.unshift(normPrimary)
  }

  // Fall back safely to primary role if empty
  if (normList.length === 0) {
    normList.push(normPrimary || CANONICAL_ROLES.PERSONNEL)
  }

  return Array.from(new Set(normList))
}

export function isRoleAssigned(userOrRole = {}, targetRole = '') {
  if (typeof userOrRole === 'string' && Array.isArray(targetRole)) {
    const normTarget = normalizeRoleContext(userOrRole)
    const assigned = targetRole.map(r => normalizeRoleContext(r))
    return assigned.includes(normTarget)
  }
  
  if (typeof userOrRole === 'string' && typeof targetRole === 'string') {
    return normalizeRoleContext(userOrRole) === normalizeRoleContext(targetRole)
  }

  const normTarget = normalizeRoleContext(targetRole)
  const userObj = userOrRole || {}
  const assigned = normalizeAssignedRoles(userObj.assigned_roles || userObj.roles, userObj.role || userObj.user_type)
  return assigned.includes(normTarget)
}

export function getSafeFallbackRole(user = {}) {
  const assigned = normalizeAssignedRoles(user.assigned_roles || user.roles, user.user_type)
  return assigned[0] || CANONICAL_ROLES.PERSONNEL
}
