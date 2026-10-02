/**
 * PersonnelReviewerRoutingRegistry.js
 *
 * Canonical Authoritative Frontend Mirror & Reviewer Routing Registry for Personnel Evaluation Track
 * (Plan G Phases G0–G1, Plan K5 Final Closure, and CHU-01 Phase 2 Reconciliation).
 * Freezes authoritative reviewer routing rules, evaluator authority, scope boundaries,
 * and unresolved routing protection.
 *
 * Authoritative Provenance:
 * 1. Faculty -> Dean [Plan G (G0/G1) & Plan K5 Final Routing Matrix; COLLEGE_ACADEMIC_SCOPE].
 * 2. Non-Teaching Faculty -> HR [CHU-01 Phase 2 Sections 2.5, 9.2, 14.1; UNIVERSITY_HR_SCOPE].
 * 3. Organizational side remains placement metadata and does not alter reviewer authority.
 * 4. Dean / VP -> HR [Plan G (G0/G1) & Plan K5 Final Routing Matrix; UNIVERSITY_HR_SCOPE].
 * 5. Department Secretary strictly excluded; Self-evaluation strictly prohibited [Plan G0].
 * 6. Unknown personnel groups strictly return status='unresolved' with zero silent fallback.
 */

export const REVIEWER_ROLES = Object.freeze({
  DEAN: 'dean',
  HR: 'hr_staff'
})

export const REVIEWER_SCOPE_TYPES = Object.freeze({
  COLLEGE_ACADEMIC_SCOPE: 'COLLEGE_ACADEMIC_SCOPE',
  UNIVERSITY_HR_SCOPE: 'UNIVERSITY_HR_SCOPE'
})

export const ROUTING_REASON_CODES = Object.freeze({
  ROUTE_ASSIGNED: 'route_assigned',
  REVIEWER_ROUTE_UNRESOLVED: 'reviewer_route_unresolved',
  UNAUTHORIZED_EVALUATOR: 'unauthorized_evaluator',
  DEPARTMENT_SECRETARY_EXCLUDED: 'department_secretary_excluded',
  SELF_EVALUATION_PROHIBITED: 'self_evaluation_prohibited'
})

export const CANONICAL_ROUTING_TABLE = Object.freeze([
  {
    context_key: 'FACULTY',
    personnel_group: 'faculty',
    designation: null,
    reviewer_role: REVIEWER_ROLES.DEAN,
    scope: REVIEWER_SCOPE_TYPES.COLLEGE_ACADEMIC_SCOPE,
    requires_college_match: true,
    authoritative_source: 'Plan G (G0/G1) & Plan K5 Final Routing Matrix'
  },
  {
    context_key: 'NON_TEACHING_FACULTY',
    personnel_group: 'non_teaching_faculty',
    designation: null,
    reviewer_role: REVIEWER_ROLES.HR,
    scope: REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE,
    requires_college_match: false,
    authoritative_source: 'CHU-01 Phase 2 (Sections 2.5, 9.2, 14.1)'
  },
  {
    context_key: 'DEAN_EVALUATION',
    personnel_group: 'faculty',
    organizational_side: 'academic',
    designation: 'dean',
    reviewer_role: REVIEWER_ROLES.HR,
    scope: REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE,
    requires_college_match: false,
    authoritative_source: 'Plan G (G0/G1) & Plan K5 Final Routing Matrix'
  },
  {
    context_key: 'VP_ACADEMICS_EVALUATION',
    personnel_group: 'faculty',
    organizational_side: 'academic',
    designation: 'vp_academics',
    reviewer_role: REVIEWER_ROLES.HR,
    scope: REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE,
    requires_college_match: false,
    authoritative_source: 'Plan G (G0/G1) & Plan K5 Final Routing Matrix'
  },
  {
    context_key: 'VP_ADMINISTRATION_EVALUATION',
    personnel_group: 'non_teaching_faculty',
    organizational_side: 'non_academic',
    designation: 'vp_administration',
    reviewer_role: REVIEWER_ROLES.HR,
    scope: REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE,
    requires_college_match: false,
    authoritative_source: 'Plan G (G0/G1) & Plan K5 Final Routing Matrix'
  }
])

export default class PersonnelReviewerRoutingRegistry {
  static RULE_VERSION = 'NDMU-REVIEWER-ROUTING-V1'

