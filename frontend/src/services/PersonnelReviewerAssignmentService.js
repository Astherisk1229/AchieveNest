/**
 * PersonnelReviewerAssignmentService.js
 *
 * Canonical Authoritative Frontend Mirror & Reviewer Queue Assignment Service for Plan G — Phase G1.
 * Resolves reviewer routes, binds evaluator actors, enforces Dean intra-college and HR scope boundaries,
 * handles submitted -> in_evaluation transitions, and blocks self-review and client tampering.
 */

import PersonnelReviewerRoutingRegistry, {
  REVIEWER_ROLES,
  REVIEWER_SCOPE_TYPES,
  ROUTING_REASON_CODES
} from './PersonnelReviewerRoutingRegistry.js'

export const EVALUATION_STATUSES = Object.freeze({
  SUBMITTED: 'submitted',
  IN_EVALUATION: 'in_evaluation',
  READY_FOR_FINALIZATION: 'ready_for_finalization',
  RETURNED_FOR_REVISION: 'returned_for_revision',
  COMPLETED: 'completed'
})

export const ASSIGNMENT_STATUSES = Object.freeze({
  ASSIGNED: 'assigned',
  UNRESOLVED: 'unresolved'
})

export default class PersonnelReviewerAssignmentService {
  static RULE_VERSION = 'NDMU-REVIEWER-ROUTING-V1'

  /**
   * Resolves the canonical reviewer route from personnel evaluation context.
   */
  static resolveReviewerRoute(evaluationContext = {}) {
    return PersonnelReviewerRoutingRegistry.resolveReviewerRoute(evaluationContext)
  }

  /**
   * Resolves the specific reviewer actor (User/Profile) for the evaluation.
   */
  static resolveReviewerActor(evaluationContext = {}, directoryContext = {}) {
    const route = this.resolveReviewerRoute(evaluationContext)

    if (route.status !== 'resolved') {
      return {
        status: ASSIGNMENT_STATUSES.UNRESOLVED,
        reviewer_role: null,
        reviewer_profile_id: null,
        evaluator_college_id: null,
        reason_code: route.reason_code || ROUTING_REASON_CODES.REVIEWER_ROUTE_UNRESOLVED,
        routing_reason: route.routing_reason || 'Reviewer route could not be resolved.'
      }
    }

    const personnelProfileId = String(evaluationContext.personnel_profile_id || '')
    const assignedRole = route.authorized_reviewer_role
    const targetCollegeId = route.target_college_id || null

    // 1. Resolve Dean Reviewer
    if (assignedRole === REVIEWER_ROLES.DEAN) {
      const deansByCollege = directoryContext.deans_by_college || {}
      const activeDean = deansByCollege[targetCollegeId] || null

      if (!activeDean) {
        // Rule: Missing Dean assignment does NOT fall back to HR
        return {
          status: ASSIGNMENT_STATUSES.UNRESOLVED,
          reviewer_role: REVIEWER_ROLES.DEAN,
          reviewer_profile_id: null,
          evaluator_college_id: targetCollegeId,
          reason_code: 'dean_assignment_missing',
          routing_reason: `Active Dean assignment missing for college [${targetCollegeId}]. HR fallback is prohibited.`
        }
      }

      const deanProfileId = String(activeDean.profile_id || activeDean.id || '')

      // Self-Review Check
      if (deanProfileId && deanProfileId === personnelProfileId) {
        return {
          status: ASSIGNMENT_STATUSES.UNRESOLVED,
          reviewer_role: REVIEWER_ROLES.DEAN,
          reviewer_profile_id: null,
          evaluator_college_id: targetCollegeId,
          reason_code: ROUTING_REASON_CODES.SELF_EVALUATION_PROHIBITED,
          routing_reason: 'Evaluated candidate is the Dean of the college. Self-review is prohibited.'
        }
      }

      return {
        status: ASSIGNMENT_STATUSES.ASSIGNED,
        reviewer_role: REVIEWER_ROLES.DEAN,
        reviewer_profile_id: deanProfileId,
        reviewer_name: activeDean.full_name || activeDean.name || 'College Dean',
        evaluator_college_id: targetCollegeId,
        reason_code: ROUTING_REASON_CODES.ROUTE_ASSIGNED,
        routing_reason: route.routing_reason
      }
    }

    // 2. Resolve HR Reviewer
    if (assignedRole === REVIEWER_ROLES.HR) {
      const hrStaffList = directoryContext.hr_staff_list || []
      let defaultHr = hrStaffList[0] || { id: 'HR-DEFAULT-EVALUATOR', full_name: 'HR Evaluation Staff' }

      let hrProfileId = String(defaultHr.profile_id || defaultHr.id || '')

      // Self-Review Check
      if (hrProfileId && hrProfileId === personnelProfileId) {
        if (hrStaffList.length > 1) {
          defaultHr = hrStaffList[1]
          hrProfileId = String(defaultHr.profile_id || defaultHr.id || '')
        } else {
          return {
            status: ASSIGNMENT_STATUSES.UNRESOLVED,
            reviewer_role: REVIEWER_ROLES.HR,
            reviewer_profile_id: null,
            evaluator_college_id: null,
            reason_code: ROUTING_REASON_CODES.SELF_EVALUATION_PROHIBITED,
            routing_reason: 'Candidate is the assigned HR evaluator. Alternate evaluator required to prevent self-review.'
          }
        }
      }

      return {
        status: ASSIGNMENT_STATUSES.ASSIGNED,
        reviewer_role: REVIEWER_ROLES.HR,
        reviewer_profile_id: hrProfileId,
        reviewer_name: defaultHr.full_name || defaultHr.name || 'HR Office Evaluator',
        evaluator_college_id: null,
        reason_code: ROUTING_REASON_CODES.ROUTE_ASSIGNED,
        routing_reason: route.routing_reason
      }
    }

    return {
      status: ASSIGNMENT_STATUSES.UNRESOLVED,
      reviewer_role: null,
      reviewer_profile_id: null,
      evaluator_college_id: null,
      reason_code: ROUTING_REASON_CODES.REVIEWER_ROUTE_UNRESOLVED,
      routing_reason: 'Unrecognized reviewer role.'
    }
  }

  /**
   * Binds reviewer assignment to an evaluation record.
   */
  static assignReviewer(evaluationRecord = {}, directoryContext = {}) {
    const actorResolution = this.resolveReviewerActor(evaluationRecord, directoryContext)
    const evaluationId = evaluationRecord.evaluation_id || evaluationRecord.id || 'EVAL-' + Math.random().toString(36).substring(2, 9)
    const currentStatus = evaluationRecord.status || EVALUATION_STATUSES.SUBMITTED

    if (actorResolution.status === ASSIGNMENT_STATUSES.ASSIGNED) {
      return {
        evaluation_id: evaluationId,
        personnel_profile_id: evaluationRecord.personnel_profile_id || null,
        assigned_reviewer_role: actorResolution.reviewer_role,
        evaluator_profile_id: actorResolution.reviewer_profile_id,
        evaluator_name: actorResolution.reviewer_name || null,
        evaluator_college_id: actorResolution.evaluator_college_id,
        assignment_status: ASSIGNMENT_STATUSES.ASSIGNED,
        reason_code: actorResolution.reason_code,
        routing_reason: actorResolution.routing_reason,
        assigned_at: evaluationRecord.assigned_at || new Date().toISOString(),
        evaluation_status: currentStatus,
        rule_version: this.RULE_VERSION
      }
    }

    return {
      evaluation_id: evaluationId,
      personnel_profile_id: evaluationRecord.personnel_profile_id || null,
      assigned_reviewer_role: null,
      evaluator_profile_id: null,
      evaluator_name: null,
      evaluator_college_id: actorResolution.evaluator_college_id || null,
      assignment_status: ASSIGNMENT_STATUSES.UNRESOLVED,
      reason_code: actorResolution.reason_code,
      routing_reason: actorResolution.routing_reason,
      assigned_at: null,
      evaluation_status: currentStatus,
      rule_version: this.RULE_VERSION
    }
  }

  /**
   * Transitions an assigned evaluation from 'submitted' to 'in_evaluation'.
   */
  static transitionToInEvaluation(assignmentDto = {}) {
    if (assignmentDto.assignment_status !== ASSIGNMENT_STATUSES.ASSIGNED) {
      throw new Error(`Cannot transition evaluation to [in_evaluation]: Reviewer assignment is unresolved (${assignmentDto.routing_reason || 'Unresolved'}).`)
    }

    const currentStatus = assignmentDto.evaluation_status || EVALUATION_STATUSES.SUBMITTED
    if (currentStatus !== EVALUATION_STATUSES.SUBMITTED && currentStatus !== EVALUATION_STATUSES.IN_EVALUATION) {
      throw new Error(`Cannot transition evaluation from [${currentStatus}] to [in_evaluation].`)
    }

    return {
      ...assignmentDto,
      evaluation_status: EVALUATION_STATUSES.IN_EVALUATION,
      in_evaluation_started_at: assignmentDto.in_evaluation_started_at || new Date().toISOString()
    }
  }

  /**
   * Validates whether a specific actor is authorized to access and review an evaluation.
   */
  static canReviewerAccessEvaluation(reviewerActor = {}, evaluationRecord = {}) {
    const actorProfileId = String(reviewerActor.profile_id || (reviewerActor.profile && reviewerActor.profile.id) || '')
    const personnelProfileId = String(evaluationRecord.personnel_profile_id || '')

    // 1. Self-Review Block
    if (actorProfileId && actorProfileId === personnelProfileId) {
      return false
    }

    const actorRoles = Array.isArray(reviewerActor.roles)
      ? reviewerActor.roles
      : (reviewerActor.role ? [reviewerActor.role] : [])

    // 2. Department Secretary Exclusion
    if (actorRoles.includes('department_secretary') && !actorRoles.includes('dean') && !actorRoles.includes('hr_staff') && !actorRoles.includes('hr_admin')) {
      return false
    }

    const assignedRole = evaluationRecord.assigned_reviewer_role || evaluationRecord.evaluator_role || null
    const targetCollegeId = evaluationRecord.evaluator_college_id || evaluationRecord.target_college_id || null

    // 3. Dean Scope Enforcement
    if (assignedRole === REVIEWER_ROLES.DEAN) {
      if (!actorRoles.includes('dean')) {
        return false
      }
      const actorCollegeId = reviewerActor.assigned_college_id || (reviewerActor.profile && reviewerActor.profile.college_id)
      if (targetCollegeId && actorCollegeId !== targetCollegeId) {
        return false // Cross-college access blocked
      }
      return true
    }

    // 4. HR Scope Enforcement
    if (assignedRole === REVIEWER_ROLES.HR) {
      return actorRoles.includes('hr_staff') || actorRoles.includes('hr_admin')
    }

    return false
  }

  /**
   * Filters a list of evaluation records to generate a reviewer-specific queue.
   */
  static filterReviewerQueue(evaluationsList = [], reviewerActor = {}, filters = {}) {
    const actorRoles = Array.isArray(reviewerActor.roles)
      ? reviewerActor.roles
      : (reviewerActor.role ? [reviewerActor.role] : [])
    const isDean = actorRoles.includes('dean')
    const isHr = actorRoles.includes('hr_staff') || actorRoles.includes('hr_admin')

    if (!isDean && !isHr) {
      return [] // Unauthorized roles get an empty queue
    }

    return evaluationsList.filter((evalRecord) => {
      // Check baseline access authorization
      if (!this.canReviewerAccessEvaluation(reviewerActor, evalRecord)) {
        return false
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        const evalStatus = evalRecord.evaluation_status || evalRecord.status || ''
        if (evalStatus !== filters.status) {
          return false
        }
      }

      // Search filter
      if (filters.search) {
        const search = String(filters.search).toLowerCase().trim()
        const name = String(evalRecord.personnel_name || evalRecord.faculty_name || '').toLowerCase()
        const empId = String(evalRecord.employee_id || evalRecord.personnel_id || '').toLowerCase()
        if (!name.includes(search) && !empId.includes(search)) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Validates client tampering attempts on reviewer fields.
   */
  static validateClientTampering(clientPayload = {}, canonicalAssignment = {}) {
    if (clientPayload.assigned_reviewer_role !== undefined && clientPayload.assigned_reviewer_role !== canonicalAssignment.assigned_reviewer_role) {
      throw new Error(`Tampering detected: Client-supplied reviewer role [${clientPayload.assigned_reviewer_role}] does not match authoritative assignment [${canonicalAssignment.assigned_reviewer_role}].`)
    }
    if (clientPayload.evaluator_profile_id !== undefined && clientPayload.evaluator_profile_id !== canonicalAssignment.evaluator_profile_id) {
      throw new Error(`Tampering detected: Client-supplied evaluator ID [${clientPayload.evaluator_profile_id}] does not match authoritative evaluator [${canonicalAssignment.evaluator_profile_id}].`)
    }
    if (clientPayload.evaluator_college_id !== undefined && clientPayload.evaluator_college_id !== canonicalAssignment.evaluator_college_id) {
      throw new Error(`Tampering detected: Client-supplied evaluator college [${clientPayload.evaluator_college_id}] does not match authoritative college scope [${canonicalAssignment.evaluator_college_id}].`)
    }
  }
}
