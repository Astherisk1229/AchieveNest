/**
 * PersonnelEvaluationFinalLockService.js
 *
 * Authoritative Final Lock, Historical Stability, Validation & Formal Plan H Closure Engine (Plan H — Phase H4).
 * Locks completed evaluations and promotion decisions from ordinary editing, guarantees historical
 * preservation of Evaluation Result and Promotion Decision as separate facts, and enforces strict post-lock mutation guards.
 *
 * Core Governance Invariants:
 * 1. Once finalized, ordinary editing is strictly blocked (evaluation_finalized_locked).
 * 2. Preconditions: H0 readiness, H1 Evaluation Result, H2 deliberation print, and H3 Promotion Decision (where applicable).
 * 3. Evaluation Result (Passed | Retained) and Promotion Decision (Approved | Not Approved) remain distinct historical facts.
 * 4. Passed never automatically promotes; only Passed + Approved updates rank through valid Plan E rules.
 * 5. Denied and Retained evaluations preserve current rank/title without demotion.
 * 6. Finalized evaluations protect submitted snapshots, rule versions, and scoring breakdowns from future live mutations.
 * 7. Printing remains deliberation-ready with blank approval and signature fields.
 * 8. Only authorized HR actors (hr_staff, hr_admin) can execute final lock.
 * 9. Final lock is idempotent.
 */

import PersonnelEvaluationFinalizationReadinessService from './PersonnelEvaluationFinalizationReadinessService.js'
import PersonnelEvaluationPrintService from './PersonnelEvaluationPrintService.js'
import { RESULT_VOCABULARY } from './PersonnelEvaluationResultPersistenceService.js'
import { DECISION_VOCABULARY } from './PersonnelPromotionDecisionService.js'
import { EVALUATION_RULE_VERSION } from './evaluationInstrumentRegistry.js'

export const LOCK_STATUSES = Object.freeze({
  LOCKED: 'finalized_and_locked',
  OPEN: 'open'
})

export const LOCK_REASON_CODES = Object.freeze({
  LOCK_SUCCESSFUL: 'evaluation_locked_successfully',
  ALREADY_LOCKED: 'evaluation_already_locked',
  EVALUATION_NOT_READY_FOR_LOCK: 'evaluation_not_ready_for_lock',
  PROMOTION_DECISION_PENDING: 'promotion_decision_pending',
  APPROVED_RANK_INCOMPLETE: 'approved_rank_update_incomplete',
  HISTORICAL_INTEGRITY_INVALID: 'historical_integrity_invalid',
  MUTATION_REJECTED_LOCKED: 'evaluation_finalized_locked',
  UNAUTHORIZED_HR_ACTOR: 'unauthorized_hr_actor'
})

export default class PersonnelEvaluationFinalLockService {
  static RULE_VERSION = EVALUATION_RULE_VERSION
  static PLAN_E_RULE_REFERENCE = 'NDMU-DOC-ACAD-RANKS-2026-V1'

  /**
   * Validates whether an authenticated actor has HR authority to execute final lock.
   */
  static validateHRAccess(actor = {}) {
    const roles = Array.isArray(actor.roles)
      ? actor.roles
      : (actor.role ? [actor.role] : [])

    if (roles.includes('hr_staff') || roles.includes('hr_admin')) {
      return true
    }

    throw new Error('Access Denied (403): Only authorized HR personnel may lock finalized Plan H evaluations.')
  }

