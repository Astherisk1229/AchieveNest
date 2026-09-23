/**
 * PersonnelEvaluatorWorkspaceService.js
 *
 * Canonical Authoritative Frontend Mirror & Evaluator Workspace Service for Plan G — Phase G2.
 * Validates reviewer access, parses submitted snapshots, presents Plan F scoring metadata,
 * renders evaluator-judgment pending states, and supports evidence inspection with controlled
 * missing-evidence handling.
 */

import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from './evaluationInstrumentRegistry.js'
import PersonnelReviewerRoutingRegistry, {
  REVIEWER_ROLES,
  ROUTING_REASON_CODES
} from './PersonnelReviewerRoutingRegistry.js'

export const EVIDENCE_STATUSES = Object.freeze({
  PREVIEW_READY: 'preview_ready',
  EVIDENCE_UNAVAILABLE: 'evidence_unavailable'
})

export const JUDGMENT_STATUSES = Object.freeze({
  AWAITING_EVALUATOR: 'awaiting_evaluator',
  SCORED: 'scored',
  NOT_APPLICABLE: 'not_applicable'
})

export default class PersonnelEvaluatorWorkspaceService {
  static WORKSPACE_VERSION = 'NDMU-EVAL-WORKSPACE-V2'
  static RULE_VERSION = EVALUATION_RULE_VERSION

  /**
   * Validates whether an authenticated actor has permission to access the evaluation workspace.
   */
  static validateReviewerAccess(reviewerActor = {}, evaluationRecord = {}) {
    const actorProfileId = String(reviewerActor.profile_id || (reviewerActor.profile && reviewerActor.profile.id) || '')
    const personnelProfileId = String(evaluationRecord.personnel_profile_id || '')

    // 1. Self-Review Block
    if (actorProfileId && actorProfileId === personnelProfileId) {
      throw new Error('Access Denied: Candidate cannot access their own evaluation with reviewer privileges (Self-review prohibited).')
    }

    const actorRoles = Array.isArray(reviewerActor.roles)
      ? reviewerActor.roles
      : (reviewerActor.role ? [reviewerActor.role] : [])

    // 2. Department Secretary Exclusion
    if (actorRoles.includes('department_secretary') && !actorRoles.includes('dean') && !actorRoles.includes('hr_staff') && !actorRoles.includes('hr_admin')) {
      throw new Error('Access Denied: Department Secretary role does not possess evaluator authority.')
    }

    const assignedRole = evaluationRecord.assigned_reviewer_role || evaluationRecord.evaluator_role || null
    const targetCollegeId = evaluationRecord.evaluator_college_id || evaluationRecord.target_college_id || null

    // 3. Dean Scope Enforcement
    if (assignedRole === REVIEWER_ROLES.DEAN) {
      if (!actorRoles.includes('dean')) {
        throw new Error('Access Denied: Evaluation is assigned to College Dean, but actor does not hold the active dean role.')
      }
      const actorCollegeId = reviewerActor.assigned_college_id || (reviewerActor.profile && reviewerActor.profile.college_id)
      if (targetCollegeId && actorCollegeId !== targetCollegeId) {
        throw new Error(`Access Denied: Dean of college [${actorCollegeId}] cannot access evaluations for college [${targetCollegeId}] (Cross-college access prohibited).`)
      }
      return true
    }

    // 4. HR Scope Enforcement
    if (assignedRole === REVIEWER_ROLES.HR) {
      if (!actorRoles.includes('hr_staff') && !actorRoles.includes('hr_admin')) {
        throw new Error('Access Denied: Evaluation is assigned to HR Office, but actor is not an authorized HR evaluator.')
      }
      return true
    }

    throw new Error('Access Denied: Reviewer assignment is unresolved or actor is unauthorized.')
  }

