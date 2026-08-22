export default class RouteAccessController {
  static PERSONNEL_ROLES = ['personnel', 'program_coordinator', 'organization_moderator', 'department_secretary']

  static getCurrentRole(user) {
    return user?.active_role_context || user?.primary_role || 'personnel'
  }

  static isAllowedRole(role, allowedRoles = []) {
    if (!allowedRoles || allowedRoles.length === 0) return true
    return allowedRoles.includes(role)
  }

  static resolveRedirect(role) {
    if (role === 'student') return '/student/dashboard'
    if (role === 'hr_staff') return '/hr/dashboard'
    if (role === 'osad_staff') return '/osad/dashboard'
    return '/personnel/dashboard'
  }
}