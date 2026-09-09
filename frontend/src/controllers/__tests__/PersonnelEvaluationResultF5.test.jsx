import { describe, it, expect } from 'vitest'
import PersonnelEvaluationResultService, {
  RESULT_VOCABULARY,
  RESULT_STATUSES,
  RESULT_REASON_CODES,
  SCALE_THRESHOLDS
} from '../../services/PersonnelEvaluationResultService.js'
import PersonnelEvaluationScoringEngine from '../../services/PersonnelEvaluationScoringEngine.js'
import evaluationScaleAssignmentService from '../../services/evaluationScaleAssignmentService.js'
import evaluationInstrumentRegistry, {
  EVALUATION_SCALE_CODES,
  EVALUATION_RULE_VERSION
} from '../../services/evaluationInstrumentRegistry.js'

describe('Personnel Evaluation Track — Plan F — Phase F5: Result Determination, Integration & Closure Suite', () => {

  // =========================================================================
  // 1. Scale Assignment & Personnel Classification Baseline (F1 Reconciliation)
  // =========================================================================
  describe('1. Authoritative Scale Assignment Baseline', () => {
    it('assigns ADMINISTRATORS_RANKING_SCALE for Faculty + Academic', () => {
      const scale = evaluationScaleAssignmentService.resolveScaleFromContextSync({
        personnel_group: 'faculty',
        organizational_side: 'academic'
      })
      expect(scale.scale_code).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
      expect(scale.rule_version).toBe(EVALUATION_RULE_VERSION)
    })

    it('assigns ADMINISTRATORS_RANKING_SCALE for Non-Teaching Faculty + Academic', () => {
      const scale = evaluationScaleAssignmentService.resolveScaleFromContextSync({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic'
      })
      expect(scale.scale_code).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
    })

    it('assigns NON_TEACHING_PERSONNEL_RANKING_SCALE for Non-Teaching Faculty + Non-Academic', () => {
      const scale = evaluationScaleAssignmentService.resolveScaleFromContextSync({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic'
      })
      expect(scale.scale_code).toBe(EVALUATION_SCALE_CODES.NON_TEACHING)
      expect(scale.rule_version).toBe(EVALUATION_RULE_VERSION)
    })

    it('strictly rejects invalid combination Faculty + Non-Academic', () => {
      const scale = evaluationScaleAssignmentService.resolveScaleFromContextSync({
        personnel_group: 'faculty',
        organizational_side: 'non_academic'
      })
      expect(scale.assignment_status).toBe('rejected')
      expect(scale.scale_code).toBeNull()

      expect(() => {
        evaluationInstrumentRegistry.resolveScaleCode('faculty', 'non_academic')
      }).toThrow(/Invalid personnel classification/i)
    })
  })

  // =========================================================================
  // 2. Unresolved Evaluation Protection & Reason Codes
  // =========================================================================
  describe('2. Unresolved Evaluation Protection & Pending States', () => {
    it('blocks finalization when an evaluator-judgment item has accepted_points = null', () => {
      const context = {
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        ruleVersion: EVALUATION_RULE_VERSION,
        itemsByArea: {
          A: [{ accepted_points: 40.0 }],
          B: [
            {
              category_code: 'B.3',
              title: 'Institutional Research Study',
              evaluator_judgment_required: true,
              criterion_cap: 40.0,
              accepted_points: null // Unresolved
            }
          ],
          C: [{ accepted_points: 20.0 }]
        }
      }

      const check = PersonnelEvaluationResultService.canFinalizeResult(context)
      expect(check.can_finalize).toBe(false)
      expect(check.reason_code).toBe(RESULT_REASON_CODES.PENDING_EVALUATOR_JUDGMENT)
      expect(check.pending_items_count).toBe(1)

      const result = PersonnelEvaluationResultService.determineResult(context)
      expect(result.result_status).toBe(RESULT_STATUSES.PENDING)
      expect(result.final_result).toBeNull()
      expect(result.scoring_complete).toBe(false)
      expect(result.explanation).toContain('evaluator-judgment criterion/criteria remain unresolved')
    })

    it('blocks Non-Teaching finalization when Area A evaluation is not completed', () => {
      const context = {
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        ruleVersion: EVALUATION_RULE_VERSION,
        nonTeachingAreaACompleted: false,
        itemsByArea: {
          A: [], // Empty Area A
          B: [{ accepted_points: 30.0 }]
        }
      }

      const check = PersonnelEvaluationResultService.canFinalizeResult(context)
      expect(check.can_finalize).toBe(false)
      expect(check.reason_code).toBe(RESULT_REASON_CODES.PENDING_NON_TEACHING_AREA_A)

      const result = PersonnelEvaluationResultService.determineResult(context)
      expect(result.result_status).toBe(RESULT_STATUSES.PENDING)
      expect(result.final_result).toBeNull()
    })

    it('distinguishes explicit zero (0.0) from unresolved null: explicit zero allows finalization', () => {
      const context = {
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        ruleVersion: EVALUATION_RULE_VERSION,
        itemsByArea: {
          A: [{ accepted_points: 70.0 }],
          B: [
            {
              category_code: 'B.3',
              title: 'Institutional Research Study',
              evaluator_judgment_required: true,
              criterion_cap: 40.0,
              accepted_points: 0.0 // Evaluator explicitly gave 0 points
            },
            { accepted_points: 30.0 }
          ],
          C: [{ accepted_points: 20.0 }]
        }
      }

      const check = PersonnelEvaluationResultService.canFinalizeResult(context)
      expect(check.can_finalize).toBe(true)
      expect(check.reason_code).toBe(RESULT_REASON_CODES.RESULT_READY)

      const result = PersonnelEvaluationResultService.determineResult(context)
      expect(result.result_status).toBe(RESULT_STATUSES.FINALIZED)
      expect(result.final_accepted_total).toBe(120.0)
      expect(result.final_result).toBe(RESULT_VOCABULARY.PASSED)
    })

    it('blocks finalization if rule version is missing or invalid', () => {
      const context = {
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        ruleVersion: 'INVALID-RULE-VERSION',
        itemsByArea: { A: [{ accepted_points: 50 }] }
      }

      const check = PersonnelEvaluationResultService.canFinalizeResult(context)
      expect(check.can_finalize).toBe(false)
      expect(check.reason_code).toBe(RESULT_REASON_CODES.MISSING_RULE_VERSION)
    })
  })

  // =========================================================================
  // 3. Administrators Ranking Scale Passing Threshold Boundaries (120.0 / 160.0)
  // =========================================================================
  describe('3. Administrators Scale Passing Threshold Boundaries', () => {
    it('determines Retained for total 0.00', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: { A: [], B: [], C: [] }
      })
      expect(result.final_accepted_total).toBe(0.0)
      expect(result.final_result).toBe(RESULT_VOCABULARY.RETAINED)
      expect(result.result_status).toBe(RESULT_STATUSES.FINALIZED)
      expect(result.explanation).toContain('is below the Rating Sheet for Administrators & Academic Personnel passing score of 120.00')
    })

    it('determines Retained for total 119.99 (just below passing score)', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: {
          A: [{ accepted_points: 69.99 }],
          B: [{ accepted_points: 40.0 }],
          C: [{ accepted_points: 10.0 }]
        }
      })
      expect(result.final_accepted_total).toBe(119.99)
      expect(result.final_result).toBe(RESULT_VOCABULARY.RETAINED)
    })

    it('determines Passed for exact passing threshold 120.00', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: {
          A: [{ accepted_points: 70.0 }],
          B: [{ accepted_points: 30.0 }],
          C: [{ accepted_points: 20.0 }]
        }
      })
      expect(result.final_accepted_total).toBe(120.0)
      expect(result.final_result).toBe(RESULT_VOCABULARY.PASSED)
      expect(result.explanation).toContain('meets or exceeds the Rating Sheet for Administrators & Academic Personnel passing score of 120.00')
    })

    it('determines Passed for total 120.01 (just above passing score)', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: {
          A: [{ accepted_points: 70.0 }],
          B: [{ accepted_points: 30.01 }],
          C: [{ accepted_points: 20.0 }]
        }
      })
      expect(result.final_accepted_total).toBe(120.01)
      expect(result.final_result).toBe(RESULT_VOCABULARY.PASSED)
    })

    it('determines Passed for perfect scale maximum 160.00', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: {
          A: [{ accepted_points: 70.0 }],
          B: [{ accepted_points: 50.0 }],
          C: [{ accepted_points: 40.0 }]
        }
      })
      expect(result.final_accepted_total).toBe(160.0)
      expect(result.final_result).toBe(RESULT_VOCABULARY.PASSED)
    })

    it('strictly caps total at 160.00 even if raw inputs exceed max', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: {
          A: [{ accepted_points: 90.0 }], // Area A capped at 70
          B: [{ accepted_points: 80.0 }], // Area B capped at 50
          C: [{ accepted_points: 60.0 }]  // Area C capped at 40
        }
      })
      expect(result.final_accepted_total).toBe(160.0)
      expect(result.final_result).toBe(RESULT_VOCABULARY.PASSED)
    })
  })

  // =========================================================================
  // 4. Non-Teaching Personnel Ranking Scale Passing Threshold Boundaries (75.0 / 150.0)
  // =========================================================================
  describe('4. Non-Teaching Scale Passing Threshold Boundaries', () => {
    it('determines Retained for total 0.00 with completed Area A', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        nonTeachingAreaACompleted: true,
        itemsByArea: {
          A: [{ accepted_points: 0.0 }],
          B: []
        }
      })
      expect(result.final_accepted_total).toBe(0.0)
      expect(result.final_result).toBe(RESULT_VOCABULARY.RETAINED)
      expect(result.explanation).toContain('is below the Rating Sheet for Non-Teaching Personnel passing score of 75.00')
    })

    it('determines Retained for total 74.99 (just below passing score 75.0)', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        nonTeachingAreaACompleted: true,
        itemsByArea: {
          A: [{ accepted_points: 54.99 }],
          B: [{ accepted_points: 20.0 }]
        }
      })
      expect(result.final_accepted_total).toBe(74.99)
      expect(result.final_result).toBe(RESULT_VOCABULARY.RETAINED)
    })

    it('determines Passed for exact passing threshold 75.00', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        nonTeachingAreaACompleted: true,
        itemsByArea: {
          A: [{ accepted_points: 50.0 }],
          B: [{ accepted_points: 25.0 }]
        }
      })
      expect(result.final_accepted_total).toBe(75.0)
      expect(result.final_result).toBe(RESULT_VOCABULARY.PASSED)
      expect(result.explanation).toContain('meets or exceeds the Rating Sheet for Non-Teaching Personnel passing score of 75.00')
    })

    it('determines Passed for total 75.01 (just above passing score)', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        nonTeachingAreaACompleted: true,
        itemsByArea: {
          A: [{ accepted_points: 50.0 }],
          B: [{ accepted_points: 25.01 }]
        }
      })
      expect(result.final_accepted_total).toBe(75.01)
      expect(result.final_result).toBe(RESULT_VOCABULARY.PASSED)
    })

    it('determines Passed for maximum 150.00', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        nonTeachingAreaACompleted: true,
        itemsByArea: {
          A: [{ accepted_points: 90.0 }],
          B: [{ accepted_points: 60.0 }]
        }
      })
      expect(result.final_accepted_total).toBe(150.0)
      expect(result.final_result).toBe(RESULT_VOCABULARY.PASSED)
    })
  })

  // =========================================================================
  // 5. Result Tampering & Security Rejections
  // =========================================================================
  describe('5. Client Tampering & Security Rejection', () => {
    it('detects and rejects client-supplied fake Passed result with score below threshold', () => {
      const canonicalDto = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: { A: [{ accepted_points: 50.0 }] }
      })
      expect(canonicalDto.final_result).toBe(RESULT_VOCABULARY.RETAINED)

      const forgedPayload = {
        final_result: 'Passed' // Client attempt to forge Passed
      }

      expect(() => {
        PersonnelEvaluationResultService.validateResultTampering(forgedPayload, canonicalDto)
      }).toThrow(/Tampering detected: Client-supplied final result/i)
    })

    it('detects and rejects client-supplied altered passing threshold', () => {
      const canonicalDto = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: { A: [{ accepted_points: 60.0 }] }
      })

      const forgedPayload = {
        passing_score: 50.0 // Client attempt to lower passing threshold
      }

      expect(() => {
        PersonnelEvaluationResultService.validateResultTampering(forgedPayload, canonicalDto)
      }).toThrow(/Tampering detected: Client-supplied passing score/i)
    })

    it('detects and rejects client-supplied altered maximum score', () => {
      const canonicalDto = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        nonTeachingAreaACompleted: true,
        itemsByArea: { A: [{ accepted_points: 50.0 }] }
      })

      const forgedPayload = {
        maximum_score: 200.0 // Client attempt to increase maximum score
      }

      expect(() => {
        PersonnelEvaluationResultService.validateResultTampering(forgedPayload, canonicalDto)
      }).toThrow(/Tampering detected: Client-supplied maximum score/i)
    })
  })

  // =========================================================================
  // 6. Cross-Plan Integration & Ownership Boundary Invariants
  // =========================================================================
  describe('6. Cross-Plan Invariants (Passed != Promoted)', () => {
    it('enforces that Passed result cannot trigger automatic rank upgrade (Plan H invariant)', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: {
          A: [{ accepted_points: 70.0 }],
          B: [{ accepted_points: 30.0 }],
          C: [{ accepted_points: 20.0 }]
        }
      })
      expect(result.final_result).toBe(RESULT_VOCABULARY.PASSED)

      // Attempting to invoke rank change or promotion directly under Plan F must be blocked
      expect(() => {
        PersonnelEvaluationResultService.assertCrossPlanBoundaries(result, { action: 'AUTO_PROMOTE' })
      }).toThrow(/Cross-plan violation: Plan F produces only Passed or Retained/i)

      expect(() => {
        PersonnelEvaluationResultService.assertCrossPlanBoundaries(result, { action: 'UPDATE_RANK' })
      }).toThrow(/Promotion and rank updates require Plan H deliberation/i)
    })

    it('enforces that Plan A evidence claims cannot mutate official accepted scores', () => {
      expect(() => {
        PersonnelEvaluationResultService.assertCrossPlanBoundaries({}, {
          action: 'SET_ACCEPTED_POINTS',
          source: 'PLAN_A'
        })
      }).toThrow(/Plan A evidence claims are advisory only/i)
    })

    it('verifies that Result DTO contains zero Plan G or Plan H ownership fields', () => {
      const result = PersonnelEvaluationResultService.determineResult({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: { A: [{ accepted_points: 70.0 }] }
      })

      expect(result.promotion_approved).toBeUndefined()
      expect(result.new_rank).toBeUndefined()
      expect(result.reviewer_route).toBeUndefined()
      expect(result.rank_progression_result).toBeUndefined()
    })
  })
})
