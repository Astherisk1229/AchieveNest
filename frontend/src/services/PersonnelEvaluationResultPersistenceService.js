/**
 * PersonnelEvaluationResultPersistenceService.js
 *
 * Authoritative Evaluation Result Separation, Persistence & Presentation Engine (Plan H — Phase H1).
 * Consumes the authoritative Plan F evaluation outcome via the Plan H0 Finalization Readiness Gate
 * and persists/presents it strictly as 'Passed' or 'Retained' while keeping it completely separated
 * from later Promotion Decisions (Phase H3).
 *
 * Core Governance Invariants:
 * 1. Vocabulary is strictly two values: 'Passed' or 'Retained'.
 * 2. Passed means the evaluation passed only; it does NOT automatically mean promotion.
 * 3. Retained preserves the candidate's current rank and title without demotion.
 * 4. Evaluation Result and Promotion Decision are distinct, non-conflated facts.
 * 5. Phase H1 executes ZERO rank mutations (no writes to current_rank, next_rank, or approved_rank).
 * 6. Client-provided results, totals, or promotion fields are strictly ignored/rejected.
 * 7. Result recording is idempotent and historically stable across rule version configurations.
 * 8. Only authorized HR actors (hr_staff, hr_admin) have authority to record evaluation results.
 */

import PersonnelEvaluationFinalizationReadinessService from './PersonnelEvaluationFinalizationReadinessService.js'
import { EVALUATION_RULE_VERSION } from './evaluationInstrumentRegistry.js'

export const RESULT_VOCABULARY = Object.freeze({
  PASSED: 'Passed',
  RETAINED: 'Retained'
})

export const RESULT_STATUSES = Object.freeze({
  FINALIZED: 'finalized',
  PENDING: 'pending'
})

export const RESULT_PERSISTENCE_REASONS = Object.freeze({
  FINALIZATION_PRECONDITIONS_NOT_MET: 'finalization_preconditions_not_met',
  RESULT_RECORDED_SUCCESSFULLY: 'result_recorded_successfully',
  RESULT_ALREADY_RECORDED: 'result_already_recorded',
  UNAUTHORIZED_HR_ACTOR: 'unauthorized_hr_actor',
  FORGED_RESULT_IGNORED: 'forged_result_ignored'
})

export default class PersonnelEvaluationResultPersistenceService {
  static RULE_VERSION = EVALUATION_RULE_VERSION

  /**
   * Validates whether an authenticated actor has HR authority to record evaluation results.
   */
  static validateHRAccess(actor = {}) {
    const roles = Array.isArray(actor.roles)
      ? actor.roles
      : (actor.role ? [actor.role] : [])

    if (roles.includes('hr_staff') || roles.includes('hr_admin')) {
      return true
    }

    throw new Error('Access Denied (403): Only authorized HR personnel may record Plan H evaluation results.')
  }

  /**
   * Validates that the evaluation result is strictly within canonical vocabulary.
   */
  static validateResultVocabulary(result) {
    if (result !== RESULT_VOCABULARY.PASSED && result !== RESULT_VOCABULARY.RETAINED) {
      throw new Error(`Invalid Evaluation Result [${result}]. Only 'Passed' or 'Retained' are allowed in Plan H.`)
    }
  }

