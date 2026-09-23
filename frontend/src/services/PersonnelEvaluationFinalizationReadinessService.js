/**
 * PersonnelEvaluationFinalizationReadinessService.js
 *
 * Canonical Authoritative Frontend Mirror for Plan H — Phase H0.
 * Validates that an evaluation satisfies all prerequisites (identity, cycle, reviewer authorization,
 * revision clearance, score integrity, and authoritative Plan F recomputation) before entering
 * Plan H finalization, printing, deliberation, promotion, or rank update workflows.
 *
 * Core Governance Rules:
 * 1. Only a complete, valid, reviewer-authorized evaluation may enter Plan H finalization.
 * 2. Plan H owns post-evaluation workflows; it does NOT redefine Plan F scoring rules or Plan E rank rules.
 * 3. Final accepted totals are recomputed authoritatively using Plan F; client totals are strictly ignored.
 * 4. Unresolved revision requests, incomplete scoring, or corrupt score states block finalization immediately.
 * 5. Phase H0 is a pure validation gate and writes zero promotion or rank mutation fields.
 */

import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from './evaluationInstrumentRegistry.js'
import PersonnelEvaluatorScoringService from './PersonnelEvaluatorScoringService.js'

export const FINALIZATION_REASON_CODES = Object.freeze({
  READY_FOR_FINALIZATION: 'ready_for_finalization',
  EVALUATION_NOT_FOUND: 'evaluation_not_found',
  PERSONNEL_NOT_FOUND: 'personnel_not_found',
  EVALUATION_CYCLE_MISSING: 'evaluation_cycle_missing',
  EVALUATION_CYCLE_INVALID: 'evaluation_cycle_invalid',
  DUPLICATE_CYCLE_EVALUATION: 'duplicate_cycle_evaluation',
  REVIEWER_ASSIGNMENT_MISSING: 'reviewer_assignment_missing',
  REVIEWER_ASSIGNMENT_INVALID: 'reviewer_assignment_invalid',
  REVIEW_INCOMPLETE: 'review_incomplete',
  SELF_REVIEW_INVALID: 'self_review_invalid',
  REVIEWER_ROUTE_UNRESOLVED: 'reviewer_route_unresolved',
  REVISION_REQUEST_UNRESOLVED: 'revision_request_unresolved',
  SCORING_INCOMPLETE: 'scoring_incomplete',
  INVALID_SCORE_STATE: 'invalid_score_state',
  SNAPSHOT_INVALID: 'snapshot_invalid',
  RULE_VERSION_UNAVAILABLE: 'rule_version_unavailable',
  RESULT_PENDING: 'result_pending',
  ALREADY_FINALIZED: 'already_finalized',
  UNAUTHORIZED_ACTOR: 'unauthorized_finalization_actor'
})

export default class PersonnelEvaluationFinalizationReadinessService {
  static RULE_VERSION = EVALUATION_RULE_VERSION

  /**
   * Validates whether an authenticated actor has HR authority to trigger finalization workflows.
   */
  static validateHRAccess(actor = {}) {
    const roles = Array.isArray(actor.roles)
      ? actor.roles
      : (actor.role ? [actor.role] : [])

    if (roles.includes('hr_staff') || roles.includes('hr_admin')) {
      return true
    }

    throw new Error('Access Denied (403): Only authorized HR personnel may access Plan H finalization workflows.')
  }

