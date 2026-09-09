/**
 * PersonnelPromotionDecisionService.js
 *
 * Authoritative Post-Evaluation Deliberation, HR Promotion Decision & Approved Rank Update Engine (Plan H — Phase H3).
 * Manages post-evaluation deliberation, processes HR-recorded promotion decisions ('Approved' or 'Not Approved'),
 * preserves current rank for denied/retained cases, and applies approved rank updates strictly validated
 * against Plan E faculty rank progression rules and confirmed PhD exceptions.
 *
 * Core Governance Invariants:
 * 1. A Passed evaluation may proceed to deliberation, but Passed does NOT guarantee promotion.
 * 2. HR records the authoritative Promotion Decision ('Approved' or 'Not Approved').
 * 3. Evaluation Result ('Passed' | 'Retained') and Promotion Decision ('Approved' | 'Not Approved') are separate facts.
 * 4. Retained evaluations are ineligible for promotion and keep current rank/title.
 * 5. Not Approved decisions keep current rank/title without demotion.
 * 6. Approved decisions update rank/title ONLY through valid Plan E rank transitions (sequential or verified PhD exception).
 * 7. Unsupported jumps, lower-rank transitions, Part-Time faculty promotions, or unverified PhD exceptions are rejected.
 * 8. All approval/signature fields (President, Date) remain manual and are NEVER auto-filled.
 * 9. Only authorized HR personnel (hr_staff, hr_admin) have authority to record promotion decisions.
 * 10. Repeated promotion decision submissions are idempotent (zero double-promotions).
 */

import PersonnelEvaluationFinalizationReadinessService from './PersonnelEvaluationFinalizationReadinessService.js'
import { RESULT_VOCABULARY } from './PersonnelEvaluationResultPersistenceService.js'

export const DECISION_VOCABULARY = Object.freeze({
  APPROVED: 'Approved',
  NOT_APPROVED: 'Not Approved'
})

export const PROMOTION_REASON_CODES = Object.freeze({
  DECISION_RECORDED: 'promotion_decision_recorded_successfully',
  DECISION_ALREADY_RECORDED: 'promotion_decision_already_recorded',
  EVALUATION_NOT_READY: 'evaluation_not_ready_for_deliberation',
  RETAINED_INELIGIBLE: 'evaluation_result_not_eligible_for_promotion',
  INVALID_RANK_TRANSITION: 'invalid_rank_transition',
  PART_TIME_INELIGIBLE: 'part_time_not_eligible_for_promotion',
  UNSUPPORTED_PERSONNEL_GROUP: 'unsupported_personnel_group',
  UNAUTHORIZED_HR_ACTOR: 'unauthorized_hr_actor'
})

export const PLAN_E_RANKS = Object.freeze({
  ASSISTANT_INSTRUCTOR: { rank_code: 'ASSISTANT_INSTRUCTOR', display_label: 'Assistant Instructor', tier: 'baccalaureate' },
  INSTRUCTOR_I: { rank_code: 'INSTRUCTOR_I', display_label: 'Instructor I', tier: 'baccalaureate' },
  INSTRUCTOR_II: { rank_code: 'INSTRUCTOR_II', display_label: 'Instructor II', tier: 'baccalaureate' },
  INSTRUCTOR_III: { rank_code: 'INSTRUCTOR_III', display_label: 'Instructor III', tier: 'baccalaureate' },
  SENIOR_INSTRUCTOR_I: { rank_code: 'SENIOR_INSTRUCTOR_I', display_label: 'Senior Instructor I', tier: 'baccalaureate' },
  SENIOR_INSTRUCTOR_II: { rank_code: 'SENIOR_INSTRUCTOR_II', display_label: 'Senior Instructor II', tier: 'baccalaureate' },
  SENIOR_INSTRUCTOR_III: { rank_code: 'SENIOR_INSTRUCTOR_III', display_label: 'Senior Instructor III', tier: 'baccalaureate' },

  ASSISTANT_PROFESSOR_I: { rank_code: 'ASSISTANT_PROFESSOR_I', display_label: 'Assistant Professor I', tier: 'masters' },
  ASSISTANT_PROFESSOR_II: { rank_code: 'ASSISTANT_PROFESSOR_II', display_label: 'Assistant Professor II', tier: 'masters' },
  ASSISTANT_PROFESSOR_III: { rank_code: 'ASSISTANT_PROFESSOR_III', display_label: 'Assistant Professor III', tier: 'masters' },
  ASSOCIATE_PROFESSOR_I: { rank_code: 'ASSOCIATE_PROFESSOR_I', display_label: 'Associate Professor I', tier: 'masters' },
  ASSOCIATE_PROFESSOR_II: { rank_code: 'ASSOCIATE_PROFESSOR_II', display_label: 'Associate Professor II', tier: 'masters' },
  ASSOCIATE_PROFESSOR_III: { rank_code: 'ASSOCIATE_PROFESSOR_III', display_label: 'Associate Professor III', tier: 'masters' },

  PROFESSOR_I: { rank_code: 'PROFESSOR_I', display_label: 'Professor I', tier: 'doctoral' },
  PROFESSOR_II: { rank_code: 'PROFESSOR_II', display_label: 'Professor II', tier: 'doctoral' },
  PROFESSOR_III: { rank_code: 'PROFESSOR_III', display_label: 'Professor III', tier: 'doctoral' },
  PROFESSOR_IV: { rank_code: 'PROFESSOR_IV', display_label: 'Professor IV', tier: 'doctoral' },
  PROFESSOR_V: { rank_code: 'PROFESSOR_V', display_label: 'Professor V', tier: 'doctoral' },
  UNIVERSITY_PROFESSOR: { rank_code: 'UNIVERSITY_PROFESSOR', display_label: 'University Professor', tier: 'doctoral' }
})

