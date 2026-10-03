import { describe, it, expect } from 'vitest'
import PersonnelPromotionDecisionService, {
  DECISION_VOCABULARY,
  PROMOTION_REASON_CODES
} from '../../services/PersonnelPromotionDecisionService.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from '../../services/evaluationInstrumentRegistry.js'
import { RESULT_VOCABULARY } from '../../services/PersonnelEvaluationResultPersistenceService.js'

describe('Personnel Evaluation Track — Plan H — Phase H3: Deliberation, HR Promotion Decision & Approved Rank Update', () => {
  // Test Fixtures
  const validFacultyRecord = {
    id: 'eval_h3_fac_01',
    evaluation_id: 'eval_h3_fac_01',
    personnel_profile_id: 'usr_fac_301',
    personnel_name: 'Dr. Arthur Pendelton',
    current_rank: 'Assistant Professor I',
    faculty_engagement: 'full_time_faculty',
    personnel_group: 'faculty',
    academic_year: '2025-2026',
    evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
    rule_version: EVALUATION_RULE_VERSION,
    evaluation_status: 'in_evaluation',
    assigned_reviewer_role: 'dean',
    evaluator_profile_id: 'usr_dean_001',
    has_verified_phd: false
  }

  const validPartTimeFacultyRecord = {
    ...validFacultyRecord,
    id: 'eval_h3_pt_01',
    personnel_profile_id: 'usr_fac_pt_301',
    faculty_engagement: 'part_time_faculty'
  }

  const validNonTeachingRecord = {
    id: 'eval_h3_nt_01',
    evaluation_id: 'eval_h3_nt_01',
    personnel_profile_id: 'usr_staff_301',
    personnel_name: 'Ms. Clara Oswald',
    current_rank: 'Administrative Officer I',
    faculty_engagement: 'full_time_staff',
    personnel_group: 'non_teaching',
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
    profile_id: 'usr_fac_301',
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
  // Group 1: Security & Role Authorization Boundaries
  // -------------------------------------------------------------
  describe('1. Security & Role Authorization Boundaries', () => {
    it('1.1 allows authorized hr_staff to record promotion decision', () => {
      const snapshot = createPassedAdminSnapshot()
      const response = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.APPROVED,
        approvedRankCode: 'ASSISTANT_PROFESSOR_II',
        actor: hrActor
      })

      expect(response.success).toBe(true)
      expect(response.promotion_decision.decided_by).toBe('usr_hr_001')
    })

    it('1.2 allows authorized hr_admin to record promotion decision', () => {
      const snapshot = createPassedAdminSnapshot()
      const response = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.APPROVED,
        approvedRankCode: 'ASSISTANT_PROFESSOR_II',
        actor: hrAdminActor
      })

      expect(response.success).toBe(true)
      expect(response.promotion_decision.decided_by).toBe('usr_hr_admin_001')
    })

    it('1.3 denies candidate faculty member from recording promotion decision (403)', () => {
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: validFacultyRecord,
          snapshotData: snapshot,
          decision: DECISION_VOCABULARY.APPROVED,
          approvedRankCode: 'ASSISTANT_PROFESSOR_II',
          actor: candidateActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })

    it('1.4 denies department secretary from recording promotion decision (403)', () => {
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: validFacultyRecord,
          snapshotData: snapshot,
          decision: DECISION_VOCABULARY.APPROVED,
          approvedRankCode: 'ASSISTANT_PROFESSOR_II',
          actor: secretaryActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })

    it('1.5 denies college Dean from recording post-evaluation promotion decision (403)', () => {
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: validFacultyRecord,
          snapshotData: snapshot,
          decision: DECISION_VOCABULARY.APPROVED,
          approvedRankCode: 'ASSISTANT_PROFESSOR_II',
          actor: deanActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })
  })

  // -------------------------------------------------------------
  // Group 2: Evaluation Result vs Promotion Decision Boundaries
  // -------------------------------------------------------------
  describe('2. Evaluation Result vs Promotion Decision Boundaries', () => {
    it('2.1 Passed evaluation is eligible for deliberation without auto-promoting', () => {
      const snapshot = createPassedAdminSnapshot()
      const deliberationCheck = PersonnelPromotionDecisionService.canDeliberate({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(deliberationCheck.can_deliberate).toBe(true)
      expect(deliberationCheck.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
    })

    it('2.2 Retained evaluation strictly blocks promotion approval', () => {
      const snapshot = createRetainedAdminSnapshot()
      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: validFacultyRecord,
          snapshotData: snapshot,
          decision: DECISION_VOCABULARY.APPROVED,
          approvedRankCode: 'ASSISTANT_PROFESSOR_II',
          actor: hrActor
        })
      }).toThrow(/Only 'Passed' evaluations may be approved for promotion/i)
    })

    it('2.3 Passed evaluation preserves current rank until explicit HR approval is saved', () => {
      // Prior to saving promotion decision, current rank remains Assistant Professor I
      expect(validFacultyRecord.current_rank).toBe('Assistant Professor I')
    })

    it('2.4 Evaluation Result and Promotion Decision are stored as distinct fields', () => {
      const snapshot = createPassedAdminSnapshot()
      const response = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.APPROVED,
        approvedRankCode: 'ASSISTANT_PROFESSOR_II',
        actor: hrActor
      })

      expect(response.promotion_decision.evaluation_result).toBe('Passed')
      expect(response.promotion_decision.promotion_decision).toBe('Approved')
    })
  })

  // -------------------------------------------------------------
  // Group 3: Approved Promotion & Plan E Rank Transitions
  // -------------------------------------------------------------
  describe('3. Approved Promotion & Plan E Progression Rules', () => {
    it('3.1 applies valid normal sequential transition (Assistant Professor I -> Assistant Professor II)', () => {
      const snapshot = createPassedAdminSnapshot()
      const response = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.APPROVED,
        approvedRankCode: 'ASSISTANT_PROFESSOR_II',
        actor: hrActor
      })

      expect(response.success).toBe(true)
      expect(response.current_rank).toBe('Assistant Professor II')
      expect(response.promotion_decision.previous_rank).toBe('Assistant Professor I')
      expect(response.promotion_decision.approved_rank_code).toBe('ASSISTANT_PROFESSOR_II')
      expect(response.promotion_decision.approved_rank_name).toBe('Assistant Professor II')
      expect(response.promotion_decision.is_promoted).toBe(true)
      expect(response.promotion_decision.rank_change_applied).toBe(true)
      expect(response.promotion_decision.rank_history_entry.from_rank).toBe('Assistant Professor I')
      expect(response.promotion_decision.rank_history_entry.to_rank).toBe('Assistant Professor II')
    })

    it('3.2 rejects multi-step rank jump (Assistant Professor I -> Associate Professor I)', () => {
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: validFacultyRecord,
          snapshotData: snapshot,
          decision: DECISION_VOCABULARY.APPROVED,
          approvedRankCode: 'ASSOCIATE_PROFESSOR_I', // Multi-step jump!
          actor: hrActor
        })
      }).toThrow(/Invalid rank transition/i)
    })

    it('3.3 rejects downward rank transition (Assistant Professor II -> Assistant Professor I)', () => {
      const recordRank2 = {
        ...validFacultyRecord,
        current_rank: 'Assistant Professor II'
      }
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: recordRank2,
          snapshotData: snapshot,
          decision: DECISION_VOCABULARY.APPROVED,
          approvedRankCode: 'ASSISTANT_PROFESSOR_I', // Lower rank!
          actor: hrActor
        })
      }).toThrow(/Invalid rank transition/i)
    })

    it('3.4 populates allowed transition options from Plan E catalog only', () => {
      const transitions = PersonnelPromotionDecisionService.resolveAllowedRankTransitions({
        evaluationRecord: validFacultyRecord
      })

      expect(transitions.eligible).toBe(true)
      expect(transitions.normal_next_rank.rank_code).toBe('ASSISTANT_PROFESSOR_II')
      expect(transitions.allowed_targets).toHaveLength(1)
      expect(transitions.allowed_targets[0].rank_code).toBe('ASSISTANT_PROFESSOR_II')
    })
  })

  // -------------------------------------------------------------
  // Group 4: PhD Exception Verification
  // -------------------------------------------------------------
  describe('4. Verified PhD Exception Progression', () => {
    it('4.1 allows Assistant Professor I -> Professor I with verified PhD evidence', () => {
      const recordWithPhd = {
        ...validFacultyRecord,
        has_verified_phd: true
      }
      const snapshot = createPassedAdminSnapshot()

      const transitions = PersonnelPromotionDecisionService.resolveAllowedRankTransitions({
        evaluationRecord: recordWithPhd
      })

      expect(transitions.allowed_targets).toHaveLength(2)
      const phdTarget = transitions.allowed_targets.find((t) => t.rank_code === 'PROFESSOR_I')
      expect(phdTarget).toBeDefined()
      expect(phdTarget.transition_type).toBe('phd_exception')

      const response = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: recordWithPhd,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.APPROVED,
        approvedRankCode: 'PROFESSOR_I',
        actor: hrActor
      })

      expect(response.success).toBe(true)
      expect(response.current_rank).toBe('Professor I')
      expect(response.promotion_decision.transition_type).toBe('phd_exception')
    })

    it('4.2 rejects Assistant Professor I -> Professor I without verified PhD evidence', () => {
      const recordNoPhd = {
        ...validFacultyRecord,
        has_verified_phd: false
      }
      const snapshot = createPassedAdminSnapshot()

      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: recordNoPhd,
          snapshotData: snapshot,
          decision: DECISION_VOCABULARY.APPROVED,
          approvedRankCode: 'PROFESSOR_I',
          actor: hrActor
        })
      }).toThrow(/requires verified PhD credential evidence/i)
    })
  })

  // -------------------------------------------------------------
  // Group 5: Denied / Not Approved Deliberation Decisions
  // -------------------------------------------------------------
  describe('5. Not Approved Decisions & Rank Preservation', () => {
    it('5.1 records Not Approved decision and keeps current rank unchanged', () => {
      const snapshot = createPassedAdminSnapshot()
      const response = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.NOT_APPROVED,
        decisionReason: 'Quota reached for department this cycle.',
        actor: hrActor
      })

      expect(response.success).toBe(true)
      expect(response.current_rank).toBe('Assistant Professor I')
      expect(response.promotion_decision.promotion_decision).toBe('Not Approved')
      expect(response.promotion_decision.is_promoted).toBe(false)
      expect(response.promotion_decision.rank_change_applied).toBe(false)
      expect(response.promotion_decision.approved_rank_code).toBeNull()
      expect(response.promotion_decision.rank_history_entry).toBeUndefined()
    })
  })

  // -------------------------------------------------------------
  // Group 6: Part-Time & Non-Teaching Boundaries
  // -------------------------------------------------------------
  describe('6. Part-Time & Non-Teaching Boundaries', () => {
    it('6.1 blocks Part-Time faculty from Full-Time rank progression promotion', () => {
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: validPartTimeFacultyRecord,
          snapshotData: snapshot,
          decision: DECISION_VOCABULARY.APPROVED,
          approvedRankCode: 'ASSISTANT_PROFESSOR_II',
          actor: hrActor
        })
      }).toThrow(/Part-time faculty are not eligible for Full-Time rank progression/i)
    })

    it('6.2 blocks Non-Teaching personnel from participating in Faculty rank progression', () => {
      const nonTeachingSnapshot = {
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
          }
        ]
      }
      const areaAInputs = {
        total_area_a: 70.0,
        is_complete: true
      }

      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: validNonTeachingRecord,
          snapshotData: nonTeachingSnapshot,
          areaAInputs,
          decision: DECISION_VOCABULARY.APPROVED,
          approvedRankCode: 'ASSISTANT_PROFESSOR_II',
          actor: hrActor
        })
      }).toThrow(/Non-teaching personnel cannot participate in Faculty rank progression/i)
    })
  })

  // -------------------------------------------------------------
  // Group 7: Idempotency & Stability
  // -------------------------------------------------------------
  describe('7. Idempotency & Stability', () => {
    it('7.1 repeated Approved submission returns existing decision without advancing rank twice', () => {
      const snapshot = createPassedAdminSnapshot()
      const initialResponse = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.APPROVED,
        approvedRankCode: 'ASSISTANT_PROFESSOR_II',
        actor: hrActor
      })

      const existingRecord = initialResponse.promotion_decision

      const secondResponse = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.APPROVED,
        approvedRankCode: 'ASSISTANT_PROFESSOR_II',
        actor: hrActor,
        existingPromotionRecord: existingRecord
      })

      expect(secondResponse.success).toBe(true)
      expect(secondResponse.reason_code).toBe(PROMOTION_REASON_CODES.DECISION_ALREADY_RECORDED)
      expect(secondResponse.current_rank).toBe('Assistant Professor I') // No double rank advance
      expect(secondResponse.rank_change_applied).toBe(false)
    })

    it('7.2 repeated Not Approved submission returns existing decision without duplicating records', () => {
      const snapshot = createPassedAdminSnapshot()
      const initialResponse = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.NOT_APPROVED,
        actor: hrActor
      })

      const existingRecord = initialResponse.promotion_decision

      const secondResponse = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.NOT_APPROVED,
        actor: hrActor,
        existingPromotionRecord: existingRecord
      })

      expect(secondResponse.success).toBe(true)
      expect(secondResponse.reason_code).toBe(PROMOTION_REASON_CODES.DECISION_ALREADY_RECORDED)
      expect(secondResponse.current_rank).toBe('Assistant Professor I')
    })
  })

  // -------------------------------------------------------------
  // Group 8: Anti-Tampering & President Approval Isolation
  // -------------------------------------------------------------
  describe('8. Anti-Tampering & President Signature Isolation', () => {
    it('8.1 rejects forged non-existent approved rank', () => {
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: validFacultyRecord,
          snapshotData: snapshot,
          decision: DECISION_VOCABULARY.APPROVED,
          approvedRankCode: 'CHIEF_DIRECTOR_GENERAL', // Fake rank!
          actor: hrActor
        })
      }).toThrow(/not found in catalog/i)
    })

    it('8.2 rejects invalid decision vocabulary', () => {
      const snapshot = createPassedAdminSnapshot()
      expect(() => {
        PersonnelPromotionDecisionService.recordPromotionDecision({
          evaluationRecord: validFacultyRecord,
          snapshotData: snapshot,
          decision: 'Deferred', // Invalid vocabulary
          actor: hrActor
        })
      }).toThrow(/Invalid Promotion Decision/i)
    })

    it('8.3 guarantees zero auto-generated President signatures in promotion decision', () => {
      const snapshot = createPassedAdminSnapshot()
      const response = PersonnelPromotionDecisionService.recordPromotionDecision({
        evaluationRecord: validFacultyRecord,
        snapshotData: snapshot,
        decision: DECISION_VOCABULARY.APPROVED,
        approvedRankCode: 'ASSISTANT_PROFESSOR_II',
        actor: hrActor
      })

      expect(response.promotion_decision.president_signature).toBeUndefined()
      expect(response.promotion_decision.president_approval_date).toBeUndefined()
    })
  })
})
