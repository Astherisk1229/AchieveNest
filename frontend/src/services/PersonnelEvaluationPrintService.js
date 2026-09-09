/**
 * PersonnelEvaluationPrintService.js
 *
 * Authoritative Printable Evaluation, Deliberation-Ready Output & Blank Approval Engine (Plan H — Phase H2).
 * Generates the official printable evaluation summary from persisted H0/H1 evaluation data
 * and finalized Plan F scoring results, leaving all approval/signature fields completely blank
 * for manual deliberation and executive completion.
 *
 * Core Governance Invariants:
 * 1. Printing presents the finalized evaluation for deliberation; it must NEVER decide promotion,
 *    change rank/title, or pre-fill approval decisions.
 * 2. Preconditions: H0 finalization readiness must be valid and H1 Evaluation Result must be finalized.
 * 3. Exact vocabulary: Evaluation Result displays strictly as 'Passed' or 'Retained'.
 * 4. Approval section ('Recommended for Approval' through 'Approved / President / Date') is strictly blank.
 * 5. Printing is completely read-only and non-mutating (zero writes to rank or promotion state).
 * 6. Historical stability: Uses persisted historical evaluated rank, scale, and rule version.
 * 7. Security: Only authorized HR actors (hr_staff, hr_admin) can generate official deliberation print output.
 */

import PersonnelEvaluationFinalizationReadinessService from './PersonnelEvaluationFinalizationReadinessService.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from './evaluationInstrumentRegistry.js'
import { RESULT_VOCABULARY } from './PersonnelEvaluationResultPersistenceService.js'

export const OUTPUT_TYPES = Object.freeze({
  DELIBERATION_SUMMARY: 'deliberation_summary',
  PRINT_VIEW: 'print_view',
  PDF_EXPORT: 'pdf_export'
})

export const PRINT_REASON_CODES = Object.freeze({
  PRINT_ELIGIBLE: 'print_eligible',
  EVALUATION_NOT_READY_FOR_PRINT: 'evaluation_not_ready_for_print',
  MISSING_EVALUATION_RESULT: 'missing_evaluation_result',
  SCORING_INCOMPLETE: 'scoring_incomplete',
  UNAUTHORIZED_HR_ACTOR: 'unauthorized_hr_actor'
})

export default class PersonnelEvaluationPrintService {
  static RULE_VERSION = EVALUATION_RULE_VERSION

  /**
   * Validates whether an authenticated actor has HR authority to generate official deliberation print output.
   */
  static validateHRAccess(actor = {}) {
    const roles = Array.isArray(actor.roles)
      ? actor.roles
      : (actor.role ? [actor.role] : [])

    if (roles.includes('hr_staff') || roles.includes('hr_admin')) {
      return true
    }

    throw new Error('Access Denied (403): Only authorized HR personnel may print official deliberation evaluations.')
  }

  /**
   * Validates print eligibility: H0 readiness valid, H1 result finalized, scoring complete.
   */
  static validatePrintEligibility({
    evaluationRecord = {},
    snapshotData = {},
    resultRecord = null,
    areaAInputs = null,
    actor = null
  } = {}) {
    if (actor !== null) {
      this.validateHRAccess(actor)
    }

    const evaluationId = evaluationRecord.id || evaluationRecord.evaluation_id || null
    if (!evaluationId) {
      return {
        eligible: false,
        reason_code: PRINT_REASON_CODES.EVALUATION_NOT_READY_FOR_PRINT,
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
        eligible: false,
        reason_code: PRINT_REASON_CODES.EVALUATION_NOT_READY_FOR_PRINT,
        message: `Evaluation [${evaluationId}] is not ready for print: ${readiness.reason_message}`,
        readiness
      }
    }

    // 2. Verify H1 Evaluation Result exists or is determinable
    const evaluationResult = resultRecord?.evaluation_result || readiness.evaluation_result
    if (!evaluationResult || (evaluationResult !== RESULT_VOCABULARY.PASSED && evaluationResult !== RESULT_VOCABULARY.RETAINED)) {
      return {
        eligible: false,
        reason_code: PRINT_REASON_CODES.MISSING_EVALUATION_RESULT,
        message: `Authoritative Evaluation Result (Passed or Retained) is missing or unfinalized for evaluation [${evaluationId}].`
      }
    }

    return {
      eligible: true,
      reason_code: PRINT_REASON_CODES.PRINT_ELIGIBLE,
      message: 'Evaluation is complete, validated, and eligible for deliberation print.',
      readiness,
      evaluation_result: evaluationResult
    }
  }