  /**
   * Resolves reviewer route based strictly on authoritative personnel context.
   */
  static resolveReviewerRoute({
    personnel_group = '',
    is_dean = false,
    is_vp_academics = false,
    is_vp_administration = false,
    college_id = null
  } = {}) {
    const group = String(personnel_group).toLowerCase().trim()

    // 1. High-level administrative positions route to HR
    if (is_dean) {
      return {
        authorized_reviewer_role: REVIEWER_ROLES.HR,
        scope_type: REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE,
        target_college_id: null,
        routing_reason: 'Dean evaluation routes authoritatively to HR.',
        status: 'resolved',
        reason_code: ROUTING_REASON_CODES.ROUTE_ASSIGNED
      }
    }

    if (is_vp_academics) {
      return {
        authorized_reviewer_role: REVIEWER_ROLES.HR,
        scope_type: REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE,
        target_college_id: null,
        routing_reason: 'VP for Academics evaluation routes authoritatively to HR.',
        status: 'resolved',
        reason_code: ROUTING_REASON_CODES.ROUTE_ASSIGNED
      }
    }

    if (is_vp_administration) {
      return {
        authorized_reviewer_role: REVIEWER_ROLES.HR,
        scope_type: REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE,
        target_college_id: null,
        routing_reason: 'VP for Administration evaluation routes authoritatively to HR.',
        status: 'resolved',
        reason_code: ROUTING_REASON_CODES.ROUTE_ASSIGNED
      }
    }

    // 2. Personnel group is the sole classification input.
    if (group === 'faculty') {
      return {
        authorized_reviewer_role: REVIEWER_ROLES.DEAN,
        scope_type: REVIEWER_SCOPE_TYPES.COLLEGE_ACADEMIC_SCOPE,
        target_college_id: college_id,
        routing_reason: 'Faculty personnel route to the active Dean of their assigned college.',
        status: 'resolved',
        reason_code: ROUTING_REASON_CODES.ROUTE_ASSIGNED
      }
    }

    if (group === 'non_teaching_faculty') {
      return {
        authorized_reviewer_role: REVIEWER_ROLES.HR,
        scope_type: REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE,
        target_college_id: null,
        routing_reason: 'Non-Teaching Faculty personnel route to HR Office.',
        status: 'resolved',
        reason_code: ROUTING_REASON_CODES.ROUTE_ASSIGNED
      }
    }

    // 3. Unresolved cases remain strictly unresolved (zero silent fallback)
    return {
      authorized_reviewer_role: null,
      scope_type: null,
      target_college_id: null,
      routing_reason: `No authoritative reviewer route is defined for personnel group [${group}].`,
      status: 'unresolved',
      reason_code: ROUTING_REASON_CODES.REVIEWER_ROUTE_UNRESOLVED,
      inputs: {
        personnel_group: group
      }
    }
  }

  /**
   * Verifies if an actor is authorized to evaluate a specific personnel evaluation.
   */
  static isAuthorizedReviewer(actor = {}, evaluation = {}) {
    const actorProfileId = actor.profile_id || (actor.profile && actor.profile.id) || ''
    const personnelProfileId = evaluation.personnel_profile_id || ''

    // Personnel cannot self-evaluate
    if (actorProfileId && actorProfileId === personnelProfileId) {
      return false
    }

    const actorRoles = Array.isArray(actor.roles) ? actor.roles : (actor.role ? [actor.role] : [])

    // Department Secretary is strictly excluded as evaluator
    if (actorRoles.includes('department_secretary') && !actorRoles.includes('dean') && !actorRoles.includes('hr_staff') && !actorRoles.includes('hr_admin')) {
      return false
    }

    const assignedRole = evaluation.assigned_reviewer_role
    const targetCollegeId = evaluation.target_college_id

    if (assignedRole === REVIEWER_ROLES.DEAN) {
      if (!actorRoles.includes('dean')) {
        return false
      }
      const actorCollegeId = actor.assigned_college_id || (actor.profile && actor.profile.college_id)
      if (targetCollegeId && actorCollegeId !== targetCollegeId) {
        return false // Cross-college evaluation prohibited
      }
      return true
    }

    if (assignedRole === REVIEWER_ROLES.HR) {
      return actorRoles.includes('hr_staff') || actorRoles.includes('hr_admin')
    }

    return false
  }
}
