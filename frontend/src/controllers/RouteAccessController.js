export default class RouteAccessController {
  static PERSONNEL_ROLES = ['personnel', 'dean', 'program_coordinator', 'organization_moderator']

  static getCurrentRole(user) {
    return user?.active_role_context || user?.account_type || user?.primary_role || 'student'
  }

  static isAllowedAccess(user, allowedAccountTypes = [], requiredRoles = []) {
    if (!user) return false
    const accountType = user.account_type || user.user_type
    const roles = user.assigned_roles || user.roles || []

    // Verify account type if specified
    if (allowedAccountTypes.length > 0 && !allowedAccountTypes.includes(accountType)) {
      return false
    }

    // Verify required roles if specified
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(r => roles.includes(r))
      if (!hasRequiredRole) return false
    }

    return true
  }

  static resolveRedirect(userOrAccountType) {
    const accountType = typeof userOrAccountType === 'object'
      ? (userOrAccountType?.account_type || userOrAccountType?.user_type || 'student')
      : userOrAccountType

    if (accountType === 'student') return '/student/dashboard'
    if (accountType === 'hr_admin') return '/hr/dashboard'
    if (accountType === 'osad_admin') return '/osad/dashboard'
    if (accountType === 'personnel') return '/personnel/dashboard'
    return '/student/dashboard'
  }
}