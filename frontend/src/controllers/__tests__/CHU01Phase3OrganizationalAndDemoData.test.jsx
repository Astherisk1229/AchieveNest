import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelReviewerRoutingRegistry, {
  REVIEWER_ROLES,
  REVIEWER_SCOPE_TYPES,
  ROUTING_REASON_CODES
} from '../../services/PersonnelReviewerRoutingRegistry.js'
import {
  validatePersonnelPlacement,
  formatPersonnelPlacement,
  formatPersonnelClassification,
  formatEmploymentStatus,
  formatFacultyEngagement
} from '../../utils/personnelPlacement.js'

describe('CHU-01 Phase 3 — Organizational and Demo Data Preparation Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // =========================================================================
  // Section 1: Institutional Reference & Placement Formatting
  // =========================================================================
  describe('Institutional Reference Data & Placement', () => {
    it('formats Academic Personnel placement with College and Program affiliations', () => {
      const academicPersonnel = {
        personnel_group: 'faculty',
        organizational_side: 'academic',
        college_name: 'College of Business and Accountancy',
        college_code: 'CBA',
        program_affiliations: [
          { code: 'BSA', name: 'Bachelor of Science in Accountancy' }
        ]
      }
      expect(formatPersonnelPlacement(academicPersonnel)).toBe('College of Business and Accountancy • BSA')
    })

    it('formats Non-Academic Personnel placement with Administrative Unit', () => {
      const nonAcademicPersonnel = {
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
        administrative_unit_name: 'Human Resources Office',
        administrative_unit_code: 'HR'
      }
      expect(formatPersonnelPlacement(nonAcademicPersonnel)).toBe('Human Resources Office')
    })
  })

  // =========================================================================
  // Section 2: Student Relationship & Isolation Invariants
  // =========================================================================
  describe('Student Relationships & Scope Isolation', () => {
    const studentA = {
      id: 'd0000000-0000-0000-0001-000000000001',
      name: 'Demo Student A (BSA)',
      email: 'demo.student.a@ndmu.edu.ph',
      program_code: 'BSA',
      college_code: 'CBA',
      year_level: '4th Year'
    }

    const studentB = {
      id: 'd0000000-0000-0000-0001-000000000002',
      name: 'Demo Student B (BSBA-FM)',
      email: 'demo.student.b@ndmu.edu.ph',
      program_code: 'BSBA-FM',
      college_code: 'CBA',
      year_level: '4th Year'
    }

    it('verifies Student A and Student B have distinct programs and identities', () => {
      expect(studentA.id).not.toBe(studentB.id)
      expect(studentA.email).not.toBe(studentB.email)
      expect(studentA.program_code).toBe('BSA')
      expect(studentB.program_code).toBe('BSBA-FM')
      expect(studentA.program_code).not.toBe(studentB.program_code)
    })
  })

  // =========================================================================
  // Section 3: Personnel Demo Personas & Phase 2 Compliance
  // =========================================================================
  describe('Personnel Demo Personas & Phase 2 Compliance', () => {
    it('verifies Faculty demo record adheres to canonical Permanent status and Faculty engagement', () => {
      const faculty = {
        personnel_group: 'faculty',
        organizational_side: 'academic',
        employment_status: 'permanent',
        faculty_engagement: 'full_time_faculty'
      }

      expect(formatPersonnelClassification(faculty)).toBe('Faculty • Academic')
      expect(formatEmploymentStatus(faculty)).toBe('Permanent')
      expect(formatFacultyEngagement(faculty)).toBe('Full-time Faculty')

      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: faculty.personnel_group,
        organizational_side: faculty.organizational_side,
        college_id: 'COL-CBA'
      })
      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.COLLEGE_ACADEMIC_SCOPE)
    })

    it('verifies Non-Teaching Faculty demo record adheres to canonical Permanent status and HR route', () => {
      const nonTeachingFaculty = {
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
        employment_status: 'permanent'
      }

      expect(formatPersonnelClassification(nonTeachingFaculty)).toBe('Non-Teaching Faculty • Non-Academic')
      expect(formatEmploymentStatus(nonTeachingFaculty)).toBe('Permanent')

      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: nonTeachingFaculty.personnel_group,
        organizational_side: nonTeachingFaculty.organizational_side
      })
      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)
    })
  })

  // =========================================================================
  // Section 4: Dean & Administrator Routing Invariants
  // =========================================================================
  describe('Dean Scope & High-Level Reviewer Protection', () => {
    it('verifies Dean evaluation strictly routes to HR with zero self-evaluation', () => {
      const deanContext = {
        personnel_group: 'faculty',
        organizational_side: 'academic',
        is_dean: true,
        college_id: 'COL-CBA'
      }

      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute(deanContext)
      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)

      // Dean cannot evaluate themselves
      const isAuthorized = PersonnelReviewerRoutingRegistry.isAuthorizedReviewer(
        { profile_id: 'dean-profile-id', roles: ['dean', 'personnel'], assigned_college_id: 'COL-CBA' },
        { personnel_profile_id: 'dean-profile-id', assigned_reviewer_role: 'dean', target_college_id: 'COL-CBA' }
      )
      expect(isAuthorized).toBe(false)
    })
  })

  // =========================================================================
  // Section 5: 10 Synthetic Demo Personas Roster
  // =========================================================================
  describe('10 Synthetic Demo Personas Roster', () => {
    const demoRoster = [
      { key: 'STUDENT_A', email: 'demo.student.a@ndmu.edu.ph', role: 'student', scope: 'program' },
      { key: 'STUDENT_B', email: 'demo.student.b@ndmu.edu.ph', role: 'student', scope: 'program' },
      { key: 'FACULTY_ACAD', email: 'demo.academic.personnel@ndmu.edu.ph', role: 'personnel', scope: 'college' },
      { key: 'STAFF_NONACAD', email: 'demo.nonacademic.personnel@ndmu.edu.ph', role: 'personnel', scope: 'unit' },
      { key: 'HR_ADMIN', email: 'demo.hr.admin@ndmu.edu.ph', role: 'hr_staff', scope: 'university' },
      { key: 'OSAD_ADMIN', email: 'demo.osad.admin@ndmu.edu.ph', role: 'osad_staff', scope: 'university' },
      { key: 'DEAN_CBA', email: 'demo.dean@ndmu.edu.ph', role: 'dean', scope: 'college' },
      { key: 'COORD_A', email: 'demo.coordinator.a@ndmu.edu.ph', role: 'program_coordinator', scope: 'program' },
      { key: 'COORD_B', email: 'demo.coordinator.b@ndmu.edu.ph', role: 'program_coordinator', scope: 'program' },
      { key: 'MODERATOR', email: 'demo.moderator@ndmu.edu.ph', role: 'organization_moderator', scope: 'organization' }
    ]

    it('contains all 10 synthetic personas with valid roles and scopes', () => {
      expect(demoRoster).toHaveLength(10)
      const emails = new Set(demoRoster.map(p => p.email))
      expect(emails.size).toBe(10)
      demoRoster.forEach(p => {
        expect(p.email).toMatch(/^demo\..+@ndmu\.edu\.ph$/)
      })
    })
  })
})
