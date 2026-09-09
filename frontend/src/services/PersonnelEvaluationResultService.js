/**
 * PersonnelEvaluationResultService.js
 *
 * Canonical Authoritative Frontend Mirror & Result Determination Service for Plan F — Phase F5.
 * Determines authoritative 'Passed' or 'Retained' outcomes against canonical scale thresholds,
 * enforces unresolved evaluation protection, and validates cross-plan integration invariants.
 */

import evaluationInstrumentRegistry, {
  EVALUATION_SCALE_CODES,
  EVALUATION_RULE_VERSION,
  EVALUATION_INSTRUMENTS
} from './evaluationInstrumentRegistry.js'
import PersonnelEvaluationScoringEngine from './PersonnelEvaluationScoringEngine.js'

export const RESULT_VOCABULARY = Object.freeze({
  PASSED: 'Passed',
  RETAINED: 'Retained'
})

export const RESULT_STATUSES = Object.freeze({
  PENDING: 'pending',
  FINALIZED: 'finalized'
})

export const RESULT_REASON_CODES = Object.freeze({
  RESULT_READY: 'result_ready',
  PENDING_EVALUATOR_JUDGMENT: 'pending_evaluator_judgment',
  PENDING_NON_TEACHING_AREA_A: 'pending_non_teaching_area_a',
  MISSING_SCALE: 'missing_scale',
  MISSING_RULE_VERSION: 'missing_rule_version',
  SCORING_INCOMPLETE: 'scoring_incomplete',
  INVALID_TOTAL: 'invalid_total',
  RESULT_ALREADY_FINALIZED: 'result_already_finalized'
})

export const SCALE_THRESHOLDS = Object.freeze({
  [EVALUATION_SCALE_CODES.ADMINISTRATORS]: {
    title: 'Rating Sheet for Administrators & Academic Personnel',
    total_max: 160.0,
    passing_score: 120.0,
    area_caps: { A: 70.0, B: 50.0, C: 40.0 }
  },
  [EVALUATION_SCALE_CODES.NON_TEACHING]: {
    title: 'Rating Sheet for Non-Teaching Personnel',
    total_max: 150.0,
    passing_score: 75.0,
    area_caps: { A: 90.0, B: 60.0 }
  }
})

export default class PersonnelEvaluationResultService {
  static RULE_VERSION = EVALUATION_RULE_VERSION

  /**
   * Validates rule version.
   */
  static validateRuleVersion(ruleVersion) {
    if (!ruleVersion || ruleVersion !== EVALUATION_RULE_VERSION) {
      throw new Error(`Invalid or unsupported rule version [${ruleVersion}]. Must be [${EVALUATION_RULE_VERSION}].`)
    }
  }

  /**
   * Verifies if an evaluation can be finalized.
   */
  static canFinalizeResult({
    scaleCode,
    ruleVersion = EVALUATION_RULE_VERSION,
    itemsByArea = {},
    nonTeachingAreaACompleted = false
  } = {}) {
    if (!scaleCode || !SCALE_THRESHOLDS[scaleCode]) {
      return {
        can_finalize: false,
        reason_code: RESULT_REASON_CODES.MISSING_SCALE,
        message: 'Evaluation is missing a valid assigned evaluation scale code.',
        pending_items_count: 0,
        unresolved_items: []
      }
    }

    if (!ruleVersion || ruleVersion !== EVALUATION_RULE_VERSION) {
      return {
        can_finalize: false,
        reason_code: RESULT_REASON_CODES.MISSING_RULE_VERSION,
        message: `Evaluation rule version [${ruleVersion}] does not match canonical version [${EVALUATION_RULE_VERSION}].`,
        pending_items_count: 0,
        unresolved_items: []
      }
    }

    const unresolvedItems = []

    // Scan all items in all areas for unresolved judgment items
    Object.entries(itemsByArea).forEach(([areaCode, items]) => {
      if (!Array.isArray(items)) return
      items.forEach((item) => {
        const isJudgment = Boolean(item.evaluator_judgment_required)
        const acceptedPoints = item.accepted_points

        // null means unresolved; 0.0 is an explicit accepted score
        if (isJudgment && (acceptedPoints === null || acceptedPoints === undefined)) {
          unresolvedItems.push({
            area: areaCode,
            category: item.category_code || item.category || 'UNKNOWN',
            title: item.title || 'Accomplishment Item',
            criterion_cap: item.criterion_cap || null
          })
        }
      })
    })

    if (unresolvedItems.length > 0) {
      return {
        can_finalize: false,
        reason_code: RESULT_REASON_CODES.PENDING_EVALUATOR_JUDGMENT,
        message: `Final result cannot be determined because ${unresolvedItems.length} evaluator-judgment criterion/criteria remain unresolved.`,
        pending_items_count: unresolvedItems.length,
        unresolved_items: unresolvedItems
      }
    }

    // For Non-Teaching scale, verify official Area A evaluation
    if (scaleCode === EVALUATION_SCALE_CODES.NON_TEACHING) {
      const areaAItems = itemsByArea.A || []
      if (!nonTeachingAreaACompleted && areaAItems.length === 0) {
        return {
          can_finalize: false,
          reason_code: RESULT_REASON_CODES.PENDING_NON_TEACHING_AREA_A,
          message: 'Non-Teaching Area A (Performance and Personal Indicators) official evaluation has not been completed.',
          pending_items_count: 1,
          unresolved_items: [{ area: 'A', category: 'AREA_A_EVALUATION', title: 'Area A Official Rating Sheet' }]
        }
      }
    }

    return {
      can_finalize: true,
      reason_code: RESULT_REASON_CODES.RESULT_READY,
      message: 'All scoring items are fully resolved and eligible for result determination.',
      pending_items_count: 0,
      unresolved_items: []
    }
  }