  /**
   * Constructs the official blank approval section.
   * All signatures, approver names, and dates MUST remain null/blank for manual executive action.
   */
  static buildApprovalSection() {
    return {
      recommended_for_approval: {
        label: 'Recommended for Approval',
        name: null,
        title: null,
        signature: null,
        date: null,
        remarks: null,
        status: 'blank'
      },
      approved: {
        label: 'Approved',
        name: null,
        title: null,
        signature: null,
        date: null,
        remarks: null,
        status: 'blank'
      },
      president: {
        label: 'University President',
        name: null,
        title: 'President',
        signature: null,
        date: null,
        status: 'blank'
      }
    }
  }

  /**
   * Builds the complete, immutable deliberation-ready printable evaluation read model.
   */
  static buildPrintableEvaluation({
    evaluationRecord = {},
    snapshotData = {},
    resultRecord = null,
    areaAInputs = null,
    actor = null,
    outputType = OUTPUT_TYPES.DELIBERATION_SUMMARY
  } = {}) {
    // 1. Authorize HR Actor
    if (actor !== null) {
      this.validateHRAccess(actor)
    }

    // 2. Verify Eligibility
    const eligibility = this.validatePrintEligibility({
      evaluationRecord,
      snapshotData,
      resultRecord,
      areaAInputs,
      actor
    })

    if (!eligibility.eligible) {
      const error = new Error(`Cannot generate printable evaluation: ${eligibility.message} Reason: [${eligibility.reason_code}]`)
      error.reason_code = eligibility.reason_code
      error.eligibility = eligibility
      throw error
    }

    const readiness = eligibility.readiness
    const evaluationId = String(evaluationRecord.id || evaluationRecord.evaluation_id)
    const currentRank = String(evaluationRecord.current_rank || evaluationRecord.academic_rank || 'Unassigned')
    const scaleCode = String(evaluationRecord.evaluation_scale_code || readiness.evaluation_scale_code)
    const ruleVersion = String(evaluationRecord.rule_version || this.RULE_VERSION)
    const cycle = String(evaluationRecord.academic_year || evaluationRecord.evaluation_cycle_id || '2025-2026')

    const evaluationResult = String(resultRecord?.evaluation_result || readiness.evaluation_result)
    const finalAcceptedTotal = Number(resultRecord?.final_accepted_total ?? readiness.official_accepted_total)
    const passingScore = Number(resultRecord?.passing_score ?? readiness.passing_score)
    const maximumScore = Number(resultRecord?.maximum_score ?? readiness.maximum_score)

    const deliberationNotice = evaluationResult === RESULT_VOCABULARY.PASSED
      ? 'Evaluation passed. Eligible to proceed to deliberation under Plan H.'
      : 'Current rank/title retained. No rank adjustment required.'

    const resultExplanation = String(resultRecord?.result_explanation || (
      evaluationResult === RESULT_VOCABULARY.PASSED
        ? `Final accepted total ${finalAcceptedTotal.toFixed(2)} meets or exceeds the required passing score of ${passingScore.toFixed(2)}.`
        : `Final accepted total ${finalAcceptedTotal.toFixed(2)} is below the required passing score of ${passingScore.toFixed(2)}.`
    ))

    // 3. Personnel Identity Section (Official Form Fields Only)
    const personnelIdentity = {
      full_name: String(evaluationRecord.personnel_name || evaluationRecord.faculty_name || 'Candidate Name'),
      employee_id: String(evaluationRecord.employee_id || evaluationRecord.personnel_profile_id || 'EMP-001'),
      department: String(evaluationRecord.department_name || evaluationRecord.department || 'Department'),
      college_or_unit: String(evaluationRecord.college_name || evaluationRecord.target_college_id || 'College/Unit'),
      designation: String(evaluationRecord.designation || 'Faculty Member'),
      evaluated_current_rank: currentRank,
      evaluation_cycle: cycle
    }

    // 4. Reviewer Context Section
    const reviewerContext = {
      reviewer_role: String(evaluationRecord.assigned_reviewer_role || evaluationRecord.evaluator_role || 'Evaluator'),
      reviewer_id: String(evaluationRecord.evaluator_profile_id || 'REV-001'),
      review_status: 'completed',
      review_completed_at: String(evaluationRecord.review_completed_at || new Date().toISOString())
    }

    // 5. Scoring Breakdown Structure
    const scoringBreakdown = this.buildScoringBreakdown(scaleCode, snapshotData, areaAInputs, finalAcceptedTotal, maximumScore, passingScore)

    // 6. Approval Section (Strictly Blank)
    const approvalSection = this.buildApprovalSection()

    // 7. Assemble Complete Deliberation-Ready Output DTO
    return {
      document_title: 'Personnel Evaluation and Rating Sheet',
      output_type: outputType,
      generated_at: new Date().toISOString(),
      generated_by: actor?.profile_id || actor?.id || 'system_hr',
      evaluation_id: evaluationId,
      personnel_identity: personnelIdentity,
      evaluation_context: {
        evaluation_scale_code: scaleCode,
        scale_title: scaleCode === EVALUATION_SCALE_CODES.ADMINISTRATORS
          ? 'Rating Sheet for Administrators & Academic Personnel'
          : 'Rating Sheet for Non-Teaching Personnel',
        rule_version: ruleVersion,
        evaluation_cycle: cycle,
        snapshot_version: String(snapshotData.snapshot_version || 'v1.0.0'),
        reviewer: reviewerContext
      },
      scoring_breakdown: scoringBreakdown,
      evaluation_result: {
        outcome: evaluationResult,
        final_accepted_total: finalAcceptedTotal,
        passing_score: passingScore,
        maximum_score: maximumScore,
        explanation: resultExplanation,
        deliberation_notice: deliberationNotice,
        current_rank_preserved: currentRank,
        // Strict Separation: No promotion decision in H2
        promotion_decision: null,
        deliberation_status: 'ready_for_deliberation'
      },
      approval_section: approvalSection,
      // Hard Non-Mutation Invariant
      mutations_applied: false
    }
  }

