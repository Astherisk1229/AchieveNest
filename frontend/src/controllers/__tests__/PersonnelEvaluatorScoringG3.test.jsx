import { describe, it, expect } from 'vitest'
import PersonnelEvaluatorScoringService, {
  JUDGMENT_MAX_POINTS,
  AREA_A_NON_TEACHING_MAX,
  AREA_A_TOTAL_MAX
} from '../../services/PersonnelEvaluatorScoringService.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from '../../services/evaluationInstrumentRegistry.js'

describe('Personnel Evaluation Track — Plan G — Phase G3: Official Accepted-Point Entry, Area A Ratings & Scoring Completion', () => {
  // Test Fixtures
  const sampleAdminRecord = {
    id: 'eval_adm_001',
    evaluation_id: 'eval_adm_001',
    personnel_profile_id: 'usr_fac_001',
    evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
    rule_version: EVALUATION_RULE_VERSION,
    evaluation_status: 'in_evaluation',
    assigned_reviewer_role: 'dean',
    evaluator_college_id: 'CEAC',
    target_college_id: 'CEAC'
  }

  const sampleNonTeachingRecord = {
    id: 'eval_nt_001',
    evaluation_id: 'eval_nt_001',
    personnel_profile_id: 'usr_staff_001',
    evaluation_scale_code: EVALUATION_SCALE_CODES.NON_TEACHING,
    rule_version: EVALUATION_RULE_VERSION,
    evaluation_status: 'in_evaluation',
    assigned_reviewer_role: 'hr'
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

  const candidateActor = {
    profile_id: 'usr_fac_001',
    roles: ['faculty']
  }

  const createAdminSnapshot = () => ({
    items: [
      {
        id: 'item_a1',
        area: 'A',
        category: 'A.1 Doctorate Degree',
        raw_points: 60.0,
        capped_points: 60.0,
        evaluator_judgment_required: false,
        accepted_points: null
      },
      {
        id: 'item_b3',
        area: 'B',
        category: 'B.3 Conduct of Research',
        raw_points: 40.0,
        capped_points: 40.0,
        evaluator_judgment_required: true,
        accepted_points: null
      },
      {
        id: 'item_b6',
        area: 'B',
        category: 'B.6 Creative Work',
        raw_points: 20.0,
        capped_points: 20.0,
        evaluator_judgment_required: true,
        accepted_points: null
      },
      {
        id: 'item_c1',
        area: 'C',
        category: 'C.1 Community Outreach',
        raw_points: 30.0,
        capped_points: 30.0,
        evaluator_judgment_required: false,
        accepted_points: null
      }
    ]
  })

  const createNonTeachingSnapshot = () => ({
    items: [
      {
        id: 'item_nt_b1',
        area: 'B',
        category: 'B.1 Service Years',
        raw_points: 20.0,
        capped_points: 20.0,
        evaluator_judgment_required: false,
        accepted_points: null
      },
      {
        id: 'item_nt_b5',
        area: 'B',
        category: 'B.5 Recognition / Meritorious Award',
        raw_points: 30.0,
        capped_points: 30.0,
        evaluator_judgment_required: true,
        accepted_points: null
      }
    ]
  })

  // 1. Authorization & Role Scoping
  describe('1. Reviewer Authorization & Scoping', () => {
    it('allows assigned Dean within same college to score evaluation', () => {
      const snapshot = createAdminSnapshot()
      const result = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 35.0,
        reason: 'Verified indexed research publication.'
      })
      expect(result.scoring_complete).toBe(false) // item_b6 still null
      expect(result.area_raw_sums.B).toBe(35.0)
    })

    it('denies cross-college Dean from submitting accepted points (403)', () => {
      const snapshot = createAdminSnapshot()
      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: sampleAdminRecord,
          reviewerActor: deanCBA,
          snapshotData: snapshot,
          itemId: 'item_b3',
          acceptedPoints: 35.0
        })
      }).toThrow(/Cross-college access prohibited/i)
    })

    it('allows assigned HR evaluator to score HR-routed evaluation', () => {
      const snapshot = createNonTeachingSnapshot()
      const result = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleNonTeachingRecord,
        reviewerActor: hrEvaluator,
        snapshotData: snapshot,
        itemId: 'item_nt_b5',
        acceptedPoints: 25.0
      })
      expect(result.area_raw_sums.B).toBe(45.0) // 20 (deterministic B.1) + 25 (B.5 accepted)
    })

    it('denies Department Secretary from submitting evaluator points (403)', () => {
      const snapshot = createAdminSnapshot()
      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: sampleAdminRecord,
          reviewerActor: departmentSecretary,
          snapshotData: snapshot,
          itemId: 'item_b3',
          acceptedPoints: 35.0
        })
      }).toThrow(/Department Secretary role does not possess evaluator authority/i)
    })

    it('denies self-review when candidate attempts to score own evaluation (403)', () => {
      const snapshot = createAdminSnapshot()
      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: sampleAdminRecord,
          reviewerActor: candidateActor,
          snapshotData: snapshot,
          itemId: 'item_b3',
          acceptedPoints: 35.0
        })
      }).toThrow(/Self-review prohibited/i)
    })

    it('denies scoring when evaluation is not in an active review state (400)', () => {
      const snapshot = createAdminSnapshot()
      const draftRecord = { ...sampleAdminRecord, evaluation_status: 'draft' }
      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: draftRecord,
          reviewerActor: deanCEAC,
          snapshotData: snapshot,
          itemId: 'item_b3',
          acceptedPoints: 35.0
        })
      }).toThrow(/not open for evaluator scoring/i)
    })
  })

  // 2. Judgment Criteria Validation
  describe('2. Judgment Criteria Range & Semantic Null Handling', () => {
    it('Admin B.3 accepts numeric 0 to 40.0 points', () => {
      const snapshot = createAdminSnapshot()
      const res = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 40.0
      })
      expect(snapshot.items[1].accepted_points).toBe(40.0)
      expect(snapshot.items[1].scoring_status).toBe('scored')
    })

    it('Admin B.3 rejects value exceeding maximum (e.g. 45.0)', () => {
      const snapshot = createAdminSnapshot()
      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: sampleAdminRecord,
          reviewerActor: deanCEAC,
          snapshotData: snapshot,
          itemId: 'item_b3',
          acceptedPoints: 45.0
        })
      }).toThrow(/exceeds maximum allowed \[40\]/i)
    })

    it('Admin B.6 accepts numeric 0 to 20.0 points and rejects values > 20', () => {
      const snapshot = createAdminSnapshot()
      const resValid = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b6',
        acceptedPoints: 20.0
      })
      expect(snapshot.items[2].accepted_points).toBe(20.0)

      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: sampleAdminRecord,
          reviewerActor: deanCEAC,
          snapshotData: snapshot,
          itemId: 'item_b6',
          acceptedPoints: 25.0
        })
      }).toThrow(/exceeds maximum allowed \[20\]/i)
    })

    it('Non-Teaching B.5 accepts numeric 0 to 30.0 points and rejects values > 30', () => {
      const snapshot = createNonTeachingSnapshot()
      const resValid = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleNonTeachingRecord,
        reviewerActor: hrEvaluator,
        snapshotData: snapshot,
        itemId: 'item_nt_b5',
        acceptedPoints: 30.0
      })
      expect(snapshot.items[1].accepted_points).toBe(30.0)

      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: sampleNonTeachingRecord,
          reviewerActor: hrEvaluator,
          snapshotData: snapshot,
          itemId: 'item_nt_b5',
          acceptedPoints: 35.0
        })
      }).toThrow(/exceeds maximum allowed \[30\]/i)
    })

    it('rejects negative accepted points', () => {
      const snapshot = createAdminSnapshot()
      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: sampleAdminRecord,
          reviewerActor: deanCEAC,
          snapshotData: snapshot,
          itemId: 'item_b3',
          acceptedPoints: -5.0
        })
      }).toThrow(/cannot be negative/i)
    })

    it('differentiates null (unresolved) from explicit 0.0 (resolved)', () => {
      const snapshot = createAdminSnapshot()
      
      // Explicit 0.0
      const res = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 0.0
      })
      expect(snapshot.items[1].accepted_points).toBe(0.0)
      expect(snapshot.items[1].scoring_status).toBe('scored')

      // Reset to null
      PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: null
      })
      expect(snapshot.items[1].accepted_points).toBe(null)
      expect(snapshot.items[1].scoring_status).toBe('awaiting_evaluator')
    })
  })

  // 3. Deterministic Scoring Protection
  describe('3. Deterministic Criteria Protection', () => {
    it('rejects arbitrary manual override on deterministic criterion', () => {
      const snapshot = createAdminSnapshot()
      // item_a1 is A.1 Doctorate Degree (calculated 60.0)
      expect(() => {
        PersonnelEvaluatorScoringService.submitAcceptedPoints({
          evaluationRecord: sampleAdminRecord,
          reviewerActor: deanCEAC,
          snapshotData: snapshot,
          itemId: 'item_a1',
          acceptedPoints: 70.0 // arbitrary override
        })
      }).toThrow(/Arbitrary override of deterministic Plan F scoring is prohibited/i)
    })

    it('permits confirmation of calculated Plan F value on deterministic criterion', () => {
      const snapshot = createAdminSnapshot()
      const res = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_a1',
        acceptedPoints: 60.0 // matching calculated
      })
      expect(snapshot.items[0].accepted_points).toBe(60.0)
      expect(snapshot.items[0].scoring_status).toBe('scored')
    })
  })

  // 4. Non-Teaching Area A Evaluator Inputs
  describe('4. Non-Teaching Area A Evaluator Inputs', () => {
    it('accepts valid Area A rating inputs by authorized HR evaluator', () => {
      const res = PersonnelEvaluatorScoringService.submitNonTeachingAreaAInput({
        evaluationRecord: sampleNonTeachingRecord,
        reviewerActor: hrEvaluator,
        areaAInputs: {
          job_performance: 48.0,
          personal_attitudes: 9.0,
          efficiency: 28.0
        },
        reason: 'Annual Performance Appraisal 2026'
      })
      expect(res.success).toBe(true)
      expect(res.area_a_inputs.total_area_a).toBe(85.0)
      expect(res.area_a_inputs.is_complete).toBe(true)
    })

    it('rejects Area A input when component exceeds maximum', () => {
      // Job performance max 50
      expect(() => {
        PersonnelEvaluatorScoringService.submitNonTeachingAreaAInput({
          evaluationRecord: sampleNonTeachingRecord,
          reviewerActor: hrEvaluator,
          areaAInputs: {
            job_performance: 55.0,
            personal_attitudes: 8.0,
            efficiency: 25.0
          }
        })
      }).toThrow(/Job Performance points \[55\] exceeds allowed range/i)

      // Personal attitudes max 10
      expect(() => {
        PersonnelEvaluatorScoringService.submitNonTeachingAreaAInput({
          evaluationRecord: sampleNonTeachingRecord,
          reviewerActor: hrEvaluator,
          areaAInputs: {
            job_performance: 45.0,
            personal_attitudes: 15.0,
            efficiency: 25.0
          }
        })
      }).toThrow(/Personal Attitudes and Qualities points \[15\] exceeds allowed range/i)
    })

    it('rejects submitting Area A ratings on Administrators scale', () => {
      expect(() => {
        PersonnelEvaluatorScoringService.submitNonTeachingAreaAInput({
          evaluationRecord: sampleAdminRecord,
          reviewerActor: hrEvaluator,
          areaAInputs: {
            job_performance: 40.0,
            personal_attitudes: 8.0,
            efficiency: 20.0
          }
        })
      }).toThrow(/Area A evaluator ratings only apply to Non-Teaching/i)
    })
  })

  // 5. Totals, Caps & Idempotency
  describe('5. Totals Recalculation, Area Caps & Idempotency', () => {
    it('recalculates Area totals and overall totals respecting Plan F caps', () => {
      const snapshot = createAdminSnapshot()
      
      // Score B.3 = 40, B.6 = 20 -> Area B raw sum = 60 -> Capped at 50!
      PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 40.0
      })
      const finalRes = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b6',
        acceptedPoints: 20.0
      })

      expect(finalRes.area_raw_sums.B).toBe(60.0)
      expect(finalRes.area_capped_totals.B).toBe(50.0) // Cap enforced!
      expect(finalRes.area_capped_totals.A).toBe(60.0)
      expect(finalRes.area_capped_totals.C).toBe(30.0)
      expect(finalRes.official_accepted_total).toBe(140.0) // 60 + 50 + 30 = 140
      expect(finalRes.scoring_complete).toBe(true)
      expect(finalRes.plan_f_final_result).toBe('Passed') // >= 120
    })

    it('preserves idempotency on repeated save with identical values', () => {
      const snapshot = createAdminSnapshot()
      
      const res1 = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 30.0
      })
      const res2 = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 30.0
      })

      expect(res1.official_accepted_total).toBe(res2.official_accepted_total)
      expect(res1.pending_judgment_count).toBe(res2.pending_judgment_count)
      expect(snapshot.items.length).toBe(4) // No item duplication
    })
  })

  // 6. Result Determination Boundary
  describe('6. Plan F Result Integration & Completion State', () => {
    it('keeps Plan F result status pending while judgment criteria remain unresolved', () => {
      const snapshot = createAdminSnapshot()
      // B.3 is scored, but B.6 remains null
      const res = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 30.0
      })
      expect(res.scoring_complete).toBe(false)
      expect(res.plan_f_result_status).toBe('pending')
      expect(res.plan_f_final_result).toBe(null)
    })

    it('determines Retained outcome when scoring complete but total below passing score', () => {
      const snapshot = createAdminSnapshot()
      
      // Score low points: A = 60, B.3 = 10, B.6 = 5, C = 30 -> Total = 105 (Passing is 120)
      PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b3',
        acceptedPoints: 10.0
      })
      const res = PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleAdminRecord,
        reviewerActor: deanCEAC,
        snapshotData: snapshot,
        itemId: 'item_b6',
        acceptedPoints: 5.0
      })

      expect(res.scoring_complete).toBe(true)
      expect(res.official_accepted_total).toBe(105.0)
      expect(res.plan_f_result_status).toBe('result_ready')
      expect(res.plan_f_final_result).toBe('Retained') // 105 < 120
    })

    it('Non-Teaching scoring completion requires both Area A and Area B complete', () => {
      const snapshot = createNonTeachingSnapshot()
      
      // Score Area B judgment item B.5
      PersonnelEvaluatorScoringService.submitAcceptedPoints({
        evaluationRecord: sampleNonTeachingRecord,
        reviewerActor: hrEvaluator,
        snapshotData: snapshot,
        itemId: 'item_nt_b5',
        acceptedPoints: 20.0
      })

      // Without Area A inputs -> incomplete
      const stateWithoutA = PersonnelEvaluatorScoringService.recalculateScoringState({
        evaluationRecord: sampleNonTeachingRecord,
        snapshotData: snapshot,
        areaAInputs: null
      })
      expect(stateWithoutA.scoring_complete).toBe(false)
      expect(stateWithoutA.plan_f_final_result).toBe(null)

      // With complete Area A inputs (Job Performance: 45, Personal Attitudes: 9, Efficiency: 26 = 80)
      const areaAData = {
        job_performance: 45.0,
        personal_attitudes: 9.0,
        efficiency: 26.0,
        total_area_a: 80.0,
        is_complete: true
      }
      const stateWithA = PersonnelEvaluatorScoringService.recalculateScoringState({
        evaluationRecord: sampleNonTeachingRecord,
        snapshotData: snapshot,
        areaAInputs: areaAData
      })
      expect(stateWithA.scoring_complete).toBe(true)
      // Area A (80) + Area B (20+20=40) = 120. Passing is 75 -> Passed
      expect(stateWithA.official_accepted_total).toBe(120.0)
      expect(stateWithA.plan_f_final_result).toBe('Passed')
    })
  })
})