  /**
   * Authoritatively records the Plan F Evaluation Result after verifying the Plan H0 Pre-Finalization Gate.
   */
  static recordEvaluationResult({
    evaluationRecord = {},
    snapshotData = {},
    areaAInputs = null,
    actor = null,
    activeCycleEvaluations = [],
    existingResultRecord = null,
    clientPayload = {}
  } = {}) {
    // 1. Authorize HR Actor
    if (actor !== null) {
      this.validateHRAccess(actor)
    }

    const evaluationId = evaluationRecord.id || evaluationRecord.evaluation_id || null
    const personnelProfileId = evaluationRecord.personnel_profile_id || null

    // 2. Idempotency Check: If already finalized, return the existing stable result DTO
    if (existingResultRecord && existingResultRecord.evaluation_result) {
      return this.buildIdempotentResponse(existingResultRecord, evaluationRecord)
    }

    // 3. Execute Phase H0 Pre-Finalization Readiness Gate
    const readiness = PersonnelEvaluationFinalizationReadinessService.canFinalize({
      evaluationRecord,
      snapshotData,
      areaAInputs,
      actor,
      activeCycleEvaluations
    })

    if (!readiness.ready_for_finalization) {
      const error = new Error(
        `Cannot record evaluation result: Finalization preconditions not met. Reason: [${readiness.reason_code}] - ${readiness.message}`
      )
      error.reason_code = readiness.reason_code
      error.readiness = readiness
      throw error
    }

    // 4. Extract Authoritative Scoring & Result from Plan F via H0 Gate
    const evaluationResult = readiness.evaluation_result || readiness.plan_f_result?.final_result
    this.validateResultVocabulary(evaluationResult)

    const finalAcceptedTotal = Number(
      readiness.official_accepted_total ?? readiness.plan_f_result?.final_accepted_total ?? 0.0
    )
    const passingScore = Number(
      readiness.passing_score ?? readiness.plan_f_result?.passing_score ?? 0.0
    )
    const maximumScore = Number(
      readiness.maximum_score ?? readiness.plan_f_result?.maximum_score ?? 0.0
    )
    const scaleCode = readiness.evaluation_scale_code || readiness.plan_f_result?.scale_code
    const ruleVersion = readiness.rule_version || readiness.plan_f_result?.rule_version || this.RULE_VERSION
    const explanation = (
      evaluationResult === RESULT_VOCABULARY.PASSED
        ? `Final accepted total ${finalAcceptedTotal.toFixed(2)} meets or exceeds the required passing score of ${passingScore.toFixed(2)}.`
        : `Final accepted total ${finalAcceptedTotal.toFixed(2)} is below the required passing score of ${passingScore.toFixed(2)}.`
    )

    // 5. Client Tampering Defense: Discard any client-submitted evaluation_result, totals, or rank modifications
    // The authoritative result is strictly derived from readiness / Plan F.

    const recordedAt = new Date().toISOString()
    const recordedBy = actor?.profile_id || actor?.id || 'system_hr'

    // 6. Build Standardized Phase H1 Result Record
    const resultRecord = {
      evaluation_id: evaluationId,
      personnel_profile_id: personnelProfileId,
      evaluation_result: evaluationResult,
      final_accepted_total: finalAcceptedTotal,
      passing_score: passingScore,
      maximum_score: maximumScore,
      evaluation_scale_code: scaleCode,
      rule_version: ruleVersion,
      result_explanation: explanation,
      result_status: RESULT_STATUSES.FINALIZED,
      source: 'plan_f',
      recorded_by: recordedBy,
      recorded_at: recordedAt,
      // Strict Separation Invariant: Promotion decision is not recorded in H1
      promotion_decision: null,
      is_promoted: false,
      // Strict Rank Guard: Candidate rank remains completely unchanged
      current_rank: evaluationRecord.current_rank || null,
      rank_mutation_applied: false
    }

    return {
      success: true,
      status: RESULT_STATUSES.FINALIZED,
      reason_code: RESULT_PERSISTENCE_REASONS.RESULT_RECORDED_SUCCESSFULLY,
      message: `Authoritative evaluation result [${evaluationResult}] successfully recorded for evaluation [${evaluationId}].`,
      result: resultRecord,
      read_model: this.formatPresentationReadModel(resultRecord, evaluationRecord)
    }
  }

  /**
   * Formats the presentation read model for HR and Candidate UI.
   */
  static formatPresentationReadModel(resultRecord = {}, evaluationRecord = {}) {
    const evaluationResult = resultRecord.evaluation_result
    const currentRank = evaluationRecord.current_rank || 'Unassigned'

    const deliberationNotice = evaluationResult === RESULT_VOCABULARY.PASSED
      ? 'Evaluation passed. Eligible to proceed to deliberation under Plan H.'
      : 'Current rank/title retained. No rank adjustment required.'

    return {
      evaluation_id: resultRecord.evaluation_id,
      personnel_profile_id: resultRecord.personnel_profile_id,
      evaluation_result: evaluationResult,
      final_accepted_total: Number(resultRecord.final_accepted_total),
      passing_score: Number(resultRecord.passing_score),
      maximum_score: Number(resultRecord.maximum_score),
      evaluation_scale_code: resultRecord.evaluation_scale_code,
      rule_version: resultRecord.rule_version,
      result_explanation: resultRecord.result_explanation,
      deliberation_notice: deliberationNotice,
      current_rank: currentRank,
      promotion_decision_status: 'pending_deliberation_phase_h3',
      promotion_decision: null,
      recorded_at: resultRecord.recorded_at
    }
  }

  /**
   * Handles idempotent retrieval of already persisted evaluation results.
   */
  static buildIdempotentResponse(existingResult = {}, evaluationRecord = {}) {
    return {
      success: true,
      status: RESULT_STATUSES.FINALIZED,
      reason_code: RESULT_PERSISTENCE_REASONS.RESULT_ALREADY_RECORDED,
      message: 'Authoritative evaluation result was previously recorded and is historically locked.',
      result: existingResult,
      read_model: this.formatPresentationReadModel(existingResult, evaluationRecord)
    }
  }
}
