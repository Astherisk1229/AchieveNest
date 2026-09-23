/**
 * PersonnelEvaluatorScoringService.js
 *
 * Canonical Authoritative Frontend Mirror for Plan G — Phase G3.
 * Manages authorized evaluator entry of official accepted points, Non-Teaching Area A rating inputs,
 * scoring completion tracking, and total recalculations via Plan F rules.
 *
 * Core Governance Rules:
 * 1. Plan G controls who evaluates and records accepted points; Plan F controls caps, formulas, and totals.
 * 2. Only the assigned reviewer may submit official accepted values.
 * 3. Self-review, cross-college reviews, and Department Secretary evaluations are strictly prohibited.
 * 4. Deterministic Plan F items cannot be arbitrarily overridden.
 * 5. Judgment criteria enforce scale-specific maximums (Admin B.3: 40, B.6: 20, Non-Teaching B.5: 30).
 * 6. Null (unresolved) and 0.0 (explicitly zero) are strictly differentiated.
 * 7. Non-Teaching Area A is evaluator-only (Job Performance: 50, Personal Attitudes: 10, Efficiency: 30; Max: 90).
 */

import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from './evaluationInstrumentRegistry.js'
import PersonnelReviewerRoutingRegistry, {
  REVIEWER_ROLES
} from './PersonnelReviewerRoutingRegistry.js'
import PersonnelEvaluationResultService, {
  RESULT_VOCABULARY,
  RESULT_STATUSES
} from './PersonnelEvaluationResultService.js'

export const JUDGMENT_MAX_POINTS = Object.freeze({
  [EVALUATION_SCALE_CODES.ADMINISTRATORS]: {
    'B.3': 40.0,
    'B.6': 20.0
  },
  [EVALUATION_SCALE_CODES.NON_TEACHING]: {
    'B.5': 30.0
  }
})

export const AREA_A_NON_TEACHING_MAX = Object.freeze({
  job_performance: 50.0,
  personal_attitudes: 10.0,
  efficiency: 30.0
})

export const AREA_A_TOTAL_MAX = 90.0

export default class PersonnelEvaluatorScoringService {
  static RULE_VERSION = EVALUATION_RULE_VERSION

  /**
   * Validates evaluator access authority before permitting score mutation.
   */
  static validateEvaluatorAccess(reviewerActor = {}, evaluationRecord = {}) {
    const actorProfileId = String(reviewerActor.profile_id || (reviewerActor.profile && reviewerActor.profile.id) || '')
    const personnelProfileId = String(evaluationRecord.personnel_profile_id || '')

    // 1. Anti-Self-Review
    if (actorProfileId && actorProfileId === personnelProfileId) {
      throw new Error('Access Denied (403): Candidate cannot access their own evaluation with reviewer privileges (Self-review prohibited).')
    }

    const actorRoles = Array.isArray(reviewerActor.roles)
      ? reviewerActor.roles
      : (reviewerActor.role ? [reviewerActor.role] : [])

    // 2. Department Secretary Prohibition
    if (actorRoles.includes('department_secretary') && !actorRoles.includes('dean') && !actorRoles.includes('hr_staff') && !actorRoles.includes('hr_admin')) {
      throw new Error('Access Denied (403): Department Secretary role does not possess evaluator authority.')
    }

    // 3. Evaluation Status Check
    const status = String(evaluationRecord.evaluation_status || evaluationRecord.status || 'submitted').toLowerCase().trim()
    const allowedReviewStates = ['in_evaluation', 'awaiting_review', 'under_evaluation', 'submitted']
    if (!allowedReviewStates.includes(status)) {
      throw new Error(`Evaluation [${evaluationRecord.id || evaluationRecord.evaluation_id}] is in status [${status}] and is not open for evaluator scoring.`)
    }

    const assignedRole = evaluationRecord.assigned_reviewer_role || evaluationRecord.evaluator_role || null
    const targetCollegeId = evaluationRecord.evaluator_college_id || evaluationRecord.target_college_id || null

    // 4. Dean Scoping
    if (assignedRole === 'dean' || assignedRole === REVIEWER_ROLES.DEAN) {
      if (!actorRoles.includes('dean')) {
        throw new Error('Access Denied (403): Evaluation is assigned to College Dean, but actor does not hold the active dean role.')
      }
      const actorCollegeId = reviewerActor.assigned_college_id || (reviewerActor.profile && reviewerActor.profile.college_id)
      if (targetCollegeId && actorCollegeId !== targetCollegeId) {
        throw new Error(`Access Denied (403): Dean of college [${actorCollegeId}] cannot access evaluations for college [${targetCollegeId}] (Cross-college access prohibited).`)
      }
      return true
    }

    // 5. HR Scoping
    if (assignedRole === 'hr' || assignedRole === 'hr_staff' || assignedRole === REVIEWER_ROLES.HR) {
      if (!actorRoles.includes('hr_staff') && !actorRoles.includes('hr_admin')) {
        throw new Error('Access Denied (403): Evaluation is assigned to HR Office, but actor is not an authorized HR evaluator.')
      }
      return true
    }

    throw new Error('Access Denied (403): Reviewer assignment is unresolved or actor is unauthorized.')
  }