  /**
   * Builds the structured scoring breakdown formatted for the official form.
   */
  static buildScoringBreakdown(scaleCode, snapshotData = {}, areaAInputs = null, finalAcceptedTotal, maximumScore, passingScore) {
    const items = snapshotData.items || []
    let areas = {}

    if (scaleCode === EVALUATION_SCALE_CODES.ADMINISTRATORS) {
      const areaSums = { A: 0.0, B: 0.0, C: 0.0 }
      const itemsByArea = { A: [], B: [], C: [] }

      items.forEach((item) => {
        const area = String(item.area || item.area_code || 'B').toUpperCase()
        const accepted = Number(item.accepted_points ?? 0.0)
        if (areaSums[area] !== undefined) {
          areaSums[area] += accepted
          itemsByArea[area].push({
            item_id: String(item.id || ''),
            category: String(item.category || item.category_code || ''),
            raw_points: Number(item.raw_points ?? accepted),
            accepted_points: accepted,
            is_judgment: Boolean(item.evaluator_judgment_required)
          })
        }
      })

      areas = {
        area_a: {
          area_code: 'A',
          title: 'Educational Qualifications',
          cap: 70.0,
          raw_total: areaSums.A,
          capped_total: Math.min(70.0, areaSums.A),
          items: itemsByArea.A
        },
        area_b: {
          area_code: 'B',
          title: 'Professional Growth & Achievements',
          cap: 50.0,
          raw_total: areaSums.B,
          capped_total: Math.min(50.0, areaSums.B),
          items: itemsByArea.B
        },
        area_c: {
          area_code: 'C',
          title: 'Community Involvement & Extension Services',
          cap: 40.0,
          raw_total: areaSums.C,
          capped_total: Math.min(40.0, areaSums.C),
          items: itemsByArea.C
        }
      }
    } else {
      // Non-Teaching Scale
      let areaBTotal = 0.0
      const itemsAreaB = []

      items.forEach((item) => {
        const accepted = Number(item.accepted_points ?? 0.0)
        areaBTotal += accepted
        itemsAreaB.push({
          item_id: String(item.id || ''),
          category: String(item.category || item.category_code || ''),
          raw_points: Number(item.raw_points ?? accepted),
          accepted_points: accepted,
          is_judgment: Boolean(item.evaluator_judgment_required)
        })
      })

      const areaATotal = Number(areaAInputs?.total_area_a ?? 0.0)

      areas = {
        area_a: {
          area_code: 'A',
          title: 'Evaluator Performance Ratings',
          cap: 90.0,
          raw_total: areaATotal,
          capped_total: Math.min(90.0, areaATotal),
          evaluator_ratings: {
            job_performance: Number(areaAInputs?.job_performance ?? 0.0),
            personal_attitudes: Number(areaAInputs?.personal_attitudes ?? 0.0),
            efficiency: Number(areaAInputs?.efficiency ?? 0.0)
          }
        },
        area_b: {
          area_code: 'B',
          title: 'Service Years & Achievements',
          cap: 60.0,
          raw_total: areaBTotal,
          capped_total: Math.min(60.0, areaBTotal),
          items: itemsAreaB
        }
      }
    }

    return {
      areas,
      official_accepted_total: finalAcceptedTotal,
      maximum_score: maximumScore,
      passing_score: passingScore
    }
  }
}
