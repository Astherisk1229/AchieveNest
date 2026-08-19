/**
 * OSADAcademicHeaderActions.js
 * Pure calculation helpers for OSAD Academic Structure Header Actions.
 * Determines contextual primary action and dependency prerequisite availability.
 */

export function getRecommendedCreationAction({ collegeCount = 0, departmentCount = 0, degreeProgramCount = 0 } = {}) {
  if (collegeCount === 0) return 'college'
  if (departmentCount === 0) return 'department'
  if (degreeProgramCount === 0) return 'degree_program'
  return null
}

export function getActionAvailability({ collegeCount = 0, departmentCount = 0 } = {}) {
  const canCreateCollege = true
  const canCreateDepartment = collegeCount > 0
  const canCreateDegreeProgram = departmentCount > 0

  return {
    canCreateCollege,
    canCreateDepartment,
    canCreateDegreeProgram,
    departmentTooltip: canCreateDepartment ? '' : 'Create a College first.',
    degreeProgramTooltip: canCreateDegreeProgram ? '' : 'Create a Department first.'
  }
}
