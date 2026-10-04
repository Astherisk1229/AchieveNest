/**
 * AccountRolePresentation.js
 * Centralized role presentation registry defining authoritative vs self-service fields,
 * badge titles, and initial fallback user data for each authenticated role.
 */

export const ACCOUNT_ROLE_PRESENTATIONS = {
  hr_staff: {
    roleKey: 'hr_staff',
    pageTitle: 'HR Staff Profile & Governance Credentials',
    badgeText: 'HR Staff & Administration',
    badgeColor: 'bg-emerald-50 text-[#064e2b] border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    readOnlyFields: ['employee_id', 'full_name', 'email', 'designation', 'administrative_unit', 'college', 'user_type'],
    editableFields: ['phone', 'location', 'avatar_url']
  },

  osad_staff: {
    roleKey: 'osad_staff',
    pageTitle: 'OSAD Administrator Profile',
    badgeText: 'OSAD Central Governance',
    badgeColor: 'bg-emerald-50 text-[#064e2b] border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    readOnlyFields: ['employee_id', 'full_name', 'email', 'designation', 'administrative_unit', 'college', 'user_type'],
    editableFields: ['phone', 'location', 'avatar_url']
  },

  personnel: {
    roleKey: 'personnel',
    pageTitle: 'Faculty & Personnel Dossier',
    badgeText: 'Personnel Account',
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60',
    readOnlyFields: ['employee_id', 'full_name', 'email', 'designation', 'program', 'college', 'user_type'],
    editableFields: ['phone', 'location', 'avatar_url']
  },

  student: {
    roleKey: 'student',
    pageTitle: 'Student Account & Achievements',
    badgeText: 'Student Scholar',
    badgeColor: 'bg-emerald-50 text-[#064e2b] border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    readOnlyFields: ['student_id', 'full_name', 'email', 'program', 'college', 'user_type'],
    editableFields: ['phone', 'location', 'avatar_url']
  }
}

/**
 * Returns role presentation configuration for a specified user or active role.
 */
export function getAccountRolePresentation(userOrRole) {
  let roleKey = 'student'

  if (typeof userOrRole === 'string') {
    roleKey = userOrRole
  } else if (userOrRole && typeof userOrRole === 'object') {
    roleKey = userOrRole.active_role_context || userOrRole.user_type || 'student'
  }

  const personnelRoles = ['personnel', 'faculty', 'dean', 'program_coordinator', 'organization_moderator']
  if (personnelRoles.includes(roleKey)) {
    return ACCOUNT_ROLE_PRESENTATIONS.personnel
  }

  if (ACCOUNT_ROLE_PRESENTATIONS[roleKey]) {
    return ACCOUNT_ROLE_PRESENTATIONS[roleKey]
  }

  return ACCOUNT_ROLE_PRESENTATIONS.student
}

export default getAccountRolePresentation
