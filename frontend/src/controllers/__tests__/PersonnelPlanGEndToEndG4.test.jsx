import { describe, it, expect } from 'vitest'
import PersonnelReviewerRoutingRegistry, {
  REVIEWER_ROLES,
  ROUTING_REASON_CODES
} from '../../services/PersonnelReviewerRoutingRegistry.js'
import PersonnelReviewerAssignmentService from '../../services/PersonnelReviewerAssignmentService.js'
import PersonnelEvaluatorWorkspaceService from '../../services/PersonnelEvaluatorWorkspaceService.js'
import PersonnelEvaluatorScoringService from '../../services/PersonnelEvaluatorScoringService.js'
import PersonnelEvaluationPlanHHandoffService, {
  HANDOFF_STATUSES,
  HANDOFF_REASON_CODES
} from '../../services/PersonnelEvaluationPlanHHandoffService.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from '../../services/evaluationInstrumentRegistry.js'

describe('Personnel Evaluation Track — Plan G — Phase G4: Reviewer Workflow Validation, End-to-End Integration & Plan H Handoff', () => {
  // Test Fixtures
  const facultyAcademicContext = {
    personnel_group: 'faculty',
    organizational_side: 'academic',
    college_id: 'CEAC',
    college_code: 'CEAC',
    is_tenured: true,
    workload_type: 'full_time'
  }

  const nonTeachingAcademicContext = {
    personnel_group: 'non_teaching_faculty',
    organizational_side: 'academic',
    college_id: 'CEAC',
    college_code: 'CEAC'
  }

  const nonTeachingNonAcademicContext = {
    personnel_group: 'non_teaching_faculty',
    organizational_side: 'non_academic'
  }

  const deanContext = {
    personnel_group: 'faculty',
    organizational_side: 'academic',
    is_dean: true,
    college_id: 'CEAC'
  }

  const vpAcademicsContext = {
    personnel_group: 'faculty',
    organizational_side: 'academic',
    is_vp_academics: true
  }

  const vpAdminContext = {
    personnel_group: 'non_teaching_faculty',
    organizational_side: 'non_academic',
    is_vp_admin: true
  }

  const deanCEAC = {
    profile_id: 'usr_dean_ceac',
    roles: ['dean'],
    assigned_college_id: 'CEAC'
  }

  const deanCBA = {
    profile_id: 'usr_dean_cba',
    roles: ['dean'],
    assigned_college_id: 'CBA'
  }

  const hrEvaluator = {
    profile_id: 'usr_hr_001',
    roles: ['hr_staff']
  }

  const departmentSecretary = {
    profile_id: 'usr_sec_001',
    roles: ['department_secretary']
  }

  const candidateFaculty = {
    profile_id: 'usr_fac_001',
    roles: ['faculty']
  }

  const directoryContext = {
    deans_by_college: {
      CEAC: { profile_id: 'usr_dean_ceac', full_name: 'Dr. CEAC Dean' },
      CBA: { profile_id: 'usr_dean_cba', full_name: 'Dr. CBA Dean' }
    },
    hr_staff_list: [
      { profile_id: 'usr_hr_001', full_name: 'HR Evaluator' }
    ]
  }

  const createAdminSnapshot = () => ({
    snapshot_version: 'v1.0.0',
    items: [
      {
        id: 'item_a1',
        area: 'A',
        criterion_code: 'A.1',
        category: 'A.1 Doctorate Degree',
        raw_points: 60.0,
        criterion_capped_points: 60.0,
        evaluator_judgment_required: false,
        accepted_points: null,
        fileName: 'phd_diploma.pdf'
      },
      {
        id: 'item_b3',
        area: 'B',
        criterion_code: 'B.3',
        category: 'B.3 Conduct of Research',
        raw_points: 40.0,
        criterion_capped_points: 40.0,
        evaluator_judgment_required: true,
        accepted_points: null,
        fileName: 'research_publication.pdf'
      },
      {
        id: 'item_b6',
        area: 'B',
        criterion_code: 'B.6',
        category: 'B.6 Creative Work',
        raw_points: 20.0,
        criterion_capped_points: 20.0,
        evaluator_judgment_required: true,
        accepted_points: null,
        fileName: 'creative_portfolio.pdf'
      },
      {
        id: 'item_c1',
        area: 'C',
        criterion_code: 'C.1',
        category: 'C.1 Community Outreach',
        raw_points: 30.0,
        criterion_capped_points: 30.0,
        evaluator_judgment_required: false,
        accepted_points: null,
        fileName: 'outreach_cert.pdf'
      }
    ]
  })

  const createNonTeachingSnapshot = () => ({
    snapshot_version: 'v1.0.0',
    items: [
      {
        id: 'item_nt_b1',
        area: 'B',
        criterion_code: 'B.1',
        category: 'B.1 Service Years',
        raw_points: 20.0,
        criterion_capped_points: 20.0,
        evaluator_judgment_required: false,
        accepted_points: null,
        fileName: 'service_record.pdf'
      },
      {
        id: 'item_nt_b5',
        area: 'B',
        criterion_code: 'B.5',
        category: 'B.5 Recognition / Meritorious Award',
        raw_points: 30.0,
        criterion_capped_points: 30.0,
        evaluator_judgment_required: true,
        accepted_points: null,
        fileName: 'award_certificate.pdf'
      }
    ]
  })

  // 1. Canonical Reviewer Routing Regression
  describe('1. Canonical Reviewer Routing Matrix (G0/G1)', () => {
    it('routes Faculty + Academic to College Dean', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute(facultyAcademicContext)
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
    })

    it('routes Non-Teaching Faculty + Academic to College Dean', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute(nonTeachingAcademicContext)
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
    })

    it('routes Non-Teaching Faculty + Non-Academic to HR', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute(nonTeachingNonAcademicContext)
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
    })

    it('routes Dean, VP Academics, and VP Admin to HR', () => {
      expect(PersonnelReviewerRoutingRegistry.resolveReviewerRoute(deanContext).authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(PersonnelReviewerRoutingRegistry.resolveReviewerRoute(vpAcademicsContext).authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(PersonnelReviewerRoutingRegistry.resolveReviewerRoute(vpAdminContext).authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
    })

    it('excludes Department Secretary and Candidate Self-Review from reviewer routing', () => {
      const isSecAuthorized = PersonnelReviewerRoutingRegistry.isAuthorizedReviewer(
        departmentSecretary,
        { assigned_reviewer_role: REVIEWER_ROLES.DEAN, target_college_id: 'CEAC', personnel_profile_id: 'usr_fac_001' }
      )
      expect(isSecAuthorized).toBe(false)

      const isSelfAuthorized = PersonnelReviewerRoutingRegistry.isAuthorizedReviewer(
        candidateFaculty,
        { assigned_reviewer_role: REVIEWER_ROLES.DEAN, target_college_id: 'CEAC', personnel_profile_id: 'usr_fac_001' }
      )
      expect(isSelfAuthorized).toBe(false)
    })
  })

  // 2. Reviewer Assignment & Queue Scope Regression
  describe('2. Reviewer Assignment & Queue Scope (G1)', () => {
    it('creates canonical Dean assignment in in_evaluation status', () => {
      const record = {
        id: 'eval_001',
        personnel_profile_id: 'usr_fac_001',
        status: 'submitted',
        ...facultyAcademicContext
      }
      const assignment = PersonnelReviewerAssignmentService.assignReviewer(record, directoryContext)
      expect(assignment.assigned_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
      expect(assignment.evaluator_college_id).toBe('CEAC')

      const inEvalAssignment = PersonnelReviewerAssignmentService.transitionToInEvaluation(assignment)
      expect(inEvalAssignment.evaluation_status).toBe('in_evaluation')
    })

    it('filters reviewer queues strictly by authorized scope', () => {
      const evaluations = [
        { id: 'eval_1', assigned_reviewer_role: REVIEWER_ROLES.DEAN, target_college_id: 'CEAC', evaluator_college_id: 'CEAC', evaluation_status: 'in_evaluation' },
        { id: 'eval_2', assigned_reviewer_role: REVIEWER_ROLES.DEAN, target_college_id: 'CBA', evaluator_college_id: 'CBA', evaluation_status: 'in_evaluation' },
        { id: 'eval_3', assigned_reviewer_role: REVIEWER_ROLES.HR, evaluation_status: 'in_evaluation' }
      ]

      const deanCEACQueue = PersonnelReviewerAssignmentService.filterReviewerQueue(evaluations, deanCEAC)
      expect(deanCEACQueue.length).toBe(1)
      expect(deanCEACQueue[0].id).toBe('eval_1')

      const hrQueue = PersonnelReviewerAssignmentService.filterReviewerQueue(evaluations, hrEvaluator)
      expect(hrQueue.length).toBe(1)
      expect(hrQueue[0].id).toBe('eval_3')
    })
  })

  // 3. Evaluator Workspace & Snapshot Integrity Regression
  describe('3. Evaluator Workspace & Snapshot Integrity (G2)', () => {
    it('loads submitted Plan C snapshot and enforces read-only immutability', () => {
      const evaluation = {
        id: 'eval_adm_001',
        personnel_profile_id: 'usr_fac_001',
        evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        assigned_reviewer_role: 'dean',
        evaluator_college_id: 'CEAC',
        target_college_id: 'CEAC',
        evaluation_status: 'in_evaluation'
      }
      const snapshot = createAdminSnapshot()
      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanCEAC, snapshot)

      expect(workspace.personnel_context.personnel_profile_id).toBe('usr_fac_001')
      expect(workspace.areas.AREA_A.items.length).toBe(1)
      expect(workspace.areas.AREA_B.items.length).toBe(2)
      expect(workspace.areas.AREA_C.items.length).toBe(1)
      expect(workspace.scale_context.pending_judgment_count).toBe(2) // B.3 & B.6
    })

    it('denies cross-college Dean access to evaluation workspace (403)', () => {
      const evaluation = {
        id: 'eval_adm_001',
        personnel_profile_id: 'usr_fac_001',
        assigned_reviewer_role: 'dean',
        evaluator_college_id: 'CEAC',
        target_college_id: 'CEAC',
        evaluation_status: 'in_evaluation'
      }
      const snapshot = createAdminSnapshot()
      expect(() => {
        PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanCBA, snapshot)
      }).toThrow(/Cross-college access prohibited/i)
    })
  })

  // 4. Evaluator Scoring & Non-Teaching Area A Inputs
  describe('4. Official Accepted-Point Entry & Area A Inputs (G3)', () => {
    it('enforces judgment criteria caps, explicit zero, and deterministic score protection', () => {
      const evaluation = {
        id: 'eval_adm_001',
        personnel_profile_id: 'usr_fac_001',
        evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        assigned_reviewer_role: 'dean',
        evaluator_college_id: 'CEAC',
        target_college_id: 'CEAC',
        evaluation_status: 'in_evaluation'
      }
      const snapshot = createAdminSnapshot()

      // Reject arbitrary override on deterministic A.1
      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: evaluation,
          reviewerActor: deanCEAC,
          snapshotData: snapshot,
          itemId: 'item_a1',
          acceptedPoints: 80.0
        })
      }).toThrow(/Arbitrary override of deterministic Plan F scoring is prohibited/i)

      // Reject out-of-bounds judgment on B.3 (>40.0)
      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: evaluation,
          reviewerActor: deanCEAC,
          snapshotData: snapshot,
          itemId: 'item_b3',
          acceptedPoints: 45.0
        })
      }).toThrow(/exceeds maximum allowed \[40\]/i)

      // Accept valid judgment on B.3 = 35.0
      PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: evaluation,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 35.0
      })
      expect(snapshot.items[1].accepted_points).toBe(35.0)

      // Accept explicit 0.0 on B.6
      PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: evaluation,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b6',
        acceptedPoints: 0.0
      })
      expect(snapshot.items[2].accepted_points).toBe(0.0)
      expect(snapshot.items[2].scoring_status).toBe('scored')
    })

    it('captures Non-Teaching Area A rating inputs within component bounds', () => {
      const evaluation = {
        id: 'eval_nt_001',
        personnel_profile_id: 'usr_staff_001',
        evaluation_scale_code: EVALUATION_SCALE_CODES.NON_TEACHING,
        assigned_reviewer_role: 'hr',
        evaluation_status: 'in_evaluation'
      }

      const res = PersonnelEvaluatorScoringService.submitNonTeachingAreaAInput({
        evaluationRecord: evaluation,
        reviewerActor: hrEvaluator,
        areaAInputs: {
          job_performance: 48.0,
          personal_attitudes: 10.0,
          efficiency: 27.0
        }
      })

      expect(res.success).toBe(true)
      expect(res.area_a_inputs.total_area_a).toBe(85.0)
      expect(res.area_a_inputs.is_complete).toBe(true)
    })
  })

  // 5. Scoring Completion & Plan F Result Integration
  describe('5. Scoring Completion & Plan F Result Determination (G3/F5)', () => {
    it('determines Passed for Administrators scale once all judgment items resolved and score >= 120', () => {
      const evaluation = {
        id: 'eval_adm_001',
        personnel_profile_id: 'usr_fac_001',
        personnel_name: 'Dr. Maria Santos',
        current_rank: 'Associate Professor II',
        evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        assigned_reviewer_role: 'dean',
        evaluator_college_id: 'CEAC',
        target_college_id: 'CEAC',
        evaluation_status: 'in_evaluation'
      }
      const snapshot = createAdminSnapshot()

      // Score A = 60, B.3 = 35, B.6 = 15, C = 30 -> Total = 60 + 50(capped) + 30 = 140
      PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: evaluation,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 35.0
      })
      const finalState = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: evaluation,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b6',
        acceptedPoints: 15.0
      })

      expect(finalState.scoring_complete).toBe(true)
      expect(finalState.official_accepted_total).toBe(140.0)
      expect(finalState.plan_f_result_status).toBe('result_ready')
      expect(finalState.plan_f_final_result).toBe('Passed')
    })
  })

  // 6. Plan H Handoff Readiness & Boundary
  describe('6. Plan H Handoff Readiness & Boundary (G4)', () => {
    it('blocks Plan H handoff when scoring is incomplete', () => {
      const evaluation = {
        id: 'eval_adm_001',
        personnel_profile_id: 'usr_fac_001',
        evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        assigned_reviewer_role: 'dean',
        evaluation_status: 'in_evaluation'
      }
      const snapshot = createAdminSnapshot() // B.3 & B.6 null

      const readiness = PersonnelEvaluationPlanHHandoffService.checkHandoffReadiness({
        evaluationRecord: evaluation,
        snapshotData: snapshot
      })

      expect(readiness.is_ready).toBe(false)
      expect(readiness.reason_code).toBe(HANDOFF_REASON_CODES.SCORING_INCOMPLETE)

      expect(() => {
        PersonnelEvaluationPlanHHandoffService.generatePlanHHandoffPayload({
          evaluationRecord: evaluation,
          snapshotData: snapshot
        })
      }).toThrow(/Cannot generate Plan H handoff payload/i)
    })

    it('generates clean Plan H handoff payload when scoring is complete', () => {
      const evaluation = {
        id: 'eval_adm_001',
        personnel_profile_id: 'usr_fac_001',
        personnel_name: 'Dr. Maria Santos',
        current_rank: 'Associate Professor II',
        evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        assigned_reviewer_role: 'dean',
        evaluator_college_id: 'CEAC',
        target_college_id: 'CEAC',
        evaluation_status: 'in_evaluation'
      }
      const snapshot = createAdminSnapshot()

      // Resolve all judgment items
      PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: evaluation,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 40.0
      })
      PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: evaluation,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b6',
        acceptedPoints: 20.0
      })

      const payload = PersonnelEvaluationPlanHHandoffService.generatePlanHHandoffPayload({
        evaluationRecord: evaluation,
        snapshotData: snapshot
      })

      expect(payload.handoff_status).toBe(HANDOFF_STATUSES.READY)
      expect(payload.evaluation_id).toBe('eval_adm_001')
      expect(payload.personnel_profile_id).toBe('usr_fac_001')
      expect(payload.personnel_name).toBe('Dr. Maria Santos')
      expect(payload.current_rank).toBe('Associate Professor II')
      expect(payload.official_accepted_total).toBe(140.0)
      expect(payload.plan_f_final_result).toBe('Passed')
      expect(payload.scoring_complete).toBe(true)

      // Verify ZERO Plan H promotion/rank mutation fields in payload
      expect(payload.promotion_approved).toBeUndefined()
      expect(payload.promoted_rank).toBeUndefined()
      expect(payload.next_rank).toBeUndefined()
      expect(payload.deliberation_status).toBeUndefined()
    })
  })
})
