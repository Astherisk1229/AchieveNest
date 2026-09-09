import { describe, it, expect } from 'vitest'
import PersonnelEvaluationResultPersistenceService, {
  RESULT_VOCABULARY,
  RESULT_STATUSES,
  RESULT_PERSISTENCE_REASONS
} from '../../services/PersonnelEvaluationResultPersistenceService.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from '../../services/evaluationInstrumentRegistry.js'

describe('Personnel Evaluation Track — Plan H — Phase H1: Evaluation Result Separation, Persistence & Presentation', () => {
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

  const hrAdminActor = {
    profile_id: 'usr_hr_admin_001',
    roles: ['hr_admin']
  }

  const candidateActor = {
    profile_id: 'usr_fac_101',
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

  const createAdminSnapshotWithScore = (scoreB3 = 35.0, scoreB6 = 15.0, scoreC = 30.0) => ({
    snapshot_version: 'v1.0.0',
    items: [
      {
        id: 'item_a1',
        area: 'A',
        category: 'A.1 Doctorate Degree',
        raw_points: 60.0,
        criterion_capped_points: 60.0,
        evaluator_judgment_required: false,
        accepted_points: 60.0 // Area A cap is 70.0
      },
      {
        id: 'item_b3',
        area: 'B',
        category: 'B.3 Conduct of Research',
        raw_points: 40.0,
        criterion_capped_points: 40.0,
        evaluator_judgment_required: true,
        accepted_points: scoreB3 // Max 40.0
      },
      {
        id: 'item_b6',
        area: 'B',
        category: 'B.6 Creative Work',
        raw_points: 20.0,
        criterion_capped_points: 20.0,
        evaluator_judgment_required: true,
        accepted_points: scoreB6 // Max 20.0
      },
      {
        id: 'item_c1',
        area: 'C',
        category: 'C.1 Community Service',
        raw_points: scoreC,
        criterion_capped_points: scoreC,
        evaluator_judgment_required: false,
        accepted_points: scoreC // Area C cap is 40.0
      }
    ]
  })

  const createNonTeachingSnapshotWithScore = (scoreB5 = 25.0) => ({
    snapshot_version: 'v1.0.0',
    items: [
      {
        id: 'item_nt_b1',
        area: 'B',
        category: 'B.1 Service Years',
        raw_points: 0.0,
        criterion_capped_points: 0.0,
        evaluator_judgment_required: false,
        accepted_points: 0.0
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

  const validNonTeachingAreaAInputs = {
    job_performance: 40.0,
    personal_attitudes: 8.0,
    efficiency: 22.0,
    total_area_a: 70.0,
    is_complete: true
  }

  // -------------------------------------------------------------
  // Group 1: Preconditions & H0 Readiness Integration
  // -------------------------------------------------------------
  describe('1. Preconditions & H0 Readiness Gate Integration', () => {
    it('1.1 allows an H0-ready evaluation to record authoritative result', () => {
      // 60 (A) + 35 (B.3) + 15 (B.6) + 30 (C) = 135.00 >= 120.00 (Passing)
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.success).toBe(true)
      expect(response.status).toBe(RESULT_STATUSES.FINALIZED)
      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
      expect(response.result.final_accepted_total).toBe(140.0) // Area B capped at 50.0 -> 60 + 50 + 30 = 140.0
    })

    it('1.2 strictly blocks an evaluation when H0 pre-finalization gates fail', () => {
      // Incomplete scoring (accepted_points is null)
      const incompleteSnapshot = {
        snapshot_version: 'v1.0.0',
        items: [
          {
            id: 'item_a1',
            area: 'A',
            category: 'A.1 Doctorate Degree',
            raw_points: 60.0,
            criterion_capped_points: 60.0,
            evaluator_judgment_required: true,
            accepted_points: null // Incomplete!
          }
        ]
      }

      expect(() => {
        PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
          evaluationRecord: validAdminRecord,
          snapshotData: incompleteSnapshot,
          actor: hrActor
        })
      }).toThrow(/Finalization preconditions not met/i)
    })

    it('1.3 blocks evaluation when unresolved revision request exists', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const recordWithRevision = {
        ...validAdminRecord,
        evaluation_status: 'returned_for_revision',
        active_revision_request_id: 'rev_req_001',
        has_unresolved_revision_request: true
      }

      expect(() => {
        PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
          evaluationRecord: recordWithRevision,
          snapshotData: snapshot,
          actor: hrActor
        })
      }).toThrow(/revision_request_unresolved/i)
    })

    it('1.4 blocks evaluation when non-teaching Area A rating is pending', () => {
      const snapshot = createNonTeachingSnapshotWithScore(25.0)
      const pendingAreaAInputs = {
        completed: false,
        punctuality_rating: 25.0,
        quality_of_work_rating: null,
        initiative_rating: null
      }

      expect(() => {
        PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
          evaluationRecord: validNonTeachingRecord,
          snapshotData: snapshot,
          areaAInputs: pendingAreaAInputs,
          actor: hrActor
        })
      }).toThrow(/scoring_incomplete/i)
    })
  })

  // -------------------------------------------------------------
  // Group 2: Canonical Vocabulary & Result Source Authority (Plan F)
  // -------------------------------------------------------------
  describe('2. Canonical Vocabulary & Plan F Result Source Authority', () => {
    it('2.1 enforces canonical vocabulary (Passed and Retained only)', () => {
      expect(() => PersonnelEvaluationResultPersistenceService.validateResultVocabulary('Passed')).not.toThrow()
      expect(() => PersonnelEvaluationResultPersistenceService.validateResultVocabulary('Retained')).not.toThrow()
      expect(() => PersonnelEvaluationResultPersistenceService.validateResultVocabulary('Promoted')).toThrow(/Invalid Evaluation Result/)
      expect(() => PersonnelEvaluationResultPersistenceService.validateResultVocabulary('Approved')).toThrow(/Invalid Evaluation Result/)
      expect(() => PersonnelEvaluationResultPersistenceService.validateResultVocabulary('Denied')).toThrow(/Invalid Evaluation Result/)
      expect(() => PersonnelEvaluationResultPersistenceService.validateResultVocabulary('Failed')).toThrow(/Invalid Evaluation Result/)
      expect(() => PersonnelEvaluationResultPersistenceService.validateResultVocabulary('Qualified for Promotion')).toThrow(/Invalid Evaluation Result/)
    })

    it('2.2 authoritatively persists Passed from Plan F scoring', () => {
      // 60 (A) + 35 (B) + 30 (C) = 125.00 >= 120.00
      const snapshot = createAdminSnapshotWithScore(35.0, 0.0, 30.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
      expect(response.result.final_accepted_total).toBe(125.0)
      expect(response.result.passing_score).toBe(120.0)
      expect(response.result.maximum_score).toBe(160.0)
      expect(response.result.evaluation_scale_code).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
      expect(response.result.rule_version).toBe(EVALUATION_RULE_VERSION)
      expect(response.result.source).toBe('plan_f')
    })

    it('2.3 authoritatively persists Retained from Plan F scoring', () => {
      // 60 (A) + 20 (B) + 20 (C) = 100.00 < 120.00
      const snapshot = createAdminSnapshotWithScore(20.0, 0.0, 20.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.RETAINED)
      expect(response.result.final_accepted_total).toBe(100.0)
      expect(response.result.passing_score).toBe(120.0)
      expect(response.result.result_explanation).toContain('is below the required passing score')
    })

    it('2.4 rejects/ignores forged client Passed payload on a Retained evaluation', () => {
      // Total 100.00 (Retained), but client attempts to inject { evaluation_result: 'Passed' }
      const snapshot = createAdminSnapshotWithScore(20.0, 0.0, 20.0)
      const forgedClientPayload = {
        evaluation_result: 'Passed',
        final_accepted_total: 155.0,
        passing_score: 50.0
      }

      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor,
        clientPayload: forgedClientPayload
      })

      // Backend derives from Plan F; client override is strictly ignored
      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.RETAINED)
      expect(response.result.final_accepted_total).toBe(100.0)
      expect(response.result.passing_score).toBe(120.0)
    })

    it('2.5 rejects/ignores forged client Retained payload on a Passed evaluation', () => {
      // Total 130.00 (Passed), client attempts to inject { evaluation_result: 'Retained' }
      const snapshot = createAdminSnapshotWithScore(40.0, 0.0, 30.0)
      const forgedClientPayload = {
        evaluation_result: 'Retained',
        final_accepted_total: 80.0
      }

      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor,
        clientPayload: forgedClientPayload
      })

      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
      expect(response.result.final_accepted_total).toBe(130.0)
    })
  })

  // -------------------------------------------------------------
  // Group 3: Separation of Evaluation Result & Promotion Decision
  // -------------------------------------------------------------
  describe('3. Separation of Evaluation Result from Promotion Decision (Passed != Promoted)', () => {
    it('3.1 Passed evaluation is stored with promotion_decision as null and is_promoted as false', () => {
      const snapshot = createAdminSnapshotWithScore(40.0, 0.0, 30.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
      expect(response.result.promotion_decision).toBeNull()
      expect(response.result.is_promoted).toBe(false)
      expect(response.result.rank_mutation_applied).toBe(false)
      expect(response.read_model.promotion_decision_status).toBe('pending_deliberation_phase_h3')
    })

    it('3.2 Retained evaluation is stored with promotion_decision as null and is_promoted as false', () => {
      const snapshot = createAdminSnapshotWithScore(20.0, 0.0, 20.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.RETAINED)
      expect(response.result.promotion_decision).toBeNull()
      expect(response.result.is_promoted).toBe(false)
    })

    it('3.3 Passed evaluation strictly preserves candidate current rank without mutation', () => {
      const snapshot = createAdminSnapshotWithScore(40.0, 0.0, 30.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.result.current_rank).toBe('Assistant Professor III')
      expect(response.read_model.current_rank).toBe('Assistant Professor III')
      expect(response.result.next_rank).toBeUndefined()
      expect(response.result.approved_rank).toBeUndefined()
      expect(response.result.promotion_rank).toBeUndefined()
    })

    it('3.4 Retained evaluation strictly retains current rank without demotion', () => {
      const snapshot = createAdminSnapshotWithScore(20.0, 0.0, 20.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.result.current_rank).toBe('Assistant Professor III')
      expect(response.read_model.current_rank).toBe('Assistant Professor III')
      expect(response.read_model.deliberation_notice).toBe('Current rank/title retained. No rank adjustment required.')
    })
  })

  // -------------------------------------------------------------
  // Group 4: Exact Passed/Retained Boundary Tests
  // -------------------------------------------------------------
  describe('4. Exact Threshold Boundary Verification', () => {
    it('4.1 Administrators scale boundary: 119.99 -> Retained', () => {
      // 60 (A) + 30 (B) + 29.99 (C) = 119.99
      const snapshot = createAdminSnapshotWithScore(30.0, 0.0, 29.99)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.result.final_accepted_total).toBe(119.99)
      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.RETAINED)
    })

    it('4.2 Administrators scale boundary: 120.00 -> Passed', () => {
      // 60 (A) + 30 (B) + 30.00 (C) = 120.00
      const snapshot = createAdminSnapshotWithScore(30.0, 0.0, 30.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.result.final_accepted_total).toBe(120.0)
      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
    })

    it('4.3 Administrators scale boundary: 120.01 -> Passed', () => {
      // 60 (A) + 30 (B) + 30.01 (C) = 120.01
      const snapshot = createAdminSnapshotWithScore(30.0, 0.0, 30.01)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.result.final_accepted_total).toBe(120.01)
      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
    })

    it('4.4 Non-Teaching scale boundary: 74.99 -> Retained', () => {
      // Area A: 60.0. Area B: 14.99 -> Total = 74.99 < 75.00
      const snapshot = createNonTeachingSnapshotWithScore(14.99)
      const areaAInputs = {
        total_area_a: 60.0,
        is_complete: true
      }
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validNonTeachingRecord,
        snapshotData: snapshot,
        areaAInputs,
        actor: hrActor
      })

      expect(response.result.final_accepted_total).toBe(74.99)
      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.RETAINED)
    })

    it('4.5 Non-Teaching scale boundary: 75.00 -> Passed', () => {
      // Area A: 60.0, Area B: 15.00 -> Total = 75.00
      const snapshot = createNonTeachingSnapshotWithScore(15.0)
      const areaAInputs = {
        total_area_a: 60.0,
        is_complete: true
      }
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validNonTeachingRecord,
        snapshotData: snapshot,
        areaAInputs,
        actor: hrActor
      })

      expect(response.result.final_accepted_total).toBe(75.0)
      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
    })

    it('4.6 Non-Teaching scale boundary: 75.01 -> Passed', () => {
      // Area A: 60.0, Area B: 15.01 -> Total = 75.01
      const snapshot = createNonTeachingSnapshotWithScore(15.01)
      const areaAInputs = {
        total_area_a: 60.0,
        is_complete: true
      }
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validNonTeachingRecord,
        snapshotData: snapshot,
        areaAInputs,
        actor: hrActor
      })

      expect(response.result.final_accepted_total).toBe(75.01)
      expect(response.result.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
    })
  })

  // -------------------------------------------------------------
  // Group 5: Idempotency & Historical Stability
  // -------------------------------------------------------------
  describe('5. Idempotency & Historical Stability', () => {
    it('5.1 repeated result recording returns existing finalized result without rewriting', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const initialResponse = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const existingRecord = initialResponse.result

      // Second invocation with existing result passed in
      const secondResponse = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor,
        existingResultRecord: existingRecord
      })

      expect(secondResponse.success).toBe(true)
      expect(secondResponse.reason_code).toBe(RESULT_PERSISTENCE_REASONS.RESULT_ALREADY_RECORDED)
      expect(secondResponse.result.evaluation_result).toBe(existingRecord.evaluation_result)
      expect(secondResponse.result.recorded_at).toBe(existingRecord.recorded_at)
    })

    it('5.2 preserves historical rule version and immutable scale code', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.result.rule_version).toBe(EVALUATION_RULE_VERSION)
      expect(response.result.evaluation_scale_code).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
    })
  })

  // -------------------------------------------------------------
  // Group 6: Security & Role Authorization Boundary
  // -------------------------------------------------------------
  describe('6. Security & Role Authorization Boundaries', () => {
    it('6.1 allows authorized hr_staff to record result', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(response.success).toBe(true)
    })

    it('6.2 allows authorized hr_admin to record result', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrAdminActor
      })

      expect(response.success).toBe(true)
    })

    it('6.3 denies candidate faculty member from recording result (403)', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      expect(() => {
        PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
          evaluationRecord: validAdminRecord,
          snapshotData: snapshot,
          actor: candidateActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })

    it('6.4 denies department secretary from recording result (403)', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      expect(() => {
        PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
          evaluationRecord: validAdminRecord,
          snapshotData: snapshot,
          actor: secretaryActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })

    it('6.5 denies college Dean from recording final result in Plan H (403)', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      expect(() => {
        PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
          evaluationRecord: validAdminRecord,
          snapshotData: snapshot,
          actor: deanActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })
  })

  // -------------------------------------------------------------
  // Group 7: Presentation Read Model
  // -------------------------------------------------------------
  describe('7. Presentation Read Model Formatting', () => {
    it('7.1 generates clean read model for Passed evaluation', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const readModel = response.read_model
      expect(readModel.evaluation_result).toBe('Passed')
      expect(readModel.deliberation_notice).toBe('Evaluation passed. Eligible to proceed to deliberation under Plan H.')
      expect(readModel.current_rank).toBe('Assistant Professor III')
      expect(readModel.promotion_decision).toBeNull()
      expect(readModel.promotion_decision_status).toBe('pending_deliberation_phase_h3')
    })

    it('7.2 generates clean read model for Retained evaluation', () => {
      const snapshot = createAdminSnapshotWithScore(20.0, 0.0, 20.0)
      const response = PersonnelEvaluationResultPersistenceService.recordEvaluationResult({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const readModel = response.read_model
      expect(readModel.evaluation_result).toBe('Retained')
      expect(readModel.deliberation_notice).toBe('Current rank/title retained. No rank adjustment required.')
      expect(readModel.current_rank).toBe('Assistant Professor III')
      expect(readModel.promotion_decision).toBeNull()
    })
  })
})