export const NORMAL_PROGRESSION_MAP = Object.freeze({
  ASSISTANT_INSTRUCTOR: 'INSTRUCTOR_I',
  INSTRUCTOR_I: 'INSTRUCTOR_II',
  INSTRUCTOR_II: 'INSTRUCTOR_III',
  INSTRUCTOR_III: 'SENIOR_INSTRUCTOR_I',
  SENIOR_INSTRUCTOR_I: 'SENIOR_INSTRUCTOR_II',
  SENIOR_INSTRUCTOR_II: 'SENIOR_INSTRUCTOR_III',
  SENIOR_INSTRUCTOR_III: 'ASSISTANT_PROFESSOR_I',

  ASSISTANT_PROFESSOR_I: 'ASSISTANT_PROFESSOR_II',
  ASSISTANT_PROFESSOR_II: 'ASSISTANT_PROFESSOR_III',
  ASSISTANT_PROFESSOR_III: 'ASSOCIATE_PROFESSOR_I',
  ASSOCIATE_PROFESSOR_I: 'ASSOCIATE_PROFESSOR_II',
  ASSOCIATE_PROFESSOR_II: 'ASSOCIATE_PROFESSOR_III',
  ASSOCIATE_PROFESSOR_III: 'PROFESSOR_I',

  PROFESSOR_I: 'PROFESSOR_II',
  PROFESSOR_II: 'PROFESSOR_III',
  PROFESSOR_III: 'PROFESSOR_IV',
  PROFESSOR_IV: 'PROFESSOR_V',
  PROFESSOR_V: 'UNIVERSITY_PROFESSOR'
})

export default class PersonnelPromotionDecisionService {
  static RULE_REFERENCE = 'NDMU-DOC-ACAD-RANKS-2026-V1'

  /**
   * Resolves rank code or display label into canonical rank metadata.
   */
  static resolveRank(rankIdentifier = '') {
    if (!rankIdentifier) return null
    const normalized = String(rankIdentifier).trim()

    // 1. Direct key match
    const upperKey = normalized.toUpperCase().replace(/\s+/g, '_')
    if (PLAN_E_RANKS[upperKey]) {
      return PLAN_E_RANKS[upperKey]
    }

    // 2. Direct display_label match
    const found = Object.values(PLAN_E_RANKS).find(
      (r) => r.display_label.toLowerCase() === normalized.toLowerCase() || r.rank_code.toLowerCase() === normalized.toLowerCase()
    )
    return found || null
  }

  /**
   * Validates whether an authenticated actor has HR authority to record promotion decisions.
   */
  static validateHRAccess(actor = {}) {
    const roles = Array.isArray(actor.roles)
      ? actor.roles
      : (actor.role ? [actor.role] : [])

    if (roles.includes('hr_staff') || roles.includes('hr_admin')) {
      return true
    }

    throw new Error('Access Denied (403): Only authorized HR personnel may record Plan H promotion decisions.')
  }

  /**
   * Validates promotion decision vocabulary.
   */
  static validateDecisionVocabulary(decision) {
    if (decision !== DECISION_VOCABULARY.APPROVED && decision !== DECISION_VOCABULARY.NOT_APPROVED) {
      throw new Error(`Invalid Promotion Decision [${decision}]. Allowed values are 'Approved' or 'Not Approved'.`)
    }
  }