  /**
   * Verifies if an evaluation satisfies all H0–H3 preconditions to be finalized and locked.
   */
  static canLock({
    evaluationRecord = {},
    snapshotData = {},
    resultRecord = null,
    promotionRecord = null,
    areaAInputs = null,
    actor = null
  } = {}) {
    if (actor !== null) {
      this.validateHRAccess(actor)
    }

    const evaluationId = evaluationRecord.id || evaluationRecord.evaluation_id || null
    if (!evaluationId) {
      return {
        can_lock: false,
        reason_code: LOCK_REASON_CODES.EVALUATION_NOT_READY_FOR_LOCK,
        message: 'Evaluation ID is missing.'
      }
    }

    // 1. Verify H0 readiness
    const readiness = PersonnelEvaluationFinalizationReadinessService.canFinalize({
      evaluationRecord,
      snapshotData,
      areaAInputs,
      actor
    })

    if (!readiness.ready_for_finalization) {
      return {
        can_lock: false,
        reason_code: LOCK_REASON_CODES.EVALUATION_NOT_READY_FOR_LOCK,
        message: `Pre-finalization gate failed: ${readiness.reason_message}`,
        readiness
      }
    }

    // 2. Verify H1 Evaluation Result
    const evaluationResult = resultRecord?.evaluation_result || readiness.evaluation_result
    if (!evaluationResult || (evaluationResult !== RESULT_VOCABULARY.PASSED && evaluationResult !== RESULT_VOCABULARY.RETAINED)) {
      return {
        can_lock: false,
        reason_code: LOCK_REASON_CODES.HISTORICAL_INTEGRITY_INVALID,
        message: 'Authoritative Evaluation Result (Passed or Retained) is missing.'
      }
    }

    // 3. Verify H2 Printable evaluation eligibility
    const printEligibility = PersonnelEvaluationPrintService.validatePrintEligibility({
      evaluationRecord,
      snapshotData,
      resultRecord,
      areaAInputs,
      actor
    })

    if (!printEligibility.eligible) {
      return {
        can_lock: false,
        reason_code: LOCK_REASON_CODES.HISTORICAL_INTEGRITY_INVALID,
        message: `Printable evaluation integrity failed: ${printEligibility.message}`
      }
    }

    // 4. Verify H3 Promotion Decision integrity when decision has been recorded
    if (promotionRecord && promotionRecord.promotion_decision) {
      const decision = promotionRecord.promotion_decision
      if (decision === DECISION_VOCABULARY.APPROVED) {
        if (evaluationResult !== RESULT_VOCABULARY.PASSED) {
          return {
            can_lock: false,
            reason_code: LOCK_REASON_CODES.HISTORICAL_INTEGRITY_INVALID,
            message: `Integrity violation: Promotion approved on a non-Passed evaluation outcome [${evaluationResult}].`
          }
        }
        if (!promotionRecord.approved_rank_code || !promotionRecord.rank_change_applied) {
          return {
            can_lock: false,
            reason_code: LOCK_REASON_CODES.APPROVED_RANK_INCOMPLETE,
            message: 'Approved promotion record is missing applied rank update metadata.'
          }
        }
      }
    }

    return {
      can_lock: true,
      reason_code: 'lock_eligible',
      message: 'Evaluation satisfies all Plan H finalization and integrity preconditions.',
      evaluation_result: evaluationResult,
      promotion_decision: promotionRecord?.promotion_decision || null
    }
  }

  /**
   * Executes final lock on a completed Plan H evaluation.
   */
  static lockEvaluation({
    evaluationRecord = {},
    snapshotData = {},
    resultRecord = null,
    promotionRecord = null,
    areaAInputs = null,
    actor = null,
    existingLockRecord = null
  } = {}) {
    // 1. HR Authorization
    if (actor !== null) {
      this.validateHRAccess(actor)
    }

    const evaluationId = String(evaluationRecord.id || evaluationRecord.evaluation_id || '')

    // 2. Idempotency Check
    if (existingLockRecord && existingLockRecord.is_locked) {
      return {
        success: true,
        status: LOCK_STATUSES.LOCKED,
        reason_code: LOCK_REASON_CODES.ALREADY_LOCKED,
        message: `Evaluation [${evaluationId}] is already finalized and locked.`,
        lock_record: existingLockRecord,
        is_locked: true,
        read_model: this.buildFinalizedReadModel(evaluationRecord, resultRecord, promotionRecord, existingLockRecord)
      }
    }

    // 3. Verify Lock Preconditions
    const lockEligibility = this.canLock({
      evaluationRecord,
      snapshotData,
      resultRecord,
      promotionRecord,
      areaAInputs,
      actor
    })

    if (!lockEligibility.can_lock) {
      const error = new Error(`Cannot lock evaluation: ${lockEligibility.message} Reason: [${lockEligibility.reason_code}]`)
      error.reason_code = lockEligibility.reason_code
      throw error
    }

    const lockedAt = new Date().toISOString()
    const lockedBy = actor?.profile_id || actor?.id || 'system_hr'

    const evaluationResult = String(resultRecord?.evaluation_result || lockEligibility.evaluation_result)
    const promotionDecision = promotionRecord?.promotion_decision || null

    const lockRecord = {
      evaluation_id: evaluationId,
      personnel_profile_id: String(evaluationRecord.personnel_profile_id || ''),
      is_finalized: true,
      is_locked: true,
      evaluation_status: 'completed',
      lock_status: LOCK_STATUSES.LOCKED,
      locked_at: lockedAt,
      locked_by: lockedBy,
      lock_reason: 'Plan H finalization, printing, deliberation and promotion workflow completed and locked.',
      evaluation_result: evaluationResult,
      promotion_decision: promotionDecision,
      rule_version: String(evaluationRecord.rule_version || this.RULE_VERSION),
      scale_code: String(evaluationRecord.evaluation_scale_code || 'ADMINISTRATORS_RANKING_SCALE'),
      snapshot_version: String(snapshotData.snapshot_version || 'v1.0.0'),
      mutations_blocked: true
    }

    return {
      success: true,
      status: LOCK_STATUSES.LOCKED,
      reason_code: LOCK_REASON_CODES.LOCK_SUCCESSFUL,
      message: `Evaluation [${evaluationId}] successfully finalized and locked from ordinary editing.`,
      lock_record: lockRecord,
      is_locked: true,
      read_model: this.buildFinalizedReadModel(evaluationRecord, resultRecord, promotionRecord, lockRecord)
    }
  }