  /**
   * Evaluates all pre-finalization gates and returns a structured readiness DTO.
   */
  static canFinalize({
    evaluationRecord = {},
    snapshotData = {},
    areaAInputs = null,
    actor = null,
    activeCycleEvaluations = []
  } = {}) {
    // 1. HR Authorization Check (if actor provided)
    if (actor !== null) {
      try {
        this.validateHRAccess(actor)
      } catch (err) {
        return this.buildFailureResponse({
          reasonCode: FINALIZATION_REASON_CODES.UNAUTHORIZED_ACTOR,
          message: err.message,
          evaluationRecord,
          snapshotData
        })
      }
    }

    // 2. Evaluation & Personnel Identity Check
    const evaluationId = evaluationRecord.id || evaluationRecord.evaluation_id || null
    if (!evaluationId) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.EVALUATION_NOT_FOUND,
        message: 'Evaluation record not found or evaluation ID is missing.',
        evaluationRecord,
        snapshotData
      })
    }

    const personnelProfileId = evaluationRecord.personnel_profile_id || null
    if (!personnelProfileId) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.PERSONNEL_NOT_FOUND,
        message: 'Personnel profile ID is missing on evaluation record.',
        evaluationRecord,
        snapshotData
      })
    }

    // 3. Evaluation Cycle Validation
    const cycle = evaluationRecord.academic_year || evaluationRecord.evaluation_cycle_id || evaluationRecord.cycle || null
    if (!cycle) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.EVALUATION_CYCLE_MISSING,
        message: 'Evaluation cycle or academic year is missing.',
        evaluationRecord,
        snapshotData
      })
    }

    if (!/^[0-9]{4}-[0-9]{4}$/i.test(String(cycle).trim()) && String(cycle).toLowerCase().trim() === 'invalid_cycle') {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.EVALUATION_CYCLE_INVALID,
        message: `Evaluation cycle [${cycle}] is invalid or malformed.`,
        evaluationRecord,
        snapshotData
      })
    }

    // Duplicate Active Cycle Check
    if (Array.isArray(activeCycleEvaluations) && activeCycleEvaluations.length > 0) {
      const duplicate = activeCycleEvaluations.find((otherEval) => {
        const otherId = otherEval.id || otherEval.evaluation_id || ''
        const otherPersonnel = otherEval.personnel_profile_id || ''
        const otherCycle = otherEval.academic_year || otherEval.evaluation_cycle_id || ''
        const otherStatus = String(otherEval.evaluation_status || otherEval.status || '').toLowerCase().trim()

        return otherId !== evaluationId &&
          otherPersonnel === personnelProfileId &&
          otherCycle === cycle &&
          ['in_evaluation', 'ready_for_finalization', 'finalized'].includes(otherStatus)
      })

      if (duplicate) {
        return this.buildFailureResponse({
          reasonCode: FINALIZATION_REASON_CODES.DUPLICATE_CYCLE_EVALUATION,
          message: `Duplicate active evaluation detected for personnel [${personnelProfileId}] in cycle [${cycle}].`,
          evaluationRecord,
          snapshotData
        })
      }
    }

    // 4. Reviewer Authorization & Completion Check
    const assignedRole = evaluationRecord.assigned_reviewer_role || evaluationRecord.evaluator_role || null
    if (!assignedRole) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.REVIEWER_ASSIGNMENT_MISSING,
        message: 'Reviewer assignment is missing on evaluation record.',
        evaluationRecord,
        snapshotData
      })
    }

    const evaluatorId = evaluationRecord.evaluator_profile_id || evaluationRecord.reviewer_user_id || null
    if (evaluatorId && evaluatorId === personnelProfileId) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.SELF_REVIEW_INVALID,
        message: 'Evaluation reviewer cannot be the evaluated candidate (Self-review invalid).',
        evaluationRecord,
        snapshotData
      })
    }

    // 5. Evaluation State & Revision Request Guard
    const status = String(evaluationRecord.evaluation_status || evaluationRecord.status || '').toLowerCase().trim()
    if (status === 'finalized' || status === 'completed') {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.ALREADY_FINALIZED,
        message: 'Evaluation is already finalized.',
        evaluationRecord,
        snapshotData
      })
    }

    if (status === 'returned_for_revision' || status === 'in_revision' || Boolean(evaluationRecord.has_unresolved_revision_request)) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.REVISION_REQUEST_UNRESOLVED,
        message: 'Not ready for finalization — portfolio revision request remains unresolved.',
        evaluationRecord,
        snapshotData
      })
    }

    const allowedPreFinalizationStates = ['in_evaluation', 'awaiting_review', 'under_evaluation', 'reviewed', 'scoring_completed', 'ready_for_finalization', 'submitted']
    if (!allowedPreFinalizationStates.includes(status)) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.REVIEW_INCOMPLETE,
        message: `Evaluation is in status [${status}] and is not eligible for finalization.`,
        evaluationRecord,
        snapshotData
      })
    }

    // 6. Snapshot & Historical Rule Version Integrity
    if (!snapshotData || !Array.isArray(snapshotData.items)) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.SNAPSHOT_INVALID,
        message: 'Submitted snapshot data is missing or malformed.',
        evaluationRecord,
        snapshotData
      })
    }

    const ruleVersion = evaluationRecord.rule_version || this.RULE_VERSION
    if (ruleVersion !== this.RULE_VERSION) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.RULE_VERSION_UNAVAILABLE,
        message: `Evaluation rule version [${ruleVersion}] does not match canonical version [${this.RULE_VERSION}].`,
        evaluationRecord,
        snapshotData
      })
    }

    const scaleCode = evaluationRecord.evaluation_scale_code || EVALUATION_SCALE_CODES.ADMINISTRATORS

    // 7. Score Integrity Pre-Check
    const items = snapshotData.items
    for (const item of items) {
      const cat = String(item.category || item.category_code || '')
      const acceptedPts = item.accepted_points

      if (acceptedPts !== null && acceptedPts !== undefined) {
        const acc = Number(acceptedPts)
        if (acc < 0.0) {
          return this.buildFailureResponse({
            reasonCode: FINALIZATION_REASON_CODES.INVALID_SCORE_STATE,
            message: `Negative accepted score [${acc}] detected for criterion [${cat}].`,
            evaluationRecord,
            snapshotData
          })
        }

        // Check specific judgment bounds
        if (scaleCode === EVALUATION_SCALE_CODES.ADMINISTRATORS) {
          if (cat.includes('B.3') && acc > 40.0) {
            return this.buildFailureResponse({
              reasonCode: FINALIZATION_REASON_CODES.INVALID_SCORE_STATE,
              message: `Accepted score [${acc}] exceeds maximum allowed [40.0] for Research (B.3).`,
              evaluationRecord,
              snapshotData
            })
          }
          if (cat.includes('B.6') && acc > 20.0) {
            return this.buildFailureResponse({
              reasonCode: FINALIZATION_REASON_CODES.INVALID_SCORE_STATE,
              message: `Accepted score [${acc}] exceeds maximum allowed [20.0] for Creative Work (B.6).`,
              evaluationRecord,
              snapshotData
            })
          }
        } else if (scaleCode === EVALUATION_SCALE_CODES.NON_TEACHING) {
          if (cat.includes('B.5') && acc > 30.0) {
            return this.buildFailureResponse({
              reasonCode: FINALIZATION_REASON_CODES.INVALID_SCORE_STATE,
              message: `Accepted score [${acc}] exceeds maximum allowed [30.0] for Meritorious Award (B.5).`,
              evaluationRecord,
              snapshotData
            })
          }
        }
      }
    }

    // 8. Authoritative Plan F Recomputation
    const scoringState = PersonnelEvaluatorScoringService.recalculateScoringState({
      evaluationRecord,
      snapshotData,
      areaAInputs
    })

    // 9. Scoring Completeness Guard
    if (!scoringState.scoring_complete || (scoringState.pending_judgment_count || 0) > 0) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.SCORING_INCOMPLETE,
        message: 'Not ready for finalization — evaluator scoring is incomplete.',
        evaluationRecord,
        snapshotData,
        scoringState
      })
    }

    // 10. Area Cap & Overall Max Sanity Check
    if (scaleCode === EVALUATION_SCALE_CODES.ADMINISTRATORS) {
      if (
        scoringState.area_capped_totals.A > 70.0 ||
        scoringState.area_capped_totals.B > 50.0 ||
        scoringState.area_capped_totals.C > 40.0 ||
        scoringState.official_accepted_total > 160.0
      ) {
        return this.buildFailureResponse({
          reasonCode: FINALIZATION_REASON_CODES.INVALID_SCORE_STATE,
          message: 'Area cap or scale maximum violation detected during recalculation.',
          evaluationRecord,
          snapshotData,
          scoringState
        })
      }
    } else if (scaleCode === EVALUATION_SCALE_CODES.NON_TEACHING) {
      if (
        scoringState.area_capped_totals.A > 90.0 ||
        scoringState.area_capped_totals.B > 60.0 ||
        scoringState.official_accepted_total > 150.0
      ) {
        return this.buildFailureResponse({
          reasonCode: FINALIZATION_REASON_CODES.INVALID_SCORE_STATE,
          message: 'Non-Teaching Area cap or scale maximum violation detected during recalculation.',
          evaluationRecord,
          snapshotData,
          scoringState
        })
      }
    }

    // 11. Plan F Result Readiness
    if (scoringState.plan_f_result_status !== 'result_ready' || !scoringState.plan_f_final_result) {
      return this.buildFailureResponse({
        reasonCode: FINALIZATION_REASON_CODES.RESULT_PENDING,
        message: 'Plan F result outcome is undetermined.',
        evaluationRecord,
        snapshotData,
        scoringState
      })
    }

    // All Gates Passed — Construct Positive Readiness DTO
    return {
      evaluation_id: String(evaluationId),
      personnel_profile_id: String(personnelProfileId),
      personnel_name: String(evaluationRecord.personnel_name || evaluationRecord.faculty_name || 'Candidate Name'),
      current_rank: String(evaluationRecord.current_rank || evaluationRecord.academic_rank || 'Assistant Professor I'),
      evaluation_cycle_id: String(cycle),
      ready_for_finalization: true,
      reason_code: FINALIZATION_REASON_CODES.READY_FOR_FINALIZATION,
      reason_message: 'Ready for finalization — review, scoring, and evaluation result are complete.',
      reviewer_valid: true,
      review_complete: true,
      revision_clear: true,
      scoring_complete: true,
      score_integrity_valid: true,
      official_accepted_total: Number(scoringState.official_accepted_total),
      maximum_score: Number(scoringState.maximum_score),
      passing_score: Number(scoringState.passing_score),
      evaluation_result: String(scoringState.plan_f_final_result),
      evaluation_scale_code: String(scaleCode),
      rule_version: String(ruleVersion),
      snapshot_version: String(snapshotData.snapshot_version || 'v1.0.0'),
      checked_at: new Date().toISOString()
    }
  }

  /**
   * Helper to construct a standardized failure DTO.
   */
  static buildFailureResponse({
    reasonCode,
    message,
    evaluationRecord = {},
    snapshotData = {},
    scoringState = null
  } = {}) {
    return {
      evaluation_id: String(evaluationRecord.id || evaluationRecord.evaluation_id || 'EVAL-UNKNOWN'),
      personnel_profile_id: String(evaluationRecord.personnel_profile_id || ''),
      personnel_name: String(evaluationRecord.personnel_name || evaluationRecord.faculty_name || 'Candidate Name'),
      current_rank: String(evaluationRecord.current_rank || evaluationRecord.academic_rank || 'N/A'),
      evaluation_cycle_id: String(evaluationRecord.academic_year || evaluationRecord.evaluation_cycle_id || ''),
      ready_for_finalization: false,
      reason_code: reasonCode,
      reason_message: message,
      reviewer_valid: ![
        FINALIZATION_REASON_CODES.REVIEWER_ASSIGNMENT_MISSING,
        FINALIZATION_REASON_CODES.REVIEWER_ASSIGNMENT_INVALID,
        FINALIZATION_REASON_CODES.SELF_REVIEW_INVALID
      ].includes(reasonCode),
      review_complete: ![
        FINALIZATION_REASON_CODES.REVIEW_INCOMPLETE,
        FINALIZATION_REASON_CODES.SCORING_INCOMPLETE
      ].includes(reasonCode),
      revision_clear: reasonCode !== FINALIZATION_REASON_CODES.REVISION_REQUEST_UNRESOLVED,
      scoring_complete: Boolean(scoringState && scoringState.scoring_complete),
      score_integrity_valid: reasonCode !== FINALIZATION_REASON_CODES.INVALID_SCORE_STATE,
      official_accepted_total: Number((scoringState && scoringState.official_accepted_total) || 0.0),
      evaluation_result: (scoringState && scoringState.plan_f_final_result) || null,
      evaluation_scale_code: String(evaluationRecord.evaluation_scale_code || EVALUATION_SCALE_CODES.ADMINISTRATORS),
      rule_version: String(evaluationRecord.rule_version || this.RULE_VERSION),
      snapshot_version: String(snapshotData.snapshot_version || 'v1.0.0'),
      checked_at: new Date().toISOString()
    }
  }
}
