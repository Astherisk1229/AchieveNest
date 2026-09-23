/**
 * OSADAcademicHeaderActions.js
 * Pure calculation helpers for OSAD Academic Structure Header Actions.
 * Determines contextual primary action and dependency prerequisite availability.
 */

export function getRecommendedCreationAction({ collegeCount = 0, academicProgramCount = 0 } = {}) {
  if (collegeCount === 0) return 'college'
  if (academicProgramCount === 0) return 'academic_program'
  return null
}

export function getActionAvailability({ collegeCount = 0 } = {}) {
  const canCreateCollege = true
  const canCreateAcademicProgram = collegeCount > 0

  return {
    canCreateCollege,
    canCreateAcademicProgram,
    academicProgramTooltip: canCreateAcademicProgram ? '' : 'Create a College first.'
  }
}
