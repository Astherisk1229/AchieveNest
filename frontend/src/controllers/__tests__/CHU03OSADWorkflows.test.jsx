import { describe, it, expect, vi, beforeEach } from 'vitest'
import OSADController from '../OSADController'

describe('CHU-03 — OSAD Functional Completion & Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Organization Moderator Assignment & Personnel Query', () => {
    it('returns canonical personnel from OSADController.getPersonnelList', () => {
      const list = OSADController.getPersonnelList()
      expect(Array.isArray(list)).toBe(true)
      expect(list.length).toBeGreaterThan(0)

      const permanentFaculty = list.find(p => p.email === 'faculty.permanent@ndmu.edu.ph')
      expect(permanentFaculty).toBeDefined()
      expect(permanentFaculty.full_name).toBe('Prof. Marco Valdez')
      expect(permanentFaculty.employee_id).toBe('EMP-2026-001')

      const probationaryFaculty = list.find(p => p.email === 'faculty.probationary@ndmu.edu.ph')
      expect(probationaryFaculty).toBeDefined()
      expect(probationaryFaculty.full_name).toBe('Engr. Roberto Cruz')

      const nonteachingAcad = list.find(p => p.email === 'nonteaching.academic@ndmu.edu.ph')
      expect(nonteachingAcad).toBeDefined()
      expect(nonteachingAcad.full_name).toBe('Prof. Grace Tan')

      const nonteachingNonAcad = list.find(p => p.email === 'nonteaching.nonacademic@ndmu.edu.ph')
      expect(nonteachingNonAcad).toBeDefined()
      expect(nonteachingNonAcad.full_name).toBe('Dr. Fernando Alonzo')
    })

    it('filters personnel list by search query keyword', () => {
      const results = OSADController.getPersonnelList('Marco')
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].full_name).toContain('Marco')

      const resultsById = OSADController.getPersonnelList('EMP-2026-002')
      expect(resultsById.length).toBe(1)
      expect(resultsById[0].full_name).toBe('Engr. Roberto Cruz')
    })

    it('creates and records Organization Moderator assignment with audit log', () => {
      const mockOrgId = 'org-01'
      const mockPersonnelId = 'usr-[#16834a]-201'
      const mockPersonnelName = 'Dr. Ana Reyes'

      const assignment = OSADController.assignOrganizationModeratorToOrg(mockOrgId, mockPersonnelId, mockPersonnelName)
      expect(assignment).toBeDefined()
      expect(assignment.organizationId).toBe(mockOrgId)
      expect(assignment.personnelId).toBe(mockPersonnelId)

      // Verify audit log was recorded
      const logs = OSADController.getAuditLogs('', 'ORGANIZATION_MODERATOR_ASSIGNED')
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].details).toContain(mockPersonnelName)
    })
  })

  describe('3. Accreditation Reports & Audit Trail', () => {
    it('returns structured, source-backed accreditation report breakdown', () => {
      const reports = OSADController.getAccreditationReports()
      expect(Array.isArray(reports)).toBe(true)
      expect(reports.length).toBeGreaterThan(0)

      const details = OSADController.getAccreditationReportDetails('rpt-01')
      expect(details).toBeDefined()
      expect(details.total_student_achievements).toBe(412)
      expect(details.total_faculty_accomplishments).toBe(188)
      expect(Array.isArray(details.collegeBreakdown)).toBe(true)
      expect(details.collegeBreakdown.length).toBe(4)

      // Verify college breakdown sums correctly
      const studentTotal = details.collegeBreakdown.reduce((sum, col) => sum + col.student_records, 0)
      expect(studentTotal).toBe(412)
    })

    it('records and retrieves sanitized audit logs with category filtering', () => {
      OSADController.addAuditLog(
        'TEST_ACTION',
        'Verified student achievement record',
        'Juan Dela Cruz',
        'SUCCESS'
      )

      const allLogs = OSADController.getAuditLogs()
      expect(allLogs.length).toBeGreaterThan(0)

      const filteredLogs = OSADController.getAuditLogs('Juan', 'TEST_ACTION')
      expect(filteredLogs.length).toBeGreaterThan(0)
      expect(filteredLogs[0].action_type).toBe('TEST_ACTION')
      expect(filteredLogs[0].target_entity).toBe('Juan Dela Cruz')
    })
  })
})
