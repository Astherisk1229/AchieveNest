/**
 * PersonnelEvaluationPlanHHandoffService.js
 *
 * Canonical Authoritative Frontend Mirror for Plan G — Phase G4.
 * Validates that an evaluation has satisfied all reviewer routing, snapshot review,
 * evaluator judgment scoring, and Plan F result requirements before permitting handoff
 * to Plan H Institutional Promotion Deliberation.
 *
 * Core Governance Invariants:
 * 1. Plan G terminates at reviewer completion and handoff readiness.
 * 2. Plan G does NOT make promotion decisions, approve rank progression, or mutate personnel rank.
 * 3. Handoff to Plan H requires 100% scoring completeness, zero unresolved judgment items, and canonical Plan F result.
 * 4. The handoff payload contains strictly verified evaluation metadata and zero promotion outcome fields.
 */

import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from './evaluationInstrumentRegistry.js'
import PersonnelEvaluatorScoringService from './PersonnelEvaluatorScoringService.js'

export const HANDOFF_STATUSES = Object.freeze({
  READY: 'ready_for_plan_h',
  NOT_READY: 'handoff_not_ready'
})

export const HANDOFF_REASON_CODES = Object.freeze({
  HANDOFF_READY: 'handoff_ready',
  SCORING_INCOMPLETE: 'scoring_incomplete',
  RESULT_PENDING: 'result_pending',
  REVIEW_INCOMPLETE: 'review_incomplete',
  REVIEWER_ASSIGNMENT_INVALID: 'reviewer_assignment_invalid',
  SNAPSHOT_INVALID: 'snapshot_invalid',
  EVALUATION_STATE_INVALID: 'evaluation_state_invalid'
})

export default class PersonnelEvaluationPlanHHandoffService {
  static RULE_VERSION = EVALUATION_RULE_VERSION

  /**
   * Checks whether an evaluation satisfies all criteria to be handed off to Plan H.
   */
  static checkHandoffReadiness({
    evaluationRecord = {},
    snapshotData = {},
    areaAInputs = null,
    scoringState = null
  } = {}) {
    // 1. Validate Reviewer Assignment
    const assignedRole = evaluationRecord.assigned_reviewer_role || evaluationRecord.evaluator_role || null
    if (!assignedRole) {
      return {
        is_ready: false,
        reason_code: HANDOFF_REASON_CODES.REVIEWER_ASSIGNMENT_INVALID,
        message: 'Reviewer assignment is missing or unresolved.'
      }
    }

    // 2. Validate Snapshot
    if (!snapshotData || !Array.isArray(snapshotData.items)) {
      return {
        is_ready: false,
        reason_code: HANDOFF_REASON_CODES.SNAPSHOT_INVALID,
        message: 'Submitted snapshot data is missing or malformed.'
      }
    }

    // 3. Compute Scoring State
    const state = scoringState || PersonnelEvaluatorScoringService.recalculateScoringState({
      evaluationRecord,
      snapshotData,
      areaAInputs
    })

    // 4. Scoring Completeness Check
    if (!state.scoring_complete || (state.pending_judgment_count || 0) > 0) {
      return {
        is_ready: false,
        reason_code: HANDOFF_REASON_CODES.SCORING_INCOMPLETE,
        message: 'Evaluation scoring is incomplete. Unresolved evaluator inputs remain.',
        pending_judgment_count: state.pending_judgment_count || 0
      }
    }

    // 5. Plan F Result Check
    if (state.plan_f_result_status !== 'result_ready' || !state.plan_f_final_result) {
      return {
        is_ready: false,
        reason_code: HANDOFF_REASON_CODES.RESULT_PENDING,
        message: 'Authoritative Plan F evaluation result is pending or undetermined.'
      }
    }

    return {
      is_ready: true,
      reason_code: HANDOFF_REASON_CODES.HANDOFF_READY,
      message: 'Evaluation is scoring-complete, Plan F result determined, and ready for Plan H deliberation.',
      scoring_state: state
    }
  }

  /**
   * Assembles the canonical, verified Plan H Handoff Payload DTO.
   */
  static generatePlanHHandoffPayload({
    evaluationRecord = {},
    snapshotData = {},
    areaAInputs = null,
    scoringState = null
  } = {}) {
    const readiness = this.checkHandoffReadiness({
      evaluationRecord,
      snapshotData,
      areaAInputs,
      scoringState
    })

    if (!readiness.is_ready) {
      throw new Error(`Cannot generate Plan H handoff payload: Evaluation is not ready for deliberation [${readiness.reason_code}]: ${readiness.message}`)
    }

    const state = readiness.scoring_state

    return {
      evaluation_id: String(evaluationRecord.id || evaluationRecord.evaluation_id || 'EVAL-UNKNOWN'),
      personnel_profile_id: String(evaluationRecord.personnel_profile_id || ''),
      personnel_name: String(evaluationRecord.personnel_name || evaluationRecord.faculty_name || 'Candidate Name'),
      current_rank: String(evaluationRecord.current_rank || evaluationRecord.academic_rank || 'Assistant Professor I'),
      evaluation_scale_code: String(evaluationRecord.evaluation_scale_code || EVALUATION_SCALE_CODES.ADMINISTRATORS),
      rule_version: String(evaluationRecord.rule_version || this.RULE_VERSION),
      official_accepted_total: Number(state.official_accepted_total || 0.0),
      maximum_score: Number(state.maximum_score || 160.0),
      passing_score: Number(state.passing_score || 120.0),
      plan_f_final_result: String(state.plan_f_final_result || 'Retained'),
      assigned_reviewer_role: String(evaluationRecord.assigned_reviewer_role || 'dean'),
      reviewer_user_id: String(evaluationRecord.reviewer_user_id || 'reviewer'),
      reviewed_at: new Date().toISOString(),
      scoring_complete: true,
      snapshot_version: String(snapshotData.snapshot_version || 'v1.0.0'),
      handoff_status: HANDOFF_STATUSES.READY
    }
  }
}