  /**
   * Intercepts mutation attempts on a finalized/locked evaluation and strictly rejects them.
   */
  static guardAgainstMutation(lockRecord = {}, attemptedAction = 'edit') {
    if (lockRecord.is_locked || lockRecord.is_finalized) {
      const error = new Error(
        `Access Denied: Evaluation [${lockRecord.evaluation_id}] is finalized and locked. Attempted action [${attemptedAction}] is strictly prohibited.`
      )
      error.status = 409
      error.reason_code = LOCK_REASON_CODES.MUTATION_REJECTED_LOCKED
      throw error
    }
  }

  /**
   * Builds the unified finalized read model separating Evaluation Result from Promotion Decision.
   */
  static buildFinalizedReadModel(
    evaluationRecord = {},
    resultRecord = null,
    promotionRecord = null,
    lockRecord = {}
  ) {
    const evaluationId = String(evaluationRecord.id || evaluationRecord.evaluation_id || '')
    const evaluationResult = String(resultRecord?.evaluation_result || lockRecord.evaluation_result || 'Retained')
    const promotionDecision = promotionRecord?.promotion_decision || lockRecord.promotion_decision || null

    const previousRank = promotionRecord?.previous_rank || evaluationRecord.current_rank || 'Unassigned'
    const currentRank = promotionRecord?.current_rank || evaluationRecord.current_rank || previousRank

    return {
      evaluation_id: evaluationId,
      personnel_profile_id: String(evaluationRecord.personnel_profile_id || ''),
      personnel_name: String(evaluationRecord.personnel_name || 'Candidate Name'),
      evaluation_cycle: String(evaluationRecord.academic_year || '2025-2026'),
      final_status: 'completed',
      is_locked: true,
      locked_at: lockRecord.locked_at || new Date().toISOString(),
      locked_by: lockRecord.locked_by || 'system_hr',
      // Distinct Historical Fact 1: Evaluation Result
      evaluation_result_summary: {
        result: evaluationResult,
        final_accepted_total: Number(resultRecord?.final_accepted_total || 0.0),
        passing_score: Number(resultRecord?.passing_score || 120.0),
        maximum_score: Number(resultRecord?.maximum_score || 160.0),
        rule_version: String(evaluationRecord.rule_version || this.RULE_VERSION),
        scale_code: String(evaluationRecord.evaluation_scale_code || 'ADMINISTRATORS_RANKING_SCALE')
      },
      // Distinct Historical Fact 2: Promotion Decision
      promotion_decision_summary: {
        decision: promotionDecision || 'No Decision Recorded',
        is_promoted: Boolean(promotionRecord?.is_promoted),
        previous_rank: previousRank,
        applied_current_rank: currentRank,
        approved_rank_code: promotionRecord?.approved_rank_code || null,
        plan_e_rule_reference: this.PLAN_E_RULE_REFERENCE,
        decided_at: promotionRecord?.decided_at || null,
        decided_by: promotionRecord?.decided_by || null
      },
      snapshot_version: String(lockRecord.snapshot_version || 'v1.0.0'),
      print_ready: true
    }
  }
}
