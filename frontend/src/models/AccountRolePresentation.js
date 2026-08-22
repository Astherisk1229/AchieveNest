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
    defaultUserData: {
      full_name: 'Director Evelyn Tan',
      employee_id: 'HR-DIR-2010-001',
      student_id: 'HR-DIR-2010-001',
      designation: 'Director of Human Resource Management & Development',
      department: 'Human Resource Management & Development Office (HRMDO)',
      college: 'NDMU General Administration & Governance',
      email: 'etan@ndmu.edu.ph',
      phone: '+63 917 845 2910',
      location: 'Koronadal City, South Cotabato',
      user_type: 'hr_staff',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    readOnlyFields: ['employee_id', 'full_name', 'email', 'designation', 'department', 'college', 'user_type'],
    editableFields: ['phone', 'location', 'avatar_url']
  },

  osad_staff: {
    roleKey: 'osad_staff',
    pageTitle: 'OSAD Administrator Profile',
    badgeText: 'OSAD Central Governance',
    badgeColor: 'bg-emerald-50 text-[#064e2b] border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    defaultUserData: {
      full_name: 'Director Marcus Vance, Ph.D.',
      employee_id: 'OSAD-DIR-2015-002',
      student_id: 'OSAD-DIR-2015-002',
      designation: 'Director of Student Affairs & Services',
      department: 'Office of Student Affairs & Services (OSAD)',
      college: 'NDMU Main Campus Administration',
      email: 'osad@ndmu.edu.ph',
      phone: '+63 918 234 5678',
      location: 'Koronadal City, South Cotabato',
      user_type: 'osad_staff',
      avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
    },
    readOnlyFields: ['employee_id', 'full_name', 'email', 'designation', 'department', 'college', 'user_type'],
    editableFields: ['phone', 'location', 'avatar_url']
  },

  personnel: {
    roleKey: 'personnel',
    pageTitle: 'Faculty & Personnel Dossier',
    badgeText: 'Personnel Account',
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60',
    defaultUserData: {
      full_name: 'Dr. Maria Santos, Ph.D.',
      employee_id: 'EMP-2021-0842',
      student_id: 'EMP-2021-0842',
      designation: 'Associate Professor II & Research Head',
      department: 'Department of Computer Studies',
      college: 'CEAC - College of Engineering, Architecture, and Computing',
      email: 'faculty@ndmu.edu.ph',
      phone: '+63 917 845 2910',
      location: 'Koronadal City, South Cotabato',
      user_type: 'personnel',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    readOnlyFields: ['employee_id', 'full_name', 'email', 'designation', 'department', 'college', 'user_type'],
    editableFields: ['phone', 'location', 'avatar_url']
  },

  student: {
    roleKey: 'student',
    pageTitle: 'Student Account & Achievements',
    badgeText: 'Student Scholar',
    badgeColor: 'bg-emerald-50 text-[#064e2b] border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    defaultUserData: {
      full_name: 'Maria Santos',
      student_id: '2024-01234',
      employee_id: '2024-01234',
      designation: 'Student Researcher',
      department: 'Department of Computer Studies',
      college: 'CEAC - College of Engineering, Architecture, and Computing',
      email: 'student@ndmu.edu.ph',
      phone: '+63 912 345 6789',
      location: 'Koronadal City, South Cotabato',
      user_type: 'student',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    readOnlyFields: ['student_id', 'full_name', 'email', 'department', 'college', 'user_type'],
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

  const personnelRoles = ['personnel', 'faculty', 'department_secretary', 'program_coordinator', 'organization_moderator']
  if (personnelRoles.includes(roleKey)) {
    return ACCOUNT_ROLE_PRESENTATIONS.personnel
  }

  if (ACCOUNT_ROLE_PRESENTATIONS[roleKey]) {
    return ACCOUNT_ROLE_PRESENTATIONS[roleKey]
  }

  return ACCOUNT_ROLE_PRESENTATIONS.student
}

export default getAccountRolePresentation
