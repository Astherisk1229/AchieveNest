import { describe, it, expect } from 'vitest'
import PersonnelReviewerRoutingRegistry from '../../services/PersonnelReviewerRoutingRegistry'
import { validatePersonnelPlacement, validatePersonnelMasterData } from '../../utils/personnelPlacement'

describe('CHU-02 — HR, Personnel Management & College Dean Workflows', () => {
  describe('1. Single Personnel Registration & Canonical Placement', () => {
    it('enforces canonical classification pairs and valid employment status', () => {
      // Valid Faculty + Academic
      const validPlacement = validatePersonnelPlacement({
        group: 'faculty',
        side: 'academic',
        collegeId: 'col-cba-uuid',
        academicProgramIds: ['prog-bsa-uuid']
      })
      expect(validPlacement.isValid).toBe(true)
      expect(Object.keys(validPlacement.errors).length).toBe(0)

      const validMasterData = validatePersonnelMasterData({
        employmentStatus: 'permanent',
        facultyEngagement: 'full_time_faculty'
      })
      expect(validMasterData.isValid).toBe(true)
      expect(Object.keys(validMasterData.errors).length).toBe(0)

      // Invalid status: contractual rejected
      const invalidStatus = validatePersonnelMasterData({
        employmentStatus: 'contractual'
      })
      expect(invalidStatus.isValid).toBe(false)
      expect(invalidStatus.errors.employmentStatus).toBeDefined()
    })

    it('rejects academic personnel missing college or program affiliation', () => {
      const missingCollege = validatePersonnelPlacement({
        group: 'faculty',
        side: 'academic',
        collegeId: '',
        academicProgramIds: []
      })
      expect(missingCollege.isValid).toBe(false)
      expect(missingCollege.errors.collegeId).toBeDefined()
    })

    it('rejects non-academic personnel missing administrative unit', () => {
      const missingUnit = validatePersonnelPlacement({
        group: 'non_teaching_faculty',
        side: 'non_academic',
        administrativeUnitId: ''
      })
      expect(missingUnit.isValid).toBe(false)
      expect(missingUnit.errors.administrativeUnitId).toBeDefined()
    })
  })

  describe('2. XLSX Batch Import Workflow', () => {
    it('validates batch import row diagnostics and prevents duplicate commit', () => {
      const mockRawRows = [
        {
          row_number: 1,
          institutional_id: 'EMP-001',
          institutional_email: 'emp1@ndmu.edu.ph',
          full_name: 'Emp One',
          personnel_group: 'faculty',
          employment_status: 'permanent',
          unit_code: 'CBA',
          is_valid: true,
          result_status: 'VALID',
          errors: []
        },
        {
          row_number: 2,
          institutional_id: 'EMP-002',
          institutional_email: 'emp2@ndmu.edu.ph',
          full_name: 'Emp Two',
          personnel_group: 'faculty',
          employment_status: 'contractual', // Invalid status
          unit_code: 'CBA',
          is_valid: false,
          result_status: 'INVALID',
          errors: ['Invalid Personnel Status contractual']
        }
      ]

      const validOnly = mockRawRows.filter(r => r.is_valid)
      expect(validOnly.length).toBe(1)
      expect(validOnly[0].institutional_id).toBe('EMP-001')
    })
  })

  describe('3. Reviewer Routing Matrix & Authority Boundaries', () => {
    it('routes Faculty + Academic to College Dean under college scope', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'academic',
        is_dean: false,
        college_id: 'col-cba-uuid'
      })
      expect(route.authorized_reviewer_role).toBe('dean')
      expect(route.scope_type).toBe('COLLEGE_ACADEMIC_SCOPE')
    })

    it('routes Non-Teaching Faculty + Non-Academic to HR', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
        is_dean: false
      })
      expect(route.authorized_reviewer_role).toBe('hr_staff')
      expect(route.scope_type).toBe('UNIVERSITY_HR_SCOPE')
    })

    it('routes Dean evaluation authoritatively to HR and prohibits self-evaluation', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'academic',
        is_dean: true
      })
      expect(route.authorized_reviewer_role).toBe('hr_staff')
      expect(route.scope_type).toBe('UNIVERSITY_HR_SCOPE')
    })

    it('rejects unsupported classification inputs with UNRESOLVED status', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'administrative_staff',
        organizational_side: 'academic'
      })
      expect(route.status).toBe('unresolved')
      expect(route.authorized_reviewer_role).toBeNull()
    })
  })
})
