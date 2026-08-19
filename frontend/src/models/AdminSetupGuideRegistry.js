/**
 * AdminSetupGuideRegistry.js
 * Registry defining role-specific onboarding and setup guide steps for OSAD and HR.
 * OSAD and HR do NOT share a combined step array or progress denominator.
 */

export const ADMIN_SETUP_GUIDES = {
  osad_staff: {
    id: 'osad-get-started',
    title: 'Get Started with OSAD',
    description: 'Set up academic structure, student placement, coordinators, and organizations.',
    ownerRole: 'osad_staff',
    steps: [
      {
        id: 'osad_step_1_structure',
        title: 'Academic Structure',
        description: 'Create Colleges, Departments, and Degree Programs.',
        destination: '/osad/dashboard?tab=departments',
        actionLabel: 'Open Structure',
        evaluatorKey: 'evalOSADAcademicStructure'
      },
      {
        id: 'osad_step_2_students',
        title: 'Student Accounts',
        description: 'Onboard Students and assign to valid Degree Programs.',
        destination: '/osad/dashboard?tab=accounts',
        actionLabel: 'Open Students',
        evaluatorKey: 'evalOSADStudentPlacement'
      },
      {
        id: 'osad_step_3_coordinators',
        title: 'Program Coordinators',
        description: 'Assign one Program Coordinator to each Department.',
        destination: '/osad/dashboard?tab=departments',
        actionLabel: 'Open Coordinators',
        evaluatorKey: 'evalOSADDepartmentCoordinators'
      },
      {
        id: 'osad_step_4_organizations',
        title: 'Student Organizations & Moderators',
        description: 'Create Student Organizations and assign Organization Moderators.',
        destination: '/osad/dashboard?tab=organizations',
        actionLabel: 'Open Organizations',
        evaluatorKey: 'evalOSADOrganizations'
      }
    ]
  },

  hr_staff: {
    id: 'hr-get-started',
    title: 'Get Started with HR Administration',
    description: 'Onboard personnel and complete College leadership and assignment setup.',
    ownerRole: 'hr_staff',
    steps: [
      {
        id: 'hr_step_1_personnel',
        title: 'Personnel Accounts',
        description: 'Onboard Faculty and Administrative Personnel accounts.',
        destination: '/hr/personnel-directory',
        actionLabel: 'Open Personnel',
        evaluatorKey: 'evalHRPersonnelAccounts'
      },
      {
        id: 'hr_step_2_college_placement',
        title: 'College Placement',
        description: 'Assign active Personnel to Academic Colleges.',
        destination: '/hr/personnel-directory?tab=departments',
        actionLabel: 'Open Placement',
        evaluatorKey: 'evalHRCollegePlacement'
      },
      {
        id: 'hr_step_3_deans',
        title: 'College Deans',
        description: 'Designate HR-assigned Deans for each College.',
        destination: '/hr/personnel-directory?tab=departments',
        actionLabel: 'Open Deans',
        evaluatorKey: 'evalHRCollegeDeans'
      },
      {
        id: 'hr_step_4_secretaries',
        title: 'Department Secretaries',
        description: 'Assign College-based Department Secretaries for personnel verification.',
        destination: '/hr/personnel-directory?tab=departments',
        actionLabel: 'Open Secretaries',
        evaluatorKey: 'evalHRDepartmentSecretaries'
      }
    ]
  }
}

export function getAdminSetupGuide(userOrRole) {
  let roleKey = 'osad_staff'

  if (typeof userOrRole === 'string') {
    roleKey = userOrRole
  } else if (userOrRole && typeof userOrRole === 'object') {
    roleKey = userOrRole.active_role_context || userOrRole.user_type || 'osad_staff'
  }

  if (roleKey.includes('hr')) return ADMIN_SETUP_GUIDES.hr_staff
  if (roleKey.includes('osad')) return ADMIN_SETUP_GUIDES.osad_staff

  return null
}

export default ADMIN_SETUP_GUIDES
