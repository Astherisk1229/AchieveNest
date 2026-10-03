import { describe, it, expect } from 'vitest'
import PersonnelEvaluationFinalLockService, {
  LOCK_STATUSES,
  LOCK_REASON_CODES
} from '../../services/PersonnelEvaluationFinalLockService.js'
import PersonnelEvaluationFinalizationReadinessService from '../../services/PersonnelEvaluationFinalizationReadinessService.js'
import PersonnelEvaluationResultPersistenceService, {
  RESULT_VOCABULARY
} from '../../services/PersonnelEvaluationResultPersistenceService.js'
import PersonnelEvaluationPrintService from '../../services/PersonnelEvaluationPrintService.js'
import PersonnelPromotionDecisionService, {
  DECISION_VOCABULARY
} from '../../services/PersonnelPromotionDecisionService.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from '../../services/evaluationInstrumentRegistry.js'

describe('Personnel Evaluation Track — Plan H — Phase H4: Final Lock, Historical Stability, Validation & Formal Plan H Closure', () => {
  // Test Fixtures
  const validFacultyRecord = {
    id: 'eval_h4_fac_01',
    evaluation_id: 'eval_h4_fac_01',
    personnel_profile_id: 'usr_fac_401',
    personnel_name: 'Dr. Evelyn Carter',
    employee_id: 'EMP-FAC-401',
    current_rank: 'Assistant Professor I',
    department_name: 'Computer Studies',
    college_name: 'College of Engineering and Architecture',
    target_college_id: 'CEAC',
    designation: 'Faculty Member',
    faculty_engagement: 'full_time_faculty',
    personnel_group: 'faculty',
    academic_year: '2025-2026',
    evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
    rule_version: EVALUATION_RULE_VERSION,
    evaluation_status: 'in_evaluation',
    assigned_reviewer_role: 'dean',
    evaluator_profile_id: 'usr_dean_001',
    has_verified_phd: false,
    review_completed_at: '2026-09-08T16:00:00Z'
  }

  const validNonTeachingRecord = {
    id: 'eval_h4_nt_01',
    evaluation_id: 'eval_h4_nt_01',
    personnel_profile_id: 'usr_staff_401',
    personnel_name: 'Mr. Marcus Vance',
    employee_id: 'EMP-NT-401',
    current_rank: 'Administrative Officer I',
    department_name: 'Accounting',
    college_name: 'Non-Academic Services',
    designation: 'Finance Staff',
    faculty_engagement: 'full_time_staff',
    personnel_group: 'non_teaching',
    academic_year: '2025-2026',
    evaluation_scale_code: EVALUATION_SCALE_CODES.NON_TEACHING,
    rule_version: EVALUATION_RULE_VERSION,
    evaluation_status: 'in_evaluation',
    assigned_reviewer_role: 'hr',
    evaluator_profile_id: 'usr_hr_001',
    review_completed_at: '2026-09-08T16:30:00Z'
  }

  const hrActor = {
    profile_id: 'usr_hr_001',
    roles: ['hr_staff']
  }

  const hrAdminActor = {
    profile_id: 'usr_hr_admin_001',
    roles: ['hr_admin']
  }

  const candidateActor = {
    profile_id: 'usr_fac_401',
    roles: ['faculty']
  }

  const secretaryActor = {
    profile_id: 'usr_sec_001',
    roles: ['department_secretary']
  }

  const deanActor = {
    profile_id: 'usr_dean_001',
    roles: ['dean']
  }

  const createPassedAdminSnapshot = () => ({
    snapshot_version: 'v1.0.0',
    items: [
      {
        id: 'item_a1',
        area: 'A',
        category: 'A.1 Doctorate Degree',
        raw_points: 60.0,
        criterion_capped_points: 60.0,
        evaluator_judgment_required: false,
        accepted_points: 60.0
      },
      {
        id: 'item_b3',
        area: 'B',
        category: 'B.3 Conduct of Research',
        raw_points: 35.0,
        criterion_capped_points: 35.0,
        evaluator_judgment_required: true,
        accepted_points: 35.0
      },
      {
        id: 'item_b6',
        area: 'B',
        category: 'B.6 Creative Work',
        raw_points: 15.0,
        criterion_capped_points: 15.0,
        evaluator_judgment_required: true,
        accepted_points: 15.0
      },
      {
        id: 'item_c1',
        area: 'C',
        category: 'C.1 Community Outreach',
        raw_points: 30.0,
        criterion_capped_points: 30.0,
        evaluator_judgment_required: false,
        accepted_points: 30.0
      }
    ]
  })

  const createRetainedAdminSnapshot = () => ({
    snapshot_version: 'v1.0.0',
    items: [
      {
        id: 'item_a1',
        area: 'A',
        category: 'A.1 Doctorate Degree',
        raw_points: 60.0,
        criterion_capped_points: 60.0,
        evaluator_judgment_required: false,
        accepted_points: 60.0
      },
      {
        id: 'item_b3',
        area: 'B',
        category: 'B.3 Conduct of Research',
        raw_points: 20.0,
        criterion_capped_points: 20.0,
        evaluator_judgment_required: true,
        accepted_points: 20.0
      },
      {
        id: 'item_b6',
        area: 'B',
        category: 'B.6 Creative Work',
        raw_points: 0.0,
        criterion_capped_points: 0.0,
        evaluator_judgment_required: true,
        accepted_points: 0.0
      },
      {
        id: 'item_c1',
        area: 'C',
        category: 'C.1 Community Outreach',
        raw_points: 20.0,
        criterion_capped_points: 20.0,
        evaluator_judgment_required: false,
        accepted_points: 20.0
      }
    ]
  })

  // -------------------------------------------------------------
  // Group 1: Phase H0 Readiness Verification
  // -------------------------------------------------------------
  describe('1. Plan H0 Preconditions Integration', () => {
    it('1.1 validates that a complete evaluation passes pre-finalization gate', () => {
      const snapshot = createPassedAdminSnapshot()
      const readiness = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(readiness.ready_for_finalization).toBe(true)
      expect(readiness.evaluation_result).toBe('Passed')
      expect(readiness.official_accepted_total).toBe(140.0)
    })

    it('1.2 blocks incomplete evaluation from entering finalization', () => {
      const incompleteSnapshot = {
        snapshot_version: 'v1.0.0',
        items: [
          {
            id: 'item_a1',
            area: 'A',
            category: 'A.1 Doctorate Degree',
            raw_points: 60.0,
            evaluator_judgment_required: true,
            accepted_points: null
          }
        ]
      }
      const readiness = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validFacultyRecord,
        snapshotData: incompleteSnapshot,
        actor: hrActor
      })

      expect(readiness.ready_for_finalization).toBe(false)
      expect(readiness.reason_code).toBe('scoring_incomplete')
    })
  })

  // -------------------------------------------------------------
  // Group 2: Phase H1 Result Separation
  // -------------------------------------------------------------
  describe('2. Plan H1 Evaluation Result Separation', () => {
    it('2.1 persists Passed evaluation result with promotion_decision unset', () => {
      const snapshot = createPassedAdminSnapshot()
      const resultResponse = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(resultResponse.result.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
      expect(resultResponse.result.promotion_decision).toBeNull()
      expect(resultResponse.result.current_rank).toBe('Assistant Professor I')
    })

    it('2.2 persists Retained evaluation result preserving current rank', () => {
      const snapshot = createRetainedAdminSnapshot()
      const resultResponse = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(resultResponse.result.evaluation_result).toBe(RESULT_VOCABULARY.RETAINED)
      expect(resultResponse.result.current_rank).toBe('Assistant Professor I')
      expect(resultResponse.result.promotion_decision).toBeNull()
    })
  })

  // -------------------------------------------------------------
  // Group 3: Phase H2 Deliberation Print Stability
  // -------------------------------------------------------------
  describe('3. Plan H2 Printable Deliberation Form & Blank Approval Guard', () => {
    it('3.1 generates deliberation print model with strictly blank approval and signature sections', () => {
      const snapshot = createPassedAdminSnapshot()
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(printModel.approval_section.recommended_for_approval.name).toBeNull()
      expect(printModel.approval_section.recommended_for_approval.signature).toBeNull()
      expect(printModel.approval_section.recommended_for_approval.date).toBeNull()

      expect(printModel.approval_section.approved.name).toBeNull()
      expect(printModel.approval_section.approved.signature).toBeNull()
      expect(printModel.approval_section.approved.date).toBeNull()

      expect(printModel.approval_section.president.name).toBeNull()
      expect(printModel.approval_section.president.signature).toBeNull()
      expect(printModel.approval_section.president.date).toBeNull()
    })
  })

  // -------------------------------------------------------------
  // Group 4: Phase H3 Promotion Decision & Rank Progression
  // -------------------------------------------------------------
  describe('4. Plan H3 Promotion Decision & Plan E Progression Rules', () => {
    it('4.1 Approved promotion applies valid Plan E rank advance (Assistant Professor I -> Assistant Professor II)', () => {
      const snapshot = createPassedAdminSnapshot()
      const promoResponse = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.APPROVED,
        approvedRankCode: 'ASSISTANT_PROFESSOR_II',
        actor: hrActor
      })

      expect(promoResponse.success).toBe(true)
      expect(promoResponse.current_rank).toBe('Assistant Professor II')
      expect(promoResponse.promotion_decision.previous_rank).toBe('Assistant Professor I')
      expect(promoResponse.promotion_decision.rank_history_entry.from_rank).toBe('Assistant Professor I')
      expect(promoResponse.promotion_decision.rank_history_entry.to_rank).toBe('Assistant Professor II')
    })

    it('4.2 Not Approved promotion keeps current rank unchanged without demotion', () => {
      const snapshot = createPassedAdminSnapshot()
      const promoResponse = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.NOT_APPROVED,
        actor: hrActor
      })

      expect(promoResponse.success).toBe(true)
      expect(promoResponse.current_rank).toBe('Assistant Professor I')
      expect(promoResponse.promotion_decision.is_promoted).toBe(false)
      expect(promoResponse.promotion_decision.rank_change_applied).toBe(false)
    })
  })

  // -------------------------------------------------------------
  // Group 5: Phase H4 Final Lock & Mutation Protection
  // -------------------------------------------------------------
  describe('5. Plan H4 Final Lock & Ordinary Edit Protection', () => {
    it('5.1 executes final lock on completed Approved evaluation', () => {
      const snapshot = createPassedAdminSnapshot()
      const resultResponse = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const promoResponse = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        resultRecord: resultResponse.result,
        decision: DECISION_VOCABULARY.APPROVED,
        approvedRankCode: 'ASSISTANT_PROFESSOR_II',
        actor: hrActor
      })

      const lockResponse = PersonnelEvaluationFinalLockService.lockEvaluation({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        resultRecord: resultResponse.result,
        promotionRecord: promoResponse.promotion_decision,
        actor: hrActor
      })

      expect(lockResponse.success).toBe(true)
      expect(lockResponse.status).toBe(LOCK_STATUSES.LOCKED)
      expect(lockResponse.is_locked).toBe(true)
      expect(lockResponse.lock_record.is_finalized).toBe(true)

      const readModel = lockResponse.read_model
      expect(readModel.evaluation_result_summary.result).toBe('Passed')
      expect(readModel.promotion_decision_summary.decision).toBe('Approved')
      expect(readModel.promotion_decision_summary.applied_current_rank).toBe('Assistant Professor II')
    })

    it('5.2 executes final lock on completed Not Approved evaluation', () => {
      const snapshot = createPassedAdminSnapshot()
      const resultResponse = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const promoResponse = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        resultRecord: resultResponse.result,
        decision: DECISION_VOCABULARY.NOT_APPROVED,
        actor: hrActor
      })

      const lockResponse = PersonnelEvaluationFinalLockService.lockEvaluation({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        resultRecord: resultResponse.result,
        promotionRecord: promoResponse.promotion_decision,
        actor: hrActor
      })

      expect(lockResponse.success).toBe(true)
      expect(lockResponse.is_locked).toBe(true)
      expect(lockResponse.read_model.promotion_decision_summary.decision).toBe('Not Approved')
      expect(lockResponse.read_model.promotion_decision_summary.applied_current_rank).toBe('Assistant Professor I')
    })

    it('5.3 executes final lock on Retained evaluation', () => {
      const snapshot = createRetainedAdminSnapshot()
      const resultResponse = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const lockResponse = PersonnelEvaluationFinalLockService.lockEvaluation({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        resultRecord: resultResponse.result,
        actor: hrActor
      })

      expect(lockResponse.success).toBe(true)
      expect(lockResponse.is_locked).toBe(true)
      expect(lockResponse.read_model.evaluation_result_summary.result).toBe('Retained')
    })

    it('5.4 strictly blocks post-lock mutation attempts (409 Conflict)', () => {
      const lockedRecord = {
        evaluation_id: 'eval_h4_fac_01',
        is_locked: true,
        is_finalized: true
      }

      expect(() => {
        PersonnelEvaluationFinalLockService.guardAgainstMutation(lockedRecord, 'update_accepted_points')
      }).toThrow(/is finalized and locked. Attempted action \[update_accepted_points\] is strictly prohibited/i)
    })

    it('5.5 repeated lock attempt is idempotent and non-mutating', () => {
      const snapshot = createPassedAdminSnapshot()
      const resultResponse = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const initialLock = PersonnelEvaluationFinalLockService.lockEvaluation({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        resultRecord: resultResponse.result,
        actor: hrActor
      })

      const existingLock = initialLock.lock_record

      const repeatedLock = PersonnelEvaluationFinalLockService.lockEvaluation({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        resultRecord: resultResponse.result,
        actor: hrActor,
        existingLockRecord: existingLock
      })

      expect(repeatedLock.success).toBe(true)
      expect(repeatedLock.reason_code).toBe(LOCK_REASON_CODES.ALREADY_LOCKED)
      expect(repeatedLock.lock_record.locked_at).toBe(existingLock.locked_at)
    })
  })

  // -------------------------------------------------------------
  // Group 6: Security & Role Authorization Boundaries
  // -------------------------------------------------------------
  describe('6. Security & Role Authorization Boundaries', () => {
    it('6.1 allows authorized hr_staff to execute final lock', () => {
      const snapshot = createPassedAdminSnapshot()
      const response = PersonnelEvaluationFinalLockService.lockEvaluation({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.success).toBe(true)
    })

    it('6.2 allows authorized hr_admin to execute final lock', () => {
      const snapshot = createPassedAdminSnapshot()
      const response = PersonnelEvaluationFinalLockService.lockEvaluation({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrAdminActor
      })

      expect(response.success).toBe(true)
    })

    it('6.3 denies candidate faculty member from executing final lock (403)', () => {
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelEvaluationFinalLockService.lockEvaluation({
          evaluationRecord: validFacultyRecord,
          snapshotData: snapshot,
          actor: candidateActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })

    it('6.4 denies department secretary from executing final lock (403)', () => {
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelEvaluationFinalLockService.lockEvaluation({
          evaluationRecord: validFacultyRecord,
          snapshotData: snapshot,
          actor: secretaryActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })

    it('6.5 denies college Dean from executing final lock (403)', () => {
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelEvaluationFinalLockService.lockEvaluation({
          evaluationRecord: validFacultyRecord,
          snapshotData: snapshot,
          actor: deanActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })
  })

  // -------------------------------------------------------------
  // Group 7: Historical Snapshot & Rule Version Stability
  // -------------------------------------------------------------
  describe('7. Historical Snapshot & Rule Version Stability', () => {
    it('7.1 preserves canonical rule version and snapshot version in locked record', () => {
      const snapshot = createPassedAdminSnapshot()
      const response = PersonnelEvaluationFinalLockService.lockEvaluation({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.lock_record.rule_version).toBe(EVALUATION_RULE_VERSION)
      expect(response.lock_record.snapshot_version).toBe('v1.0.0')
      expect(response.lock_record.scale_code).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
    })
  })
})
