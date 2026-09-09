import { describe, it, expect } from 'vitest'
import PersonnelReviewerAssignmentService, {
  EVALUATION_STATUSES,
  ASSIGNMENT_STATUSES
} from '../../services/PersonnelReviewerAssignmentService.js'
import {
  REVIEWER_ROLES,
  ROUTING_REASON_CODES
} from '../../services/PersonnelReviewerRoutingRegistry.js'

describe('Personnel Evaluation Track — Plan G — Phase G1: Reviewer Routing, Queue Assignment & In-Evaluation Suite', () => {

  const mockDirectory = {
    deans_by_college: {
      'COLLEGE-CEAC': { id: 'USER-DEAN-CEAC', full_name: 'Dean CEAC', college_id: 'COLLEGE-CEAC' },
      'COLLEGE-CBA': { id: 'USER-DEAN-CBA', full_name: 'Dean CBA', college_id: 'COLLEGE-CBA' },
      'COLLEGE-CHS': { id: 'USER-DEAN-CHS', full_name: 'Dean CHS', college_id: 'COLLEGE-CHS' }
    },
    hr_staff_list: [
      { id: 'USER-HR-1', full_name: 'HR Evaluator One' },
      { id: 'USER-HR-2', full_name: 'HR Evaluator Two' }
    ]
  }

  // =========================================================================
  // 1. Canonical Reviewer Actor Binding & Routing
  // =========================================================================
  describe('1. Reviewer Actor Binding & Canonical Routing', () => {
    it('assigns active Dean for Faculty + Academic within college scope', () => {
      const evaluation = {
        evaluation_id: 'EVAL-FAC-01',
        personnel_profile_id: 'USER-FACULTY-1',
        personnel_group: 'faculty',
        organizational_side: 'academic',
        college_id: 'COLLEGE-CEAC',
        status: EVALUATION_STATUSES.SUBMITTED
      }

      const assignment = PersonnelReviewerAssignmentService.assignReviewer(evaluation, mockDirectory)
      expect(assignment.assignment_status).toBe(ASSIGNMENT_STATUSES.ASSIGNED)
      expect(assignment.assigned_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
      expect(assignment.evaluator_profile_id).toBe('USER-DEAN-CEAC')
      expect(assignment.evaluator_college_id).toBe('COLLEGE-CEAC')
      expect(assignment.reason_code).toBe(ROUTING_REASON_CODES.ROUTE_ASSIGNED)
    })

    it('assigns active Dean for Non-Teaching Faculty + Academic within college scope', () => {
      const evaluation = {
        evaluation_id: 'EVAL-NT-ACAD-01',
        personnel_profile_id: 'USER-NT-ACAD-1',
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic',
        college_id: 'COLLEGE-CBA',
        status: EVALUATION_STATUSES.SUBMITTED
      }

      const assignment = PersonnelReviewerAssignmentService.assignReviewer(evaluation, mockDirectory)
      expect(assignment.assignment_status).toBe(ASSIGNMENT_STATUSES.ASSIGNED)
      expect(assignment.assigned_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
      expect(assignment.evaluator_profile_id).toBe('USER-DEAN-CBA')
      expect(assignment.evaluator_college_id).toBe('COLLEGE-CBA')
    })

    it('assigns HR Staff for Non-Teaching Faculty + Non-Academic', () => {
      const evaluation = {
        evaluation_id: 'EVAL-NT-NONACAD-01',
        personnel_profile_id: 'USER-NT-NONACAD-1',
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
        status: EVALUATION_STATUSES.SUBMITTED
      }

      const assignment = PersonnelReviewerAssignmentService.assignReviewer(evaluation, mockDirectory)
      expect(assignment.assignment_status).toBe(ASSIGNMENT_STATUSES.ASSIGNED)
      expect(assignment.assigned_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(assignment.evaluator_profile_id).toBe('USER-HR-1')
      expect(assignment.evaluator_college_id).toBeNull()
    })

    it('assigns HR Staff for Dean evaluations and prevents self-review', () => {
      const evaluation = {
        evaluation_id: 'EVAL-DEAN-01',
        personnel_profile_id: 'USER-DEAN-CEAC', // Dean candidate
        personnel_group: 'faculty',
        organizational_side: 'academic',
        is_dean: true,
        college_id: 'COLLEGE-CEAC',
        status: EVALUATION_STATUSES.SUBMITTED
      }

      const assignment = PersonnelReviewerAssignmentService.assignReviewer(evaluation, mockDirectory)
      expect(assignment.assignment_status).toBe(ASSIGNMENT_STATUSES.ASSIGNED)
      expect(assignment.assigned_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(assignment.evaluator_profile_id).toBe('USER-HR-1')
    })

    it('assigns HR Staff for VP for Academics evaluations', () => {
      const evaluation = {
        evaluation_id: 'EVAL-VPA-01',
        personnel_profile_id: 'USER-VP-ACAD',
        personnel_group: 'faculty',
        organizational_side: 'academic',
        is_vp_academics: true,
        status: EVALUATION_STATUSES.SUBMITTED
      }

      const assignment = PersonnelReviewerAssignmentService.assignReviewer(evaluation, mockDirectory)
      expect(assignment.assignment_status).toBe(ASSIGNMENT_STATUSES.ASSIGNED)
      expect(assignment.assigned_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(assignment.evaluator_profile_id).toBe('USER-HR-1')
    })

    it('assigns HR Staff for VP for Administration evaluations', () => {
      const evaluation = {
        evaluation_id: 'EVAL-VPADMIN-01',
        personnel_profile_id: 'USER-VP-ADMIN',
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
        is_vp_administration: true,
        status: EVALUATION_STATUSES.SUBMITTED
      }

      const assignment = PersonnelReviewerAssignmentService.assignReviewer(evaluation, mockDirectory)
      expect(assignment.assignment_status).toBe(ASSIGNMENT_STATUSES.ASSIGNED)
      expect(assignment.assigned_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(assignment.evaluator_profile_id).toBe('USER-HR-1')
    })
  })

  // =========================================================================
  // 2. Unresolved Routing & No HR Catch-All Fallback
  // =========================================================================
  describe('2. Unresolved Routing Protection & Missing Dean Handling', () => {
    it('marks assignment as unresolved when active Dean is missing (does NOT fall back to HR)', () => {
      const evaluation = {
        evaluation_id: 'EVAL-MISSING-DEAN',
        personnel_profile_id: 'USER-FACULTY-UNASSIGNED',
        personnel_group: 'faculty',
        organizational_side: 'academic',
        college_id: 'COLLEGE-LAW', // No Dean registered in mock directory
        status: EVALUATION_STATUSES.SUBMITTED
      }

      const assignment = PersonnelReviewerAssignmentService.assignReviewer(evaluation, mockDirectory)
      expect(assignment.assignment_status).toBe(ASSIGNMENT_STATUSES.UNRESOLVED)
      expect(assignment.assigned_reviewer_role).toBeNull()
      expect(assignment.evaluator_profile_id).toBeNull()
      expect(assignment.reason_code).toBe('dean_assignment_missing')
      expect(assignment.routing_reason).toContain('HR fallback is prohibited')
    })

    it('marks assignment as unresolved for unsupported personnel combinations', () => {
      const evaluation = {
        evaluation_id: 'EVAL-INVALID-COMBO',
        personnel_profile_id: 'USER-INVALID-1',
        personnel_group: 'faculty',
        organizational_side: 'non_academic',
        status: EVALUATION_STATUSES.SUBMITTED
      }

      const assignment = PersonnelReviewerAssignmentService.assignReviewer(evaluation, mockDirectory)
      expect(assignment.assignment_status).toBe(ASSIGNMENT_STATUSES.UNRESOLVED)
      expect(assignment.reason_code).toBe(ROUTING_REASON_CODES.REVIEWER_ROUTE_UNRESOLVED)
    })
  })

  // =========================================================================
  // 3. Self-Review Prevention & Department Secretary Exclusion
  // =========================================================================
  describe('3. Self-Review & Role Access Constraints', () => {
    it('strictly prohibits candidate from reviewing their own evaluation', () => {
      const actor = { profile_id: 'USER-FACULTY-1', roles: ['dean'], assigned_college_id: 'COLLEGE-CEAC' }
      const evaluation = {
        personnel_profile_id: 'USER-FACULTY-1', // Same ID!
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_college_id: 'COLLEGE-CEAC'
      }

      const canAccess = PersonnelReviewerAssignmentService.canReviewerAccessEvaluation(actor, evaluation)
      expect(canAccess).toBe(false)
    })

    it('selects alternate HR evaluator when candidate is an HR staff evaluator', () => {
      const evaluation = {
        evaluation_id: 'EVAL-HR-STAFF-1',
        personnel_profile_id: 'USER-HR-1', // Evaluated candidate is HR-1
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
        status: EVALUATION_STATUSES.SUBMITTED
      }

      const assignment = PersonnelReviewerAssignmentService.assignReviewer(evaluation, mockDirectory)
      expect(assignment.assignment_status).toBe(ASSIGNMENT_STATUSES.ASSIGNED)
      expect(assignment.evaluator_profile_id).toBe('USER-HR-2') // Successfully picked alternate evaluator HR-2
    })

    it('strictly denies Department Secretary access to evaluator queues', () => {
      const actor = { profile_id: 'USER-DEP-SEC', roles: ['department_secretary'] }
      const evaluation = {
        personnel_profile_id: 'USER-FACULTY-1',
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_college_id: 'COLLEGE-CEAC'
      }

      const canAccess = PersonnelReviewerAssignmentService.canReviewerAccessEvaluation(actor, evaluation)
      expect(canAccess).toBe(false)

      const queue = PersonnelReviewerAssignmentService.filterReviewerQueue([evaluation], actor)
      expect(queue).toHaveLength(0)
    })
  })

  // =========================================================================
  // 4. Dean and HR Reviewer Queue Scope Isolation
  // =========================================================================
  describe('4. Reviewer Queue Filtering & Scope Isolation', () => {
    const masterEvaluations = [
      {
        evaluation_id: 'EVAL-CEAC-1',
        personnel_name: 'Dr. CEAC Faculty',
        personnel_profile_id: 'FAC-1',
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_college_id: 'COLLEGE-CEAC',
        evaluation_status: EVALUATION_STATUSES.SUBMITTED
      },
      {
        evaluation_id: 'EVAL-CBA-1',
        personnel_name: 'Prof. CBA Faculty',
        personnel_profile_id: 'FAC-2',
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_college_id: 'COLLEGE-CBA',
        evaluation_status: EVALUATION_STATUSES.SUBMITTED
      },
      {
        evaluation_id: 'EVAL-HR-NT-1',
        personnel_name: 'Admin Non-Teaching',
        personnel_profile_id: 'NT-1',
        assigned_reviewer_role: REVIEWER_ROLES.HR,
        evaluator_college_id: null,
        evaluation_status: EVALUATION_STATUSES.SUBMITTED
      },
      {
        evaluation_id: 'EVAL-HR-DEAN-1',
        personnel_name: 'Dean CEAC Evaluation',
        personnel_profile_id: 'USER-DEAN-CEAC',
        assigned_reviewer_role: REVIEWER_ROLES.HR,
        evaluator_college_id: null,
        evaluation_status: EVALUATION_STATUSES.SUBMITTED
      }
    ]

    it('populates Dean CEAC queue with ONLY CEAC evaluations and excludes CBA, Non-Teaching, and Dean evaluations', () => {
      const deanCEAC = {
        profile_id: 'USER-DEAN-CEAC',
        roles: ['dean'],
        assigned_college_id: 'COLLEGE-CEAC'
      }

      const queue = PersonnelReviewerAssignmentService.filterReviewerQueue(masterEvaluations, deanCEAC)
      expect(queue).toHaveLength(1)
      expect(queue[0].evaluation_id).toBe('EVAL-CEAC-1')
    })

    it('populates HR queue with Non-Academic and Dean evaluations, excluding academic faculty', () => {
      const hrActor = {
        profile_id: 'USER-HR-1',
        roles: ['hr_staff']
      }

      const queue = PersonnelReviewerAssignmentService.filterReviewerQueue(masterEvaluations, hrActor)
      expect(queue).toHaveLength(2)
      expect(queue.map(e => e.evaluation_id)).toEqual(['EVAL-HR-NT-1', 'EVAL-HR-DEAN-1'])
    })
  })

  // =========================================================================
  // 5. Submitted -> In-Evaluation State Transition
  // =========================================================================
  describe('5. Submitted -> In-Evaluation Transition & Handoff', () => {
    it('transitions a valid assigned evaluation from submitted to in_evaluation', () => {
      const assignment = {
        evaluation_id: 'EVAL-101',
        assignment_status: ASSIGNMENT_STATUSES.ASSIGNED,
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_profile_id: 'USER-DEAN-CEAC',
        evaluation_status: EVALUATION_STATUSES.SUBMITTED
      }

      const activeReview = PersonnelReviewerAssignmentService.transitionToInEvaluation(assignment)
      expect(activeReview.evaluation_status).toBe(EVALUATION_STATUSES.IN_EVALUATION)
      expect(activeReview.in_evaluation_started_at).toBeDefined()
    })

    it('blocks transition to in_evaluation when reviewer assignment is unresolved', () => {
      const unresolvedAssignment = {
        evaluation_id: 'EVAL-102',
        assignment_status: ASSIGNMENT_STATUSES.UNRESOLVED,
        routing_reason: 'Dean assignment missing',
        evaluation_status: EVALUATION_STATUSES.SUBMITTED
      }

      expect(() => {
        PersonnelReviewerAssignmentService.transitionToInEvaluation(unresolvedAssignment)
      }).toThrow(/Cannot transition evaluation to \[in_evaluation\]: Reviewer assignment is unresolved/i)
    })
  })

  // =========================================================================
  // 6. Client Tampering & Security Rejections
  // =========================================================================
  describe('6. Client Tampering & Security Rejections', () => {
    it('detects and rejects client-supplied forged reviewer role', () => {
      const canonicalAssignment = {
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_profile_id: 'USER-DEAN-CEAC',
        evaluator_college_id: 'COLLEGE-CEAC'
      }

      const forgedPayload = {
        assigned_reviewer_role: REVIEWER_ROLES.HR // Client trying to switch reviewer to HR
      }

      expect(() => {
        PersonnelReviewerAssignmentService.validateClientTampering(forgedPayload, canonicalAssignment)
      }).toThrow(/Tampering detected: Client-supplied reviewer role/i)
    })

    it('detects and rejects client-supplied forged evaluator ID', () => {
      const canonicalAssignment = {
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_profile_id: 'USER-DEAN-CEAC',
        evaluator_college_id: 'COLLEGE-CEAC'
      }

      const forgedPayload = {
        evaluator_profile_id: 'USER-FAKE-EVALUATOR' // Client trying to point to friendly evaluator
      }

      expect(() => {
        PersonnelReviewerAssignmentService.validateClientTampering(forgedPayload, canonicalAssignment)
      }).toThrow(/Tampering detected: Client-supplied evaluator ID/i)
    })
  })
})