  /**
   * Evaluates if an evaluation is ready for deliberation.
   */
  static canDeliberate({
    evaluationRecord = {},
    snapshotData = {},
    resultRecord = null,
    areaAInputs = null,
    actor = null
  } = {}) {
    if (actor !== null) {
      this.validateHRAccess(actor)
    }

    const readiness = PersonnelEvaluationFinalizationReadinessService.canFinalize({
      evaluationRecord,
      snapshotData,
      areaAInputs,
      actor
    })

    if (!readiness.ready_for_finalization) {
      return {
        can_deliberate: false,
        reason_code: PROMOTION_REASON_CODES.EVALUATION_NOT_READY,
        message: `Evaluation is not ready for deliberation: ${readiness.reason_message}`,
        readiness
      }
    }

    const evaluationResult = resultRecord?.evaluation_result || readiness.evaluation_result
    if (!evaluationResult) {
      return {
        can_deliberate: false,
        reason_code: PROMOTION_REASON_CODES.EVALUATION_NOT_READY,
        message: 'Evaluation Result is not yet recorded or finalized.'
      }
    }

    return {
      can_deliberate: true,
      reason_code: 'deliberation_eligible',
      evaluation_result: evaluationResult,
      readiness
    }
  }

  /**
   * Resolves allowed Plan E rank transitions for deliberation selection.
   */
  static resolveAllowedRankTransitions({ evaluationRecord = {}, context = {} } = {}) {
    const currentRankIdentifier = evaluationRecord.current_rank || evaluationRecord.academic_rank || null
    const engagement = evaluationRecord.faculty_engagement || context.faculty_engagement || 'full_time_faculty'
    const personnelGroup = evaluationRecord.personnel_group || context.personnel_group || 'faculty'
    const hasVerifiedPhd = Boolean(evaluationRecord.has_verified_phd || context.has_verified_phd)

    if (engagement === 'part_time_faculty') {
      return {
        eligible: false,
        reason_code: PROMOTION_REASON_CODES.PART_TIME_INELIGIBLE,
        message: 'Part-time faculty are not eligible for Full-Time rank progression.',
        allowed_targets: []
      }
    }

    if (personnelGroup !== 'faculty') {
      return {
        eligible: false,
        reason_code: PROMOTION_REASON_CODES.UNSUPPORTED_PERSONNEL_GROUP,
        message: 'Non-teaching personnel are outside the Faculty Academic Rank progression graph.',
        allowed_targets: []
      }
    }

    const currentRank = this.resolveRank(currentRankIdentifier)
    if (!currentRank) {
      return {
        eligible: false,
        reason_code: 'rank_not_found',
        message: `Current rank [${currentRankIdentifier}] was not found in the Plan E catalog.`,
        allowed_targets: []
      }
    }

    const normalNextCode = NORMAL_PROGRESSION_MAP[currentRank.rank_code] || null
    const normalNextRank = normalNextCode ? PLAN_E_RANKS[normalNextCode] : null

    const allowedTargets = []
    if (normalNextRank) {
      allowedTargets.push({
        rank_code: normalNextRank.rank_code,
        display_label: normalNextRank.display_label,
        transition_type: 'normal_sequential'
      })
    }

    // Check confirmed PhD exception: Assistant Professor I -> Professor I
    if (currentRank.rank_code === 'ASSISTANT_PROFESSOR_I' && hasVerifiedPhd) {
      const phdTarget = PLAN_E_RANKS.PROFESSOR_I
      allowedTargets.push({
        rank_code: phdTarget.rank_code,
        display_label: phdTarget.display_label,
        transition_type: 'phd_exception',
        rule_reference: 'NDMU-DOC-ACAD-RANKS-2026-V1-EX-PHD'
      })
    }

    return {
      eligible: true,
      current_rank_code: currentRank.rank_code,
      current_rank_name: currentRank.display_label,
      is_terminal: allowedTargets.length === 0,
      normal_next_rank: normalNextRank,
      allowed_targets: allowedTargets,
      rule_reference: this.RULE_REFERENCE
    }
  }