  /**
   * Submits official accepted points for an accomplishment item.
   */
  static submitAcceptedPoints({
    evaluationRecord = {},
    reviewerActor = {},
    snapshotData = {},
    itemId = '',
    acceptedPoints = null,
    reason = ''
  } = {}) {
    // 1. Revalidate Access
    this.validateEvaluatorAccess(reviewerActor, evaluationRecord)

    const scaleCode = evaluationRecord.evaluation_scale_code || EVALUATION_SCALE_CODES.ADMINISTRATORS
    const ruleVersion = evaluationRecord.rule_version || this.RULE_VERSION
    if (ruleVersion !== this.RULE_VERSION) {
      throw new Error(`Invalid rule version [${ruleVersion}]. Must be [${this.RULE_VERSION}].`)
    }

    // 2. Locate Item in Snapshot
    const items = snapshotData.items || []
    const targetItem = items.find((itm) => {
      const id = String(itm.id || itm.accomplishment_id || itm.item_id || '')
      return id === String(itemId)
    })

    if (!targetItem) {
      throw new Error(`Evaluation item with ID [${itemId}] not found in snapshot.`)
    }

    const category = String(targetItem.category || targetItem.category_code || '')
    const isJudgment = Boolean(targetItem.evaluator_judgment_required || targetItem.is_evaluator_judgment_required)

    // 3. Check for Judgment vs Deterministic Item
    if (!isJudgment) {
      // Deterministic item: cannot arbitrarily override
      const calculatedPoints = Number(targetItem.capped_points !== undefined ? targetItem.capped_points : (targetItem.points || targetItem.raw_points || 0.0))
      if (acceptedPoints !== null && Math.abs(Number(acceptedPoints) - calculatedPoints) > 0.001) {
        throw new Error(`Arbitrary override of deterministic Plan F scoring is prohibited for criterion [${category}].`)
      }
    } else {
      // Judgment item validation
      if (acceptedPoints !== null) {
        const numVal = Number(acceptedPoints)
        if (isNaN(numVal) || numVal < 0) {
          throw new Error(`Accepted points cannot be negative or invalid for criterion [${category}].`)
        }

        const criterionKey = this.extractCriterionKey(category)
        const allowedMax = (JUDGMENT_MAX_POINTS[scaleCode] && JUDGMENT_MAX_POINTS[scaleCode][criterionKey]) || 100.0

        if (numVal > allowedMax) {
          throw new Error(`Accepted points [${numVal}] exceeds maximum allowed [${allowedMax}] for criterion [${category}].`)
        }
      }
    }

    // 4. Update Item Accepted Points
    targetItem.accepted_points = acceptedPoints !== null ? Number(acceptedPoints) : null
    targetItem.evaluator_user_id = reviewerActor.profile_id || (reviewerActor.profile && reviewerActor.profile.id) || 'reviewer'
    targetItem.evaluator_role = evaluationRecord.assigned_reviewer_role || 'reviewer'
    targetItem.scoring_status = acceptedPoints !== null ? 'scored' : 'awaiting_evaluator'
    targetItem.evaluator_reason = reason
    targetItem.evaluated_at = new Date().toISOString()

    // 5. Recalculate Totals & Completion
    return this.recalculateScoringState({ evaluationRecord, snapshotData })
  }

  /**
   * Submits official Non-Teaching Area A rating inputs.
   */
  static submitNonTeachingAreaAInput({
    evaluationRecord = {},
    reviewerActor = {},
    areaAInputs = {},
    reason = ''
  } = {}) {
    const scaleCode = evaluationRecord.evaluation_scale_code || ''
    if (scaleCode !== EVALUATION_SCALE_CODES.NON_TEACHING) {
      throw new Error('Area A evaluator ratings only apply to Non-Teaching Personnel Ranking Scale.')
    }

    // 1. Revalidate Access
    this.validateEvaluatorAccess(reviewerActor, evaluationRecord)

    // 2. Validate Area A Components
    const jobPerf = areaAInputs.job_performance !== undefined && areaAInputs.job_performance !== null
      ? Number(areaAInputs.job_performance)
      : null
    const persAtt = areaAInputs.personal_attitudes !== undefined && areaAInputs.personal_attitudes !== null
      ? Number(areaAInputs.personal_attitudes)
      : null
    const efficiency = areaAInputs.efficiency !== undefined && areaAInputs.efficiency !== null
      ? Number(areaAInputs.efficiency)
      : null

    if (jobPerf !== null) {
      if (isNaN(jobPerf) || jobPerf < 0 || jobPerf > AREA_A_NON_TEACHING_MAX.job_performance) {
        throw new Error(`Job Performance points [${jobPerf}] exceeds allowed range [0 - ${AREA_A_NON_TEACHING_MAX.job_performance}].`)
      }
    }

    if (persAtt !== null) {
      if (isNaN(persAtt) || persAtt < 0 || persAtt > AREA_A_NON_TEACHING_MAX.personal_attitudes) {
        throw new Error(`Personal Attitudes and Qualities points [${persAtt}] exceeds allowed range [0 - ${AREA_A_NON_TEACHING_MAX.personal_attitudes}].`)
      }
    }

    if (efficiency !== null) {
      if (isNaN(efficiency) || efficiency < 0 || efficiency > AREA_A_NON_TEACHING_MAX.efficiency) {
        throw new Error(`Efficiency points [${efficiency}] exceeds allowed range [0 - ${AREA_A_NON_TEACHING_MAX.efficiency}].`)
      }
    }

    const areaATotal = (jobPerf || 0.0) + (persAtt || 0.0) + (efficiency || 0.0)
    if (areaATotal > AREA_A_TOTAL_MAX) {
      throw new Error(`Total Area A points [${areaATotal}] exceeds maximum allowed [${AREA_A_TOTAL_MAX}].`)
    }

    const isAreaAComplete = (jobPerf !== null) && (persAtt !== null) && (efficiency !== null)

    return {
      success: true,
      area_a_inputs: {
        job_performance: jobPerf,
        personal_attitudes: persAtt,
        efficiency: efficiency,
        total_area_a: areaATotal,
        is_complete: isAreaAComplete,
        evaluator_user_id: reviewerActor.profile_id || (reviewerActor.profile && reviewerActor.profile.id) || 'reviewer',
        evaluated_at: new Date().toISOString(),
        evaluator_reason: reason
      }
    }
  }

