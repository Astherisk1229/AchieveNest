import { describe, it, expect } from 'vitest'
import { getRecommendedCreationAction, getActionAvailability } from '../OSADAcademicHeaderActions'

describe('OSAD Academic Header Actions Logic', () => {
  it('uses the College -> Academic Program creation sequence', () => {
    expect(getRecommendedCreationAction({ collegeCount: 0, academicProgramCount: 0 })).toBe('college')
    expect(getRecommendedCreationAction({ collegeCount: 1, academicProgramCount: 0 })).toBe('academic_program')
    expect(getRecommendedCreationAction({ collegeCount: 1, academicProgramCount: 1 })).toBe(null)
  })

  it('requires a College before an Academic Program can be created', () => {
    expect(getActionAvailability({ collegeCount: 0 })).toEqual({
      canCreateCollege: true,
      canCreateAcademicProgram: false,
      academicProgramTooltip: 'Create a College first.'
    })
    expect(getActionAvailability({ collegeCount: 1 }).canCreateAcademicProgram).toBe(true)
  })

  it('always permits College creation', () => {
    expect(getActionAvailability({ collegeCount: 0 }).canCreateCollege).toBe(true)
  })

  it('clears the Academic Program prerequisite tooltip when a College exists', () => {
    expect(getActionAvailability({ collegeCount: 1 }).academicProgramTooltip).toBe('')
  })

  it('does not recommend a removed intermediate hierarchy level', () => {
    expect(['department', 'degree_program']).not.toContain(getRecommendedCreationAction({ collegeCount: 1, academicProgramCount: 0 }))
  })
})