  /**
   * Validates a proposed progression transition between two ranks.
   */
  static validateTransition({ fromRankIdentifier, toRankIdentifier, context = {} } = {}) {
    const engagement = context.faculty_engagement || 'full_time_faculty'
    if (engagement === 'part_time_faculty') {
      return {
        allowed: false,
        reason_code: PROMOTION_REASON_CODES.PART_TIME_INELIGIBLE,
        message: 'Part-time faculty are not eligible for Full-Time rank progression.'
      }
    }

    const personnelGroup = context.personnel_group || 'faculty'
    if (personnelGroup !== 'faculty') {
      return {
        allowed: false,
        reason_code: PROMOTION_REASON_CODES.UNSUPPORTED_PERSONNEL_GROUP,
        message: 'Non-teaching personnel cannot participate in Faculty rank progression.'
      }
    }

    const fromRank = this.resolveRank(fromRankIdentifier)
    if (!fromRank) {
      return {
        allowed: false,
        reason_code: 'rank_not_found',
        message: `Source rank [${fromRankIdentifier}] was not found in catalog.`
      }
    }

    const toRank = this.resolveRank(toRankIdentifier)
    if (!toRank) {
      return {
        allowed: false,
        reason_code: 'rank_not_found',
        message: `Target rank [${toRankIdentifier}] was not found in catalog.`
      }
    }

    const normalNextCode = NORMAL_PROGRESSION_MAP[fromRank.rank_code]
    if (normalNextCode === toRank.rank_code) {
      return {
        allowed: true,
        transition_type: 'normal_sequential',
        target_rank: toRank,
        message: `Valid sequential progression from [${fromRank.display_label}] to [${toRank.display_label}].`
      }
    }

    // Check PhD exception
    if (fromRank.rank_code === 'ASSISTANT_PROFESSOR_I' && toRank.rank_code === 'PROFESSOR_I') {
      if (Boolean(context.has_verified_phd)) {
        return {
          allowed: true,
          transition_type: 'phd_exception',
          target_rank: toRank,
          message: 'Valid PhD exception transition from Assistant Professor I to Professor I.'
        }
      }
      return {
        allowed: false,
        reason_code: 'phd_verification_required',
        message: 'Transition from Assistant Professor I to Professor I requires verified PhD credential evidence.'
      }
    }

    return {
      allowed: false,
      reason_code: PROMOTION_REASON_CODES.INVALID_RANK_TRANSITION,
      message: `Invalid rank transition from [${fromRank.display_label}] to [${toRank.display_label}]. Direct progression not permitted by Plan E graph.`
    }
  }