  /**
   * Builds the complete Evaluator Workspace DTO from submitted snapshot data and evaluation record.
   */
  static getEvaluationWorkspace(evaluationRecord = {}, reviewerActor = {}, snapshotData = {}) {
    // 1. Validate Access
    this.validateReviewerAccess(reviewerActor, evaluationRecord)

    const evaluationId = evaluationRecord.evaluation_id || evaluationRecord.id || 'EVAL-UNKNOWN'
    const scaleCode = evaluationRecord.evaluation_scale_code || EVALUATION_SCALE_CODES.ADMINISTRATORS
    const ruleVersion = evaluationRecord.rule_version || this.RULE_VERSION

    const isAdminScale = scaleCode === EVALUATION_SCALE_CODES.ADMINISTRATORS
    const scaleTitle = isAdminScale
      ? 'Rating Sheet for Administrators & Academic Personnel'
      : 'Non-Teaching Personnel Rating Sheet for Ranking (Appendix N)'
    const scaleMax = isAdminScale ? 160.0 : 150.0
    const passingScore = isAdminScale ? 120.0 : 75.0

    // 2. Assemble Personnel Header Context
    const personnelHeader = {
      personnel_profile_id: evaluationRecord.personnel_profile_id || '',
      full_name: evaluationRecord.personnel_name || evaluationRecord.faculty_name || 'Candidate Name',
      employee_id: evaluationRecord.employee_id || evaluationRecord.institutional_id || 'N/A',
      email: evaluationRecord.email || 'candidate@ndmu.edu.ph',
      personnel_group: evaluationRecord.personnel_group || 'faculty',
      organizational_side: evaluationRecord.organizational_side || 'academic',
      college_code: evaluationRecord.college_code || evaluationRecord.evaluator_college_id || 'N/A',
      college_name: evaluationRecord.college_name || evaluationRecord.college || 'Academic College',
      department_unit: evaluationRecord.department_unit || evaluationRecord.department || 'Academic Department',
      designation_title: evaluationRecord.designation_title || evaluationRecord.designation || 'Faculty Member',
      faculty_workload_status: evaluationRecord.faculty_workload_status || 'Full-Time',
      current_rank: evaluationRecord.current_rank || evaluationRecord.academic_rank || 'Assistant Professor I',
      employment_status: evaluationRecord.employment_status || 'Permanent',
      evaluation_status: evaluationRecord.evaluation_status || evaluationRecord.status || 'submitted',
      submission_date: evaluationRecord.submitted_at || evaluationRecord.submittedDate || new Date().toISOString(),
      assigned_reviewer_role: evaluationRecord.assigned_reviewer_role || evaluationRecord.evaluator_role || 'dean',
      evaluator_name: evaluationRecord.evaluator_name || 'Assigned Reviewer'
    }

    // 3. Assemble Areas & Items Read Model
    const itemsByArea = this.buildWorkspaceItemsByArea(scaleCode, snapshotData, evaluationRecord)

    // Count pending evaluator-judgment items
    let pendingJudgmentCount = 0
    Object.values(itemsByArea).forEach((area) => {
      area.items.forEach((item) => {
        if (item.is_evaluator_judgment_required && item.accepted_points === null) {
          pendingJudgmentCount++
        }
      })
    })

    // 4. Scale Context Header
    const scaleHeader = {
      evaluation_scale_code: scaleCode,
      scale_title: scaleTitle,
      rule_version: ruleVersion,
      maximum_score: scaleMax,
      passing_score: passingScore,
      is_non_teaching: !isAdminScale,
      pending_judgment_count: pendingJudgmentCount,
      scoring_completeness: pendingJudgmentCount === 0 ? 'scoring_complete' : 'pending_evaluator_judgment'
    }

    return {
      workspace_version: this.WORKSPACE_VERSION,
      evaluation_id: evaluationId,
      is_read_only_snapshot: true,
      personnel_context: personnelHeader,
      scale_context: scaleHeader,
      areas: itemsByArea,
      loaded_at: new Date().toISOString()
    }
  }

  /**
   * Builds structured Area sections with items, evidence links, and Plan F scoring metadata.
   */
  static buildWorkspaceItemsByArea(scaleCode, snapshotData = {}, evaluationRecord = {}) {
    const rawItems = snapshotData.items || evaluationRecord.items || []

    if (scaleCode === EVALUATION_SCALE_CODES.NON_TEACHING) {
      return {
        AREA_A: {
          area_code: 'A',
          name: 'Area A: Performance and Personal Indicators',
          max_points: 90.0,
          is_evaluator_only: true,
          entry_policy: 'evaluator_only',
          rating_structure: [
            { indicator: 'Job Performance', weight: 50.0, status: 'pending_hr_evaluation' },
            { indicator: 'Personal Attitudes and Qualities', weight: 10.0, status: 'pending_hr_evaluation' },
            { indicator: 'Efficiency', weight: 30.0, status: 'pending_hr_evaluation' }
          ],
          items: [],
          area_raw_sum: 0.0,
          area_capped_total: 0.0
        },
        AREA_B: {
          area_code: 'B',
          name: 'Area B: Service and Leadership',
          max_points: 60.0,
          is_evaluator_only: false,
          items: this.formatSubmittedItems(rawItems, 'B', scaleCode),
          area_raw_sum: this.sumItemsPoints(rawItems, 'B'),
          area_capped_total: Math.min(60.0, this.sumItemsPoints(rawItems, 'B'))
        }
      }
    }

    // Administrators Scale (Areas A, B, C)
    return {
      AREA_A: {
        area_code: 'A',
        name: 'Area A: Professional Development',
        max_points: 70.0,
        is_evaluator_only: false,
        items: this.formatSubmittedItems(rawItems, 'A', scaleCode),
        area_raw_sum: this.sumItemsPoints(rawItems, 'A'),
        area_capped_total: Math.min(70.0, this.sumItemsPoints(rawItems, 'A'))
      },
      AREA_B: {
        area_code: 'B',
        name: 'Area B: Productivity and Creative Work',
        max_points: 50.0,
        is_evaluator_only: false,
        items: this.formatSubmittedItems(rawItems, 'B', scaleCode),
        area_raw_sum: this.sumItemsPoints(rawItems, 'B'),
        area_capped_total: Math.min(50.0, this.sumItemsPoints(rawItems, 'B'))
      },
      AREA_C: {
        area_code: 'C',
        name: 'Area C: Service to the Institution and Community',
        max_points: 40.0,
        is_evaluator_only: false,
        items: this.formatSubmittedItems(rawItems, 'C', scaleCode),
        area_raw_sum: this.sumItemsPoints(rawItems, 'C'),
        area_capped_total: Math.min(40.0, this.sumItemsPoints(rawItems, 'C'))
      }
    }
  }

