import { describe, it, expect } from 'vitest'
import { getRecommendedCreationAction, getActionAvailability } from '../OSADAcademicHeaderActions'

describe('OSAD Academic Header Actions Logic', () => {
  describe('getRecommendedCreationAction', () => {
    it('recommends "college" when 0 colleges exist', () => {
      expect(getRecommendedCreationAction({ collegeCount: 0, departmentCount: 0, degreeProgramCount: 0 })).toBe('college')
    })

    it('recommends "department" when >=1 college exists but 0 departments exist', () => {
      expect(getRecommendedCreationAction({ collegeCount: 2, departmentCount: 0, degreeProgramCount: 0 })).toBe('department')
    })

    it('recommends "degree_program" when >=1 department exists but 0 degree programs exist', () => {
      expect(getRecommendedCreationAction({ collegeCount: 2, departmentCount: 3, degreeProgramCount: 0 })).toBe('degree_program')
    })

    it('returns null when all hierarchy levels exist', () => {
      expect(getRecommendedCreationAction({ collegeCount: 2, departmentCount: 3, degreeProgramCount: 5 })).toBe(null)
    })
  })

  describe('getActionAvailability', () => {
    it('enables College creation always, disables Department & Program when no Colleges exist', () => {
      const availability = getActionAvailability({ collegeCount: 0, departmentCount: 0 })
      expect(availability.canCreateCollege).toBe(true)
      expect(availability.canCreateDepartment).toBe(false)
      expect(availability.canCreateDegreeProgram).toBe(false)
      expect(availability.departmentTooltip).toBe('Create a College first.')
      expect(availability.degreeProgramTooltip).toBe('Create a Department first.')
    })

    it('enables Department creation when Colleges exist, keeps Program disabled when 0 Departments exist', () => {
      const availability = getActionAvailability({ collegeCount: 1, departmentCount: 0 })
      expect(availability.canCreateCollege).toBe(true)
      expect(availability.canCreateDepartment).toBe(true)
      expect(availability.canCreateDegreeProgram).toBe(false)
      expect(availability.departmentTooltip).toBe('')
      expect(availability.degreeProgramTooltip).toBe('Create a Department first.')
    })

    it('enables all creation actions when Colleges and Departments exist', () => {
      const availability = getActionAvailability({ collegeCount: 1, departmentCount: 1 })
      expect(availability.canCreateCollege).toBe(true)
      expect(availability.canCreateDepartment).toBe(true)
      expect(availability.canCreateDegreeProgram).toBe(true)
      expect(availability.departmentTooltip).toBe('')
      expect(availability.degreeProgramTooltip).toBe('')
    })
  })
})
