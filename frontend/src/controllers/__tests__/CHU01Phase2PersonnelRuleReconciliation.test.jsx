import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelReviewerRoutingRegistry, {
  REVIEWER_ROLES,
  REVIEWER_SCOPE_TYPES,
  ROUTING_REASON_CODES
} from '../../services/PersonnelReviewerRoutingRegistry.js'
import {
  validatePersonnelPlacement,
  validatePersonnelMasterData,
  formatPersonnelClassification,
  formatEmploymentStatus,
  formatFacultyEngagement
} from '../../utils/personnelPlacement.js'
import hrAdminService from '../../services/hrAdminService.js'
import apiClient from '../../services/apiClient.js'

describe('CHU-01 Phase 2 — Personnel Rule Reconciliation Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // =========================================================================
  // Section 9: Authoritative Remediation Test Matrix T1 – T10
  // =========================================================================
  describe('Authoritative Remediation Matrix T1 – T10', () => {
    it('T1: Faculty + Non-Academic + Permanent -> Valid classification, Route -> HR (CHU-01 Phase 2)', () => {
      // 1. Placement validation
      const placement = validatePersonnelPlacement({
        group: 'faculty',
        side: 'non_academic',
        administrativeUnitId: 'UNIT-HR-001'
      })
      expect(placement.isValid).toBe(true)
      expect(placement.errors).toEqual({})

      // 2. Status validation
      const statusValidation = validatePersonnelMasterData({
        employmentStatus: 'permanent'
      })
      expect(statusValidation.isValid).toBe(true)

      // 3. Routing resolution
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'non_academic'
      })
      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)
      expect(route.target_college_id).toBeNull()
      expect(route.reason_code).toBe(ROUTING_REASON_CODES.ROUTE_ASSIGNED)
    })

    it('T2: Faculty + Non-Academic + Probationary -> Valid classification, Route -> HR (CHU-01 Phase 2)', () => {
      // 1. Placement validation
      const placement = validatePersonnelPlacement({
        group: 'faculty',
        side: 'non_academic',
        administrativeUnitId: 'UNIT-FIN-001'
      })
      expect(placement.isValid).toBe(true)

      // 2. Status validation
      const statusValidation = validatePersonnelMasterData({
        employmentStatus: 'probationary'
      })
      expect(statusValidation.isValid).toBe(true)

      // 3. Routing resolution
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'non_academic'
      })
      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)
      expect(route.reason_code).toBe(ROUTING_REASON_CODES.ROUTE_ASSIGNED)
    })

    it('T3: Non-Teaching Faculty + Academic + Permanent -> Valid classification, Route -> HR (CHU-01 Phase 2)', () => {
      // 1. Placement validation
      const placement = validatePersonnelPlacement({
        group: 'non_teaching_faculty',
        side: 'academic',
        collegeId: 'COLLEGE-CEAC',
        academicProgramIds: ['PROG-BSCS']
      })
      expect(placement.isValid).toBe(true)

      // 2. Status validation
      const statusValidation = validatePersonnelMasterData({
        employmentStatus: 'permanent'
      })
      expect(statusValidation.isValid).toBe(true)

      // 3. Routing resolution
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic',
        college_id: 'COLLEGE-CEAC'
      })
      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)
      expect(route.target_college_id).toBeNull()
      expect(route.reason_code).toBe(ROUTING_REASON_CODES.ROUTE_ASSIGNED)
    })

    it('T4: Non-Teaching Faculty + Academic + Probationary -> Valid classification, Route -> HR (CHU-01 Phase 2)', () => {
      // 1. Placement validation
      const placement = validatePersonnelPlacement({
        group: 'non_teaching_faculty',
        side: 'academic',
        collegeId: 'COLLEGE-CHS',
        academicProgramIds: ['PROG-BSN']
      })
      expect(placement.isValid).toBe(true)

      // 2. Status validation
      const statusValidation = validatePersonnelMasterData({
        employmentStatus: 'probationary'
      })
      expect(statusValidation.isValid).toBe(true)

      // 3. Routing resolution
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic',
        college_id: 'COLLEGE-CHS'
      })
      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)
      expect(route.target_college_id).toBeNull()
      expect(route.reason_code).toBe(ROUTING_REASON_CODES.ROUTE_ASSIGNED)
    })

    it('T5: Faculty + Academic -> Valid classification, Route -> Dean with matching college scope (Plan G / Plan K5 Authority)', () => {
      // 1. Placement validation
      const placement = validatePersonnelPlacement({
        group: 'faculty',
        side: 'academic',
        collegeId: 'COLLEGE-CBA',
        academicProgramIds: ['PROG-BSA']
      })
      expect(placement.isValid).toBe(true)

      // 2. Routing resolution
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'academic',
        college_id: 'COLLEGE-CBA'
      })
      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.COLLEGE_ACADEMIC_SCOPE)
      expect(route.target_college_id).toBe('COLLEGE-CBA')
      expect(route.reason_code).toBe(ROUTING_REASON_CODES.ROUTE_ASSIGNED)
    })

    it('T6: Non-Teaching Faculty + Non-Academic -> Valid classification, Route -> HR (Plan G / Plan K5 Authority)', () => {
      // 1. Placement validation
      const placement = validatePersonnelPlacement({
        group: 'non_teaching_faculty',
        side: 'non_academic',
        administrativeUnitId: 'UNIT-ADMIN-001'
      })
      expect(placement.isValid).toBe(true)

      // 2. Routing resolution
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic'
      })
      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)
      expect(route.target_college_id).toBeNull()
      expect(route.reason_code).toBe(ROUTING_REASON_CODES.ROUTE_ASSIGNED)
    })

    it('T7: Missing personnel type produces validation error and unresolved route', () => {
      const placement = validatePersonnelPlacement({
        group: '',
        side: 'academic',
        collegeId: 'COLLEGE-CEAC',
        academicProgramIds: ['PROG-BSCS']
      })
      expect(placement.isValid).toBe(false)
      expect(placement.errors.personnelGroup).toBeTruthy()

      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: '',
        organizational_side: 'academic'
      })
      expect(route.status).toBe('unresolved')
      expect(route.authorized_reviewer_role).toBeNull()
      expect(route.reason_code).toBe(ROUTING_REASON_CODES.REVIEWER_ROUTE_UNRESOLVED)
    })

    it('T8: Missing organizational side produces unresolved route without default to HR', () => {
      const placement = validatePersonnelPlacement({
        group: 'faculty',
        side: ''
      })
      expect(placement.isValid).toBe(false)
      expect(placement.errors.organizationalSide).toBeTruthy()

      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: ''
      })
      expect(route.status).toBe('unresolved')
      expect(route.authorized_reviewer_role).toBeNull()
      expect(route.reason_code).toBe(ROUTING_REASON_CODES.REVIEWER_ROUTE_UNRESOLVED)
    })

    it('T9: Unsupported personnel type produces validation error', () => {
      const placement = validatePersonnelPlacement({
        group: 'administrative_staff',
        side: 'academic',
        collegeId: 'COLLEGE-CEAC',
        academicProgramIds: ['PROG-BSCS']
      })
      expect(placement.isValid).toBe(false)
      expect(placement.errors.personnelGroup).toContain('faculty')
    })

    it('T10: Classification structural validity is strictly separated from reviewer-route resolution', () => {
      // Valid placement/classification
      const placement = validatePersonnelPlacement({
        group: 'faculty',
        side: 'academic',
        collegeId: 'COLLEGE-CEAC',
        academicProgramIds: ['PROG-BSCS']
      })
      expect(placement.isValid).toBe(true)

      // Routing resolution with incomplete context yields unresolved without invalidating classification structure
      const routeIncomplete = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: '',
        organizational_side: 'academic'
      })
      expect(routeIncomplete.status).toBe('unresolved')
      expect(routeIncomplete.authorized_reviewer_role).toBeNull()
      expect(routeIncomplete.inputs.personnel_group).toBe('')
    })
  })

  // =========================================================================
  // Section 2: Separation of Concepts & Formatting
  // =========================================================================
  describe('Concept Separation & Formatting Rules', () => {
    it('formats personnel classification accurately without exposing raw storage keys', () => {
      expect(formatPersonnelClassification({
        personnel_group: 'faculty',
        organizational_side: 'academic'
      })).toBe('Faculty • Academic')

      expect(formatPersonnelClassification({
        personnel_group: 'faculty',
        organizational_side: 'non_academic'
      })).toBe('Faculty • Non-Academic')

      expect(formatPersonnelClassification({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic'
      })).toBe('Non-Teaching Faculty • Academic')

      expect(formatPersonnelClassification({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic'
      })).toBe('Non-Teaching Faculty • Non-Academic')
    })

    it('maintains faculty engagement separate from employment status', () => {
      expect(formatFacultyEngagement({ faculty_engagement: 'full_time_faculty' })).toBe('Full-time Faculty')
      expect(formatFacultyEngagement({ faculty_engagement: 'part_time_faculty' })).toBe('Part-time Faculty')
      expect(formatEmploymentStatus({ employment_status: 'permanent' })).toBe('Permanent')
      expect(formatEmploymentStatus({ employment_status: 'probationary' })).toBe('Probationary')
    })
  })
})