  /**
   * Recalculates full scoring state, Area totals, overall total, and scoring completeness.
   */
  static recalculateScoringState({
    evaluationRecord = {},
    snapshotData = {},
    areaAInputs = null
  } = {}) {
    const scaleCode = evaluationRecord.evaluation_scale_code || EVALUATION_SCALE_CODES.ADMINISTRATORS
    const items = snapshotData.items || []

    const isAdmin = scaleCode === EVALUATION_SCALE_CODES.ADMINISTRATORS
    const maxScore = isAdmin ? 160.0 : 150.0
    const passingScore = isAdmin ? 120.0 : 75.0

    let unresolvedJudgmentCount = 0
    const areaSums = {
      A: 0.0,
      B: 0.0,
      C: 0.0
    }

    items.forEach((item) => {
      const area = String(item.area || item.area_code || 'B').toUpperCase().replace(/^AREA_?/, '')
      const isJudgment = Boolean(item.evaluator_judgment_required || item.is_evaluator_judgment_required)
      const accepted = item.accepted_points

      if (isJudgment && (accepted === null || accepted === undefined)) {
        unresolvedJudgmentCount++
      }

      const effectivePoints = (accepted !== null && accepted !== undefined)
        ? Number(accepted)
        : (isJudgment ? 0.0 : Number(item.capped_points !== undefined ? item.capped_points : (item.points || item.raw_points || 0.0)))

      if (areaSums[area] !== undefined) {
        areaSums[area] += effectivePoints
      }
    })

    let areaCapped = {}
    let overallTotal = 0.0
    let isScoringComplete = false

    if (isAdmin) {
      areaCapped = {
        A: Math.min(70.0, areaSums.A),
        B: Math.min(50.0, areaSums.B),
        C: Math.min(40.0, areaSums.C)
      }
      overallTotal = Math.min(160.0, areaCapped.A + areaCapped.B + areaCapped.C)
      isScoringComplete = (unresolvedJudgmentCount === 0)
    } else {
      // Non-Teaching Scale
      const areaATotal = (areaAInputs && areaAInputs.total_area_a !== undefined) ? Number(areaAInputs.total_area_a) : 0.0
      const isAreaAComplete = Boolean(areaAInputs && areaAInputs.is_complete)

      areaCapped = {
        A: Math.min(90.0, areaATotal),
        B: Math.min(60.0, areaSums.B)
      }
      overallTotal = Math.min(150.0, areaCapped.A + areaCapped.B)
      isScoringComplete = (unresolvedJudgmentCount === 0) && isAreaAComplete
    }

    const planFResultStatus = isScoringComplete ? 'result_ready' : 'pending'
    let planFFinalResult = null
    if (isScoringComplete) {
      planFFinalResult = (overallTotal >= passingScore) ? RESULT_VOCABULARY.PASSED : RESULT_VOCABULARY.RETAINED
    }

    return {
      evaluation_id: evaluationRecord.id || evaluationRecord.evaluation_id || 'EVAL-001',
      scale_code: scaleCode,
      scoring_complete: isScoringComplete,
      pending_judgment_count: unresolvedJudgmentCount,
      area_raw_sums: areaSums,
      area_capped_totals: areaCapped,
      official_accepted_total: overallTotal,
      maximum_score: maxScore,
      passing_score: passingScore,
      plan_f_result_status: planFResultStatus,
      plan_f_final_result: planFFinalResult
    }
  }

  /**
   * Extracts canonical criterion code (e.g. 'B.3', 'B.6', 'B.5') from category string.
   */
  static extractCriterionKey(category = '') {
    const matches = String(category).match(/(B\.[0-9]+)/i)
    if (matches && matches[1]) {
      return matches[1].toUpperCase()
    }
    return 'UNKNOWN'
  }
}