  /**
   * Formats submitted accomplishment items with evidence links and Plan F scoring explanations.
   */
  static formatSubmittedItems(items = [], areaCode = 'A', scaleCode = EVALUATION_SCALE_CODES.ADMINISTRATORS) {
    const targetArea = String(areaCode).toUpperCase().trim()
    const areaItems = items.filter((item) => {
      const rawArea = String(item.categoryArea || item.area_code || item.area || '').toUpperCase().trim()
      const normalizedArea = rawArea.replace(/^AREA_?/, '')
      return normalizedArea === targetArea || rawArea === targetArea
    })

    return areaItems.map((item) => {
      const criterionCode = item.criterionCode || item.criterion_code || 'N/A'
      const isJudgment = Boolean(item.evaluator_judgment_required)
        || (scaleCode === EVALUATION_SCALE_CODES.ADMINISTRATORS && ['B.3', 'B.6'].includes(criterionCode))
        || (scaleCode === EVALUATION_SCALE_CODES.NON_TEACHING && ['B.5'].includes(criterionCode))

      let maxAllowed = 40.0
      if (criterionCode === 'B.6') maxAllowed = 20.0
      if (criterionCode === 'B.5') maxAllowed = 30.0

      // Evidence Status & Link
      const fileName = item.fileName || item.proof_file_name || item.proof || null
      const evidenceId = item.evidence_id || item.evidenceId || null
      const hasEvidence = Boolean(evidenceId || fileName)
      const evidenceStatus = hasEvidence ? EVIDENCE_STATUSES.PREVIEW_READY : EVIDENCE_STATUSES.EVIDENCE_UNAVAILABLE
      const previewUrl = evidenceId 
        ? `/api/v1/evidence/personnel/${evidenceId}/preview` 
        : (fileName ? `/api/v1/evidence/preview/${fileName}` : null)

      return {
        id: item.id || 'ITEM-' + Math.random().toString(36).substring(2, 9),
        criterion_code: criterionCode,
        criterion_title: item.criterionTitle || item.title || 'Criterion Item',
        achievement_title: item.evidenceTitle || item.title || 'Submitted Title',
        submitted_metadata: item.scoringPayload || item.metadata || {},
        evidence_reference: {
          evidence_id: evidenceId,
          file_name: fileName,
          status: evidenceStatus,
          preview_url: previewUrl,
          warning_message: hasEvidence ? null : `Required evidence attachment is missing or unavailable for [${criterionCode}].`
        },
        raw_points: Number(item.raw_points || item.awardedPoints || 0.0),
        criterion_capped_points: Number(item.criterion_capped_points || item.awardedPoints || 0.0),
        accepted_points: isJudgment ? (item.accepted_points !== undefined ? item.accepted_points : null) : Number(item.criterion_capped_points || item.awardedPoints || 0.0),
        is_evaluator_judgment_required: isJudgment,
        max_allowed_points: isJudgment ? maxAllowed : null,
        evaluator_judgment_status: isJudgment ? (item.accepted_points !== null && item.accepted_points !== undefined ? JUDGMENT_STATUSES.SCORED : JUDGMENT_STATUSES.AWAITING_EVALUATOR) : JUDGMENT_STATUSES.NOT_APPLICABLE,
        scoring_explanation: item.evaluatorRemarks || item.explanation || 'Scored under canonical Plan F rules.',
        is_read_only: true
      }
    })
  }

  /**
   * Calculates sum of points for an area.
   */
  static sumItemsPoints(items = [], areaCode = 'A') {
    const targetArea = String(areaCode).toUpperCase().trim()
    let sum = 0.0
    items.forEach((item) => {
      const rawArea = String(item.categoryArea || item.area_code || item.area || '').toUpperCase().trim()
      const normalizedArea = rawArea.replace(/^AREA_?/, '')
      if (normalizedArea === targetArea || rawArea === targetArea) {
        sum += Number(item.awardedPoints || item.criterion_capped_points || item.raw_points || 0.0)
      }
    })
    return sum
  }
}