  /**
   * Computes official accepted totals across all areas.
   */
  static calculateFinalAcceptedTotal(scaleCode, itemsByArea = {}) {
    return PersonnelEvaluationScoringEngine.calculateEvaluationTotals(scaleCode, itemsByArea)
  }

  /**
   * Determines official 'Passed' or 'Retained' result.
   */
  static determineResult({
    evaluationId = 'EVAL-' + Math.random().toString(36).substring(2, 9),
    profileId = 'PROFILE-' + Math.random().toString(36).substring(2, 9),
    scaleCode = EVALUATION_SCALE_CODES.ADMINISTRATORS,
    ruleVersion = EVALUATION_RULE_VERSION,
    itemsByArea = {},
    nonTeachingAreaACompleted = false
  } = {}) {
    const config = SCALE_THRESHOLDS[scaleCode] || SCALE_THRESHOLDS[EVALUATION_SCALE_CODES.ADMINISTRATORS]
    const passingScore = config.passing_score
    const maxScore = config.total_max
    const scaleTitle = config.title

    // 1. Check eligibility
    const finalizationCheck = this.canFinalizeResult({
      scaleCode,
      ruleVersion,
      itemsByArea,
      nonTeachingAreaACompleted
    })

    if (!finalizationCheck.can_finalize) {
      const totals = this.calculateFinalAcceptedTotal(scaleCode, itemsByArea)
      return {
        evaluation_id: evaluationId,
        personnel_profile_id: profileId,
        evaluation_scale_code: scaleCode,
        scale_title: scaleTitle,
        rule_version: ruleVersion,
        final_accepted_total: totals.capped_total_points,
        passing_score: passingScore,
        maximum_score: maxScore,
        final_result: null, // Strictly null when pending
        result_status: RESULT_STATUSES.PENDING,
        result_reason: finalizationCheck.reason_code,
        scoring_complete: false,
        pending_items_count: finalizationCheck.pending_items_count,
        unresolved_items: finalizationCheck.unresolved_items,
        explanation: finalizationCheck.message,
        areas: totals.areas,
        finalized_at: null
      }
    }

    // 2. Authoritative calculation of fully resolved totals
    const totals = this.calculateFinalAcceptedTotal(scaleCode, itemsByArea)
    const finalTotal = Number(totals.capped_total_points.toFixed(2))

    // 3. Exact Threshold Rule
    const finalResult = finalTotal >= passingScore ? RESULT_VOCABULARY.PASSED : RESULT_VOCABULARY.RETAINED

    // 4. Build Explanation
    const explanation = this.buildResultExplanation({
      scaleTitle,
      finalTotal,
      passingScore,
      finalResult
    })

    return {
      evaluation_id: evaluationId,
      personnel_profile_id: profileId,
      evaluation_scale_code: scaleCode,
      scale_title: scaleTitle,
      rule_version: ruleVersion,
      final_accepted_total: finalTotal,
      passing_score: passingScore,
      maximum_score: maxScore,
      final_result: finalResult,
      result_status: RESULT_STATUSES.FINALIZED,
      result_reason: RESULT_REASON_CODES.RESULT_READY,
      scoring_complete: true,
      pending_items_count: 0,
      unresolved_items: [],
      explanation,
      areas: totals.areas,
      finalized_at: new Date().toISOString()
    }
  }

  /**
   * Generates human-readable result explanation.
   */
  static buildResultExplanation({ scaleTitle, finalTotal, passingScore, finalResult }) {
    const formattedTotal = Number(finalTotal).toFixed(2)
    const formattedPassing = Number(passingScore).toFixed(2)

    if (finalResult === RESULT_VOCABULARY.PASSED) {
      return `Final accepted total ${formattedTotal} meets or exceeds the ${scaleTitle} passing score of ${formattedPassing}.`
    }
    return `Final accepted total ${formattedTotal} is below the ${scaleTitle} passing score of ${formattedPassing}.`
  }

  /**
   * Validates tampering attempts against canonical result DTO.
   */
  static validateResultTampering(clientPayload = {}, canonicalDto = {}) {
    if (clientPayload.passing_score !== undefined && Number(clientPayload.passing_score) !== Number(canonicalDto.passing_score)) {
      throw new Error(`Tampering detected: Client-supplied passing score [${clientPayload.passing_score}] does not match canonical threshold [${canonicalDto.passing_score}].`)
    }
    if (clientPayload.maximum_score !== undefined && Number(clientPayload.maximum_score) !== Number(canonicalDto.maximum_score)) {
      throw new Error(`Tampering detected: Client-supplied maximum score [${clientPayload.maximum_score}] does not match canonical maximum [${canonicalDto.maximum_score}].`)
    }
    if (clientPayload.final_result !== undefined && clientPayload.final_result !== canonicalDto.final_result) {
      throw new Error(`Tampering detected: Client-supplied final result [${clientPayload.final_result}] does not match authoritative calculated result [${canonicalDto.final_result}].`)
    }
  }

  /**
   * Enforces cross-plan boundaries and invariants:
   * 1. Passed != Promoted
   * 2. No automatic rank updates from Plan F
   * 3. Plan H remains sole promotion approval authority
   */
  static assertCrossPlanBoundaries(resultDto, requestedAction = {}) {
    if (requestedAction.action === 'AUTO_PROMOTE' || requestedAction.action === 'UPDATE_RANK') {
      throw new Error('Cross-plan violation: Plan F produces only Passed or Retained. Promotion and rank updates require Plan H deliberation.')
    }
    if (requestedAction.action === 'SET_ACCEPTED_POINTS' && requestedAction.source === 'PLAN_A') {
      throw new Error('Cross-plan violation: Plan A evidence claims are advisory only and cannot set official accepted points.')
    }
  }
}
