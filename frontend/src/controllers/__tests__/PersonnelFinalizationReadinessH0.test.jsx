import { describe, it, expect } from 'vitest'
import PersonnelEvaluationFinalizationReadinessService, {
  FINALIZATION_REASON_CODES
} from '../../services/PersonnelEvaluationFinalizationReadinessService.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from '../../services/evaluationInstrumentRegistry.js'

describe('Personnel Evaluation Track — Plan H — Phase H0: Finalization Preconditions, Plan F Recomputation & Readiness Gate', () => {
  // Test Fixtures
  const validAdminRecord = {
    id: 'eval_adm_101',
    evaluation_id: 'eval_adm_101',
    personnel_profile_id: 'usr_fac_101',
    personnel_name: 'Dr. Roberto Cruz',
    current_rank: 'Assistant Professor III',
    academic_year: '2025-2026',
    evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
    rule_version: EVALUATION_RULE_VERSION,
    evaluation_status: 'in_evaluation',
    assigned_reviewer_role: 'dean',
    evaluator_profile_id: 'usr_dean_001',
    target_college_id: 'CEAC'
  }

  const validNonTeachingRecord = {
    id: 'eval_nt_101',
    evaluation_id: 'eval_nt_101',
    personnel_profile_id: 'usr_staff_101',
    personnel_name: 'Engr. Sarah Ramos',
    current_rank: 'Administrative Officer II',
    academic_year: '2025-2026',
    evaluation_scale_code: EVALUATION_SCALE_CODES.NON_TEACHING,
    rule_version: EVALUATION_RULE_VERSION,
    evaluation_status: 'in_evaluation',
    assigned_reviewer_role: 'hr',
    evaluator_profile_id: 'usr_hr_001'
  }

  const hrActor = {
    profile_id: 'usr_hr_001',
    roles: ['hr_staff']
  }

  const secretaryActor = {
    profile_id: 'usr_sec_001',
    roles: ['department_secretary']
  }

  const deanActor = {
    profile_id: 'usr_dean_001',
    roles: ['dean']
  }

  const candidateActor = {
    profile_id: 'usr_fac_101',
    roles: ['faculty']
  }

  const createCompleteAdminSnapshot = (scoreB3 = 35.0, scoreB6 = 15.0) => ({
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
        raw_points: 40.0,
        criterion_capped_points: 40.0,
        evaluator_judgment_required: true,
        accepted_points: scoreB3
      },
      {
        id: 'item_b6',
        area: 'B',
        category: 'B.6 Creative Work',
        raw_points: 20.0,
        criterion_capped_points: 20.0,
        evaluator_judgment_required: true,
        accepted_points: scoreB6
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

  const createCompleteNonTeachingSnapshot = (scoreB5 = 25.0) => ({
    snapshot_version: 'v1.0.0',
    items: [
      {
        id: 'item_nt_b1',
        area: 'B',
        category: 'B.1 Service Years',
        raw_points: 20.0,
        criterion_capped_points: 20.0,
        evaluator_judgment_required: false,
        accepted_points: 20.0
      },
      {
        id: 'item_nt_b5',
        area: 'B',
        category: 'B.5 Recognition / Meritorious Award',
        raw_points: 30.0,
        criterion_capped_points: 30.0,
        evaluator_judgment_required: true,
        accepted_points: scoreB5
      }
    ]
  })

  const completeAreaAInputs = {
    job_performance: 48.0,
    personal_attitudes: 9.0,
    efficiency: 28.0,
    total_area_a: 85.0,
    is_complete: true
  }

  // 1. Valid Readiness Gate
  describe('1. Valid Finalization Readiness Gate', () => {
    it('declares complete Passed evaluation ready for Plan H finalization', () => {
      const snapshot = createCompleteAdminSnapshot(35.0, 15.0) // Total: 60 + 50(cap) + 30 = 140 -> Passed (>= 120)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(res.ready_for_finalization).toBe(true)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.READY_FOR_FINALIZATION)
      expect(res.official_accepted_total).toBe(140.0)
      expect(res.evaluation_result).toBe('Passed')
      expect(res.scoring_complete).toBe(true)
      expect(res.review_complete).toBe(true)
      expect(res.revision_clear).toBe(true)
    })

    it('declares complete Retained evaluation ready for Plan H finalization', () => {
      const snapshot = createCompleteAdminSnapshot(10.0, 5.0) // Total: 60 + 15 + 30 = 105 -> Retained (< 120)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(res.ready_for_finalization).toBe(true)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.READY_FOR_FINALIZATION)
      expect(res.official_accepted_total).toBe(105.0)
      expect(res.evaluation_result).toBe('Retained')
    })
  })

  // 2. Identity & Cycle Validation
  describe('2. Evaluation Identity & Cycle Verification', () => {
    it('blocks when evaluation ID is missing', () => {
      const invalidRecord = { ...validAdminRecord, id: '', evaluation_id: '' }
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: invalidRecord,
        snapshotData: createCompleteAdminSnapshot()
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.EVALUATION_NOT_FOUND)
    })

    it('blocks when personnel profile ID is missing', () => {
      const invalidRecord = { ...validAdminRecord, personnel_profile_id: '' }
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: invalidRecord,
        snapshotData: createCompleteAdminSnapshot()
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.PERSONNEL_NOT_FOUND)
    })

    it('blocks when evaluation cycle is missing or invalid', () => {
      const missingCycleRecord = { ...validAdminRecord, academic_year: '', evaluation_cycle_id: '' }
      const resMissing = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: missingCycleRecord,
        snapshotData: createCompleteAdminSnapshot()
      })
      expect(resMissing.ready_for_finalization).toBe(false)
      expect(resMissing.reason_code).toBe(FINALIZATION_REASON_CODES.EVALUATION_CYCLE_MISSING)

      const invalidCycleRecord = { ...validAdminRecord, academic_year: 'invalid_cycle' }
      const resInvalid = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: invalidCycleRecord,
        snapshotData: createCompleteAdminSnapshot()
      })
      expect(resInvalid.ready_for_finalization).toBe(false)
      expect(resInvalid.reason_code).toBe(FINALIZATION_REASON_CODES.EVALUATION_CYCLE_INVALID)
    })

    it('blocks when duplicate active cycle evaluation exists', () => {
      const activeEvaluations = [
        {
          id: 'eval_other_999',
          personnel_profile_id: 'usr_fac_101',
          academic_year: '2025-2026',
          evaluation_status: 'in_evaluation'
        }
      ]
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: createCompleteAdminSnapshot(),
        activeCycleEvaluations: activeEvaluations
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.DUPLICATE_CYCLE_EVALUATION)
    })
  })

  // 3. Reviewer & Authorization Verification
  describe('3. Reviewer Authorization & Completion', () => {
    it('blocks when reviewer assignment is missing', () => {
      const unassignedRecord = { ...validAdminRecord, assigned_reviewer_role: null, evaluator_role: null }
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: unassignedRecord,
        snapshotData: createCompleteAdminSnapshot()
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.REVIEWER_ASSIGNMENT_MISSING)
    })

    it('blocks when self-review is detected (evaluator ID matches candidate)', () => {
      const selfReviewRecord = { ...validAdminRecord, evaluator_profile_id: 'usr_fac_101' }
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: selfReviewRecord,
        snapshotData: createCompleteAdminSnapshot()
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.SELF_REVIEW_INVALID)
    })

    it('blocks when evaluation is in draft state', () => {
      const draftRecord = { ...validAdminRecord, evaluation_status: 'draft' }
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: draftRecord,
        snapshotData: createCompleteAdminSnapshot()
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.REVIEW_INCOMPLETE)
    })
  })

  // 4. Unresolved Revision Guard
  describe('4. Unresolved Revision Request Guard', () => {
    it('blocks when evaluation is returned_for_revision', () => {
      const returnedRecord = { ...validAdminRecord, evaluation_status: 'returned_for_revision' }
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: returnedRecord,
        snapshotData: createCompleteAdminSnapshot()
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.REVISION_REQUEST_UNRESOLVED)
    })

    it('blocks when evaluation has unresolved revision request flag', () => {
      const revisionPendingRecord = { ...validAdminRecord, has_unresolved_revision_request: true }
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: revisionPendingRecord,
        snapshotData: createCompleteAdminSnapshot()
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.REVISION_REQUEST_UNRESOLVED)
    })
  })

  // 5. Scoring Completeness & Score Integrity
  describe('5. Scoring Completeness & Score Integrity', () => {
    it('blocks when judgment criteria remain unresolved (accepted_points = null)', () => {
      const incompleteSnapshot = createCompleteAdminSnapshot(null, 15.0) // B.3 unresolved
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: incompleteSnapshot
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.SCORING_INCOMPLETE)
    })

    it('blocks Non-Teaching evaluation when Area A inputs are incomplete', () => {
      const snapshot = createCompleteNonTeachingSnapshot(25.0)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validNonTeachingRecord,
        snapshotData: snapshot,
        areaAInputs: null // Missing Area A ratings
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.SCORING_INCOMPLETE)
    })

    it('blocks when negative accepted score is detected', () => {
      const invalidSnapshot = createCompleteAdminSnapshot(-5.0, 15.0)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: invalidSnapshot
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.INVALID_SCORE_STATE)
    })

    it('blocks when accepted score exceeds criterion maximum (e.g. B.3 > 40.0)', () => {
      const invalidSnapshot = createCompleteAdminSnapshot(45.0, 15.0)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: invalidSnapshot
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.INVALID_SCORE_STATE)
    })
  })

  // 6. Plan F Recomputation & Authority
  describe('6. Plan F Recomputation & Rule Version', () => {
    it('ignores client-supplied totals and recomputes authoritatively using Plan F', () => {
      const snapshot = createCompleteAdminSnapshot(40.0, 20.0) // Raw Area B = 60 -> Capped at 50
      const forgedRecord = { ...validAdminRecord, client_total_score: 999.0 }
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: forgedRecord,
        snapshotData: snapshot
      })
      expect(res.ready_for_finalization).toBe(true)
      expect(res.official_accepted_total).toBe(140.0) // 60(A) + 50(B capped) + 30(C) = 140
    })

    it('blocks when rule version is missing or unsupported', () => {
      const invalidVersionRecord = { ...validAdminRecord, rule_version: 'NDMU-LEGACY-1999' }
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: invalidVersionRecord,
        snapshotData: createCompleteAdminSnapshot()
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.RULE_VERSION_UNAVAILABLE)
    })
  })

  // 7. Promotion & Rank Mutation Boundary (Plan H Invariants)
  describe('7. Promotion & Rank Mutation Boundary', () => {
    it('verifies Passed result does not mutate candidate rank (Passed != Promoted)', () => {
      const snapshot = createCompleteAdminSnapshot(40.0, 20.0)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot
      })
      expect(res.evaluation_result).toBe('Passed')
      expect(res.current_rank).toBe('Assistant Professor III') // Master data rank untouched
    })

    it('verifies Readiness DTO contains zero Plan H promotion decision fields', () => {
      const snapshot = createCompleteAdminSnapshot(40.0, 20.0)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot
      })
      expect(res.promotion_approved).toBeUndefined()
      expect(res.promoted_rank).toBeUndefined()
      expect(res.next_rank).toBeUndefined()
      expect(res.president_signature).toBeUndefined()
    })
  })

  // 8. HR Security & Role Guards
  describe('8. HR Authorization & Access Controls', () => {
    it('allows authorized HR staff to perform finalization readiness checks', () => {
      const snapshot = createCompleteAdminSnapshot(35.0, 15.0)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })
      expect(res.ready_for_finalization).toBe(true)
    })

    it('denies Department Secretary from triggering finalization (403)', () => {
      const snapshot = createCompleteAdminSnapshot(35.0, 15.0)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: secretaryActor
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.UNAUTHORIZED_ACTOR)
    })

    it('denies Candidate from triggering finalization on own evaluation (403)', () => {
      const snapshot = createCompleteAdminSnapshot(35.0, 15.0)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: candidateActor
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.UNAUTHORIZED_ACTOR)
    })

    it('denies College Dean from triggering HR finalization (403)', () => {
      const snapshot = createCompleteAdminSnapshot(35.0, 15.0)
      const res = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: deanActor
      })
      expect(res.ready_for_finalization).toBe(false)
      expect(res.reason_code).toBe(FINALIZATION_REASON_CODES.UNAUTHORIZED_ACTOR)
    })
  })

  // 9. Idempotency Verification
  describe('9. Idempotency of Readiness Gate', () => {
    it('returns stable identical readiness DTO on repeated execution', () => {
      const snapshot = createCompleteAdminSnapshot(35.0, 15.0)
      const res1 = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })
      const res2 = PersonnelEvaluationFinalizationReadinessService.canFinalize({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(res1.ready_for_finalization).toBe(res2.ready_for_finalization)
      expect(res1.reason_code).toBe(res2.reason_code)
      expect(res1.official_accepted_total).toBe(res2.official_accepted_total)
      expect(res1.evaluation_result).toBe(res2.evaluation_result)
    })
  })
})