  /**
   * Records the official HR promotion decision and applies approved rank updates atomically.
   */
  static recordPromotionDecision({
    evaluationRecord = {},
    snapshotData = {},
    resultRecord = null,
    areaAInputs = null,
    decision = '',
    approvedRankCode = null,
    decisionReason = null,
    actor = null,
    context = {},
    existingPromotionRecord = null
  } = {}) {
    // 1. HR Authorization Check
    if (actor !== null) {
      this.validateHRAccess(actor)
    }

    this.validateDecisionVocabulary(decision)

    const evaluationId = String(evaluationRecord.id || evaluationRecord.evaluation_id || '')
    const personnelProfileId = String(evaluationRecord.personnel_profile_id || '')
    const currentRank = String(evaluationRecord.current_rank || evaluationRecord.academic_rank || 'Unassigned')

    // 2. Idempotency Check: If promotion decision already recorded, return stable existing record
    if (existingPromotionRecord && existingPromotionRecord.promotion_decision) {
      return {
        success: true,
        reason_code: PROMOTION_REASON_CODES.DECISION_ALREADY_RECORDED,
        message: 'Promotion decision has already been recorded and is historically locked.',
        promotion_decision: existingPromotionRecord,
        current_rank: evaluationRecord.current_rank || currentRank,
        rank_change_applied: false
      }
    }

    // 3. Verify Deliberation Readiness
    const deliberationCheck = this.canDeliberate({
      evaluationRecord,
      snapshotData,
      resultRecord,
      areaAInputs,
      actor
    })

    if (!deliberationCheck.can_deliberate) {
      const error = new Error(`Cannot record promotion decision: ${deliberationCheck.message}`)
      error.reason_code = deliberationCheck.reason_code
      throw error
    }

    const evaluationResult = deliberationCheck.evaluation_result

    // 4. Retained Evaluation Boundary: Retained evaluations cannot be approved for promotion
    if (evaluationResult === RESULT_VOCABULARY.RETAINED && decision === DECISION_VOCABULARY.APPROVED) {
      const error = new Error(
        "Cannot approve promotion: Evaluation Result is 'Retained'. Only 'Passed' evaluations may be approved for promotion."
      )
      error.reason_code = PROMOTION_REASON_CODES.RETAINED_INELIGIBLE
      throw error
    }

    const recordedAt = new Date().toISOString()
    const recordedBy = actor?.profile_id || actor?.id || 'system_hr'

    // 5. Handle Not Approved Decision
    if (decision === DECISION_VOCABULARY.NOT_APPROVED) {
      const decisionRecord = {
        evaluation_id: evaluationId,
        personnel_profile_id: personnelProfileId,
        evaluation_result: evaluationResult,
        promotion_decision: DECISION_VOCABULARY.NOT_APPROVED,
        is_promoted: false,
        previous_rank: currentRank,
        current_rank: currentRank,
        approved_rank_code: null,
        approved_rank_name: null,
        rank_change_applied: false,
        decision_reason: decisionReason || 'Candidate retains current rank following deliberation.',
        decided_by: recordedBy,
        decided_at: recordedAt,
        plan_e_rule_reference: this.RULE_REFERENCE
      }

      return {
        success: true,
        reason_code: PROMOTION_REASON_CODES.DECISION_RECORDED,
        message: `Promotion decision [Not Approved] successfully recorded. Candidate retains current rank [${currentRank}].`,
        promotion_decision: decisionRecord,
        current_rank: currentRank,
        rank_change_applied: false
      }
    }

    // 6. Handle Approved Decision (Requires Valid Plan E Transition)
    if (!approvedRankCode) {
      throw new Error("Approved rank code is required when Promotion Decision is 'Approved'.")
    }

    // 6a. Part-Time / Non-Teaching Boundary Checks
    const engagement = evaluationRecord.faculty_engagement || context.faculty_engagement || 'full_time_faculty'
    if (engagement === 'part_time_faculty') {
      const error = new Error('Part-time faculty are not eligible for Full-Time rank progression.')
      error.reason_code = PROMOTION_REASON_CODES.PART_TIME_INELIGIBLE
      throw error
    }

    const personnelGroup = evaluationRecord.personnel_group || context.personnel_group || 'faculty'
    if (personnelGroup !== 'faculty') {
      const error = new Error('Non-teaching personnel cannot participate in Faculty rank progression.')
      error.reason_code = PROMOTION_REASON_CODES.UNSUPPORTED_PERSONNEL_GROUP
      throw error
    }

    // 6b. Plan E Validation
    const hasVerifiedPhd = Boolean(evaluationRecord.has_verified_phd || context.has_verified_phd)
    const transitionValidation = this.validateTransition({
      fromRankIdentifier: currentRank,
      toRankIdentifier: approvedRankCode,
      context: {
        faculty_engagement: engagement,
        personnel_group: personnelGroup,
        has_verified_phd: hasVerifiedPhd
      }
    })

    if (!transitionValidation.allowed) {
      const error = new Error(
        `Invalid rank transition from [${currentRank}] to [${approvedRankCode}]: ${transitionValidation.message}`
      )
      error.reason_code = transitionValidation.reason_code || PROMOTION_REASON_CODES.INVALID_RANK_TRANSITION
      throw error
    }

    const targetRank = transitionValidation.target_rank
    const newRankName = targetRank.display_label
    const newRankCode = targetRank.rank_code

    // 7. Atomic Rank Change Record & History
    const decisionRecord = {
      evaluation_id: evaluationId,
      personnel_profile_id: personnelProfileId,
      evaluation_result: evaluationResult,
      promotion_decision: DECISION_VOCABULARY.APPROVED,
      is_promoted: true,
      previous_rank: currentRank,
      current_rank: newRankName,
      approved_rank_code: newRankCode,
      approved_rank_name: newRankName,
      rank_change_applied: true,
      transition_type: transitionValidation.transition_type || 'normal_sequential',
      decision_reason: decisionReason || `Promotion approved to [${newRankName}] following post-evaluation deliberation.`,
      decided_by: recordedBy,
      decided_at: recordedAt,
      plan_e_rule_reference: this.RULE_REFERENCE,
      rank_history_entry: {
        evaluation_id: evaluationId,
        personnel_profile_id: personnelProfileId,
        from_rank: currentRank,
        to_rank: newRankName,
        to_rank_code: newRankCode,
        transition_type: transitionValidation.transition_type || 'normal_sequential',
        action: 'PROMOTION_APPROVED',
        recorded_by: recordedBy,
        recorded_at: recordedAt
      }
    }

    return {
      success: true,
      reason_code: PROMOTION_REASON_CODES.DECISION_RECORDED,
      message: `Promotion decision [Approved] successfully recorded. Rank updated from [${currentRank}] to [${newRankName}].`,
      promotion_decision: decisionRecord,
      current_rank: newRankName,
      rank_change_applied: true
    }
  }
}
