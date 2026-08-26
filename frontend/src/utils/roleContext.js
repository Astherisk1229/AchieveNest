/**
 * roleContext.js
 * Utility module for normalizing, validating, and managing account types and role contexts.
 * 
 * Separation of Concerns:
 * - Account Type: Identity category ('student', 'personnel', 'hr_admin', 'osad_admin')
 * - Active Role Context: Authorization working context ('student', 'personnel', 'dean', 'program_coordinator', 'organization_moderator', 'hr_staff', 'osad_staff')
 */

export const CANONICAL_ACCOUNT_TYPES = {
  STUDENT: 'student',
  PERSONNEL: 'personnel',
  HR_ADMIN: 'hr_admin',
  OSAD_ADMIN: 'osad_admin'
}

export const CANONICAL_ROLES = {
  PERSONNEL: 'personnel',
  PROGRAM_COORDINATOR: 'program_coordinator',
  ORGANIZATION_MODERATOR: 'organization_moderator',
  DEAN: 'dean',
  HR_STAFF: 'hr_staff',
  OSAD_STAFF: 'osad_staff',
  STUDENT: 'student'
}

/**
 * Normalizes an account type string into canonical identifier.
 */
export function normalizeAccountType(typeStr = '') {
  if (!typeStr || typeof typeStr !== 'string') return null
  const clean = typeStr.toLowerCase().trim()

  switch (clean) {
    case 'student':
      return CANONICAL_ACCOUNT_TYPES.STUDENT
    case 'personnel':
    case 'faculty':
    case 'staff':
      return CANONICAL_ACCOUNT_TYPES.PERSONNEL
    case 'hr_admin':
    case 'hr':
      return CANONICAL_ACCOUNT_TYPES.HR_ADMIN
    case 'osad_admin':
    case 'osad':
      return CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN
    default:
      return clean
  }
}

/**
 * Normalizes a role context string into canonical identifier.
 */
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

    case 'dean':
      return CANONICAL_ROLES.DEAN

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

/**
 * Returns allowed canonical roles for a given account type.
 */
export function getValidRolesForAccountType(accountType = '') {
  const normType = normalizeAccountType(accountType)

  switch (normType) {
    case CANONICAL_ACCOUNT_TYPES.STUDENT:
      return [CANONICAL_ROLES.STUDENT]
    case CANONICAL_ACCOUNT_TYPES.PERSONNEL:
      return [
        CANONICAL_ROLES.PERSONNEL,
        CANONICAL_ROLES.DEAN,
        CANONICAL_ROLES.PROGRAM_COORDINATOR,
        CANONICAL_ROLES.ORGANIZATION_MODERATOR
      ]
    case CANONICAL_ACCOUNT_TYPES.HR_ADMIN:
      return [CANONICAL_ROLES.HR_STAFF]
    case CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN:
      return [CANONICAL_ROLES.OSAD_STAFF]
    default:
      return []
  }
}

/**
 * Checks whether a role is valid for the given account type.
 */
export function isValidAccountRoleCombination(accountType = '', role = '') {
  if (!accountType || !role) return false
  const validRoles = getValidRolesForAccountType(accountType)
  return validRoles.includes(normalizeRoleContext(role))
}

/**
 * Resolves a default active role context from account type and assigned roles.
 * Does NOT silently grant unassigned roles.
 */
export function resolveDefaultActiveRole(accountType = '', assignedRoles = []) {
  const normType = normalizeAccountType(accountType)
  if (!normType) return null

  const rawList = Array.isArray(assignedRoles) ? assignedRoles : []
  const normList = rawList
    .map(r => (typeof r === 'object' ? r.role_key : r))
    .filter(Boolean)
    .map(r => normalizeRoleContext(r))

  // Filter only roles that are both valid for the account type AND assigned
  const validAssigned = normList.filter(r => isValidAccountRoleCombination(normType, r))

  switch (normType) {
    case CANONICAL_ACCOUNT_TYPES.HR_ADMIN:
      return validAssigned.includes(CANONICAL_ROLES.HR_STAFF) ? CANONICAL_ROLES.HR_STAFF : null

    case CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN:
      return validAssigned.includes(CANONICAL_ROLES.OSAD_STAFF) ? CANONICAL_ROLES.OSAD_STAFF : null

    case CANONICAL_ACCOUNT_TYPES.STUDENT:
      return validAssigned.includes(CANONICAL_ROLES.STUDENT) ? CANONICAL_ROLES.STUDENT : null

    case CANONICAL_ACCOUNT_TYPES.PERSONNEL:
      if (validAssigned.includes(CANONICAL_ROLES.PERSONNEL)) {
        return CANONICAL_ROLES.PERSONNEL
      }
      return validAssigned[0] || null

    default:
      return validAssigned[0] || null
  }
}

/**
 * Normalizes an array of assigned roles with respect to primary account type.
 */
export function normalizeAssignedRoles(roles = [], primaryType = 'personnel') {
  const normType = normalizeAccountType(primaryType)
  const rawList = Array.isArray(roles) ? roles : []
  const normList = rawList
    .map(r => (typeof r === 'object' ? r.role_key : r))
    .filter(Boolean)
    .map(r => normalizeRoleContext(r))

  if (normType) {
    const validRoles = getValidRolesForAccountType(normType)
    const filtered = normList.filter(r => validRoles.includes(r))
    if (filtered.length === 0) {
      const defaultRole = resolveDefaultActiveRole(normType, roles)
      if (defaultRole) filtered.push(defaultRole)
    }
    return Array.from(new Set(filtered))
  }

  return Array.from(new Set(normList))
}

/**
 * Verifies whether a role is assigned to the user.
 */
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
  const assigned = normalizeAssignedRoles(
    userObj.assigned_roles || userObj.roles,
    userObj.account_type || userObj.user_type
  )
  return assigned.includes(normTarget)
}

/**
 * Helper: checks if user has a specific role key.
 */
export function hasRole(user = {}, roleKey = '') {
  return isRoleAssigned(user, roleKey)
}

/**
 * Helper: retrieves role assignments array from user object.
 */
export function getRoleAssignments(user = {}) {
  return Array.isArray(user?.role_assignments) ? user.role_assignments : []
}

/**
 * Helper: retrieves Program Coordinator assignments for user.
 */
export function getProgramCoordinatorAssignments(user = {}) {
  return getRoleAssignments(user).filter(a => a.role_key === CANONICAL_ROLES.PROGRAM_COORDINATOR)
}

/**
 * Helper: retrieves Dean assignment for user.
 */
export function getDeanAssignment(user = {}) {
  return getRoleAssignments(user).find(a => a.role_key === CANONICAL_ROLES.DEAN) || null
}

/**
 * Helper: retrieves Organization Moderator assignments for user.
 */
export function getOrganizationModeratorAssignments(user = {}) {
  return getRoleAssignments(user).filter(a => a.role_key === CANONICAL_ROLES.ORGANIZATION_MODERATOR)
}

/**
 * Safe fallback role resolution from user object.
 */
export function getSafeFallbackRole(user = {}) {
  const accountType = user.account_type || user.user_type
  const assigned = user.assigned_roles || user.roles
  return resolveDefaultActiveRole(accountType, assigned) || CANONICAL_ROLES.PERSONNEL
}
