/**
 * PersonnelEvidenceAccessService.js
 *
 * Frontend Authoritative Evidence Preview & Download Access Service for Plan I — Phase I3.
 * Manages URL generation, scope-aware authorization checks, and secure error handling.
 * Enforces canonical evidence_id lookups, closing RISK-I0-01.
 */

export const ACCESS_REASON_CODES = Object.freeze({
  OWNER_ALLOWED: 'owner_access_allowed',
  DEAN_ALLOWED: 'dean_scope_allowed',
  HR_ALLOWED: 'hr_scope_allowed',
  NOT_FOUND: 'evidence_not_found',
  FORBIDDEN: 'evidence_access_forbidden',
  CROSS_COLLEGE_DENIED: 'cross_college_access_denied',
  SELF_REVIEW_DENIED: 'self_review_access_denied',
  ASSIGNMENT_MISSING: 'review_assignment_missing',
  DELETED: 'evidence_deleted',
  OBJECT_MISSING: 'storage_object_missing'
})

export const ACCESS_TYPES = Object.freeze({
  PREVIEW: 'preview',
  DOWNLOAD: 'download',
  METADATA: 'metadata'
})

export default class PersonnelEvidenceAccessService {
  static BASE_ROUTE = '/api/v1/evidence/personnel'

  /**
   * Builds canonical preview URL for an evidence ID.
   */
  static buildPreviewUrl(evidenceId) {
    if (!evidenceId || typeof evidenceId !== 'string') {
      throw new Error('Invalid Evidence ID: preview URL requires canonical UUID.')
    }
    return `${this.BASE_ROUTE}/${encodeURIComponent(evidenceId)}/preview`
  }

  /**
   * Builds canonical download URL for an evidence ID.
   */
  static buildDownloadUrl(evidenceId) {
    if (!evidenceId || typeof evidenceId !== 'string') {
      throw new Error('Invalid Evidence ID: download URL requires canonical UUID.')
    }
    return `${this.BASE_ROUTE}/${encodeURIComponent(evidenceId)}/download`
  }

  /**
   * Builds metadata retrieval URL for an evidence ID.
   */
  static buildMetadataUrl(evidenceId) {
    if (!evidenceId || typeof evidenceId !== 'string') {
      throw new Error('Invalid Evidence ID: metadata URL requires canonical UUID.')
    }
    return `${this.BASE_ROUTE}/${encodeURIComponent(evidenceId)}`
  }

  /**
   * Authorizes an actor to access evidence client-side prior to API dispatch.
   *
   * @param {Object} actor Authenticated user actor (id, profile_id, roles, assigned_college_id)
   * @param {Object} evidence Evidence metadata record (evidence_id, personnel_id, status, etc.)
   * @param {Object} evaluationContext Context of the evaluation being reviewed
   * @param {string} accessType 'preview' | 'download' | 'metadata'
   * @returns {Object} Structured decision { allowed: boolean, reason_code: string, message: string }
   */
  static authorizeAccess(actor = {}, evidence = null, evaluationContext = {}, accessType = ACCESS_TYPES.PREVIEW) {
    const actorId = String(actor.profile_id || actor.id || '')
    const actorRoles = Array.isArray(actor.roles) ? actor.roles : (actor.role ? [actor.role] : [])

    if (!evidence) {
      return {
        evidence_id: null,
        actor_id: actorId,
        access_type: accessType,
        allowed: false,
        reason_code: ACCESS_REASON_CODES.NOT_FOUND,
        message: 'Evidence record not found.'
      }
    }

    const evidenceId = evidence.evidence_id || evidence.id || null
    const lifecycleStatus = String(evidence.lifecycle_status || evidence.status || 'active').toLowerCase()

    if (['deleted', 'purged', 'archived_deleted'].includes(lifecycleStatus)) {
      return {
        evidence_id: evidenceId,
        actor_id: actorId,
        access_type: accessType,
        allowed: false,
        reason_code: ACCESS_REASON_CODES.DELETED,
        message: 'Evidence has been deleted and is inaccessible.'
      }
    }

    const evidenceOwnerId = String(evidence.personnel_id || evidence.personnel_profile_id || evidence.uploader_id || '')

    // 1. Evaluator Access: Self-Review Block (if accessing via reviewer path and candidate is the reviewer)
    const isEvaluatorReviewPath = Boolean(evaluationContext.assigned_reviewer_role || evaluationContext.evaluation_id)
    if (isEvaluatorReviewPath && actorId && actorId === evidenceOwnerId) {
      return {
        evidence_id: evidenceId,
        actor_id: actorId,
        access_type: accessType,
        allowed: false,
        reason_code: ACCESS_REASON_CODES.SELF_REVIEW_DENIED,
        message: 'Candidate cannot access evidence using reviewer privileges (Self-review prohibited).'
      }
    }

    // 2. Direct Owner Access (when not in evaluator self-review path)
    if (actorId && actorId === evidenceOwnerId) {
      return {
        evidence_id: evidenceId,
        actor_id: actorId,
        access_type: accessType,
        allowed: true,
        reason_code: ACCESS_REASON_CODES.OWNER_ALLOWED,
        message: 'Access authorized as evidence owner.'
      }
    }

    // 3. Department Secretary Exclusion
    if (actorRoles.includes('department_secretary') && !actorRoles.includes('dean') && !actorRoles.includes('hr_staff') && !actorRoles.includes('hr_admin')) {
      return {
        evidence_id: evidenceId,
        actor_id: actorId,
        access_type: accessType,
        allowed: false,
        reason_code: ACCESS_REASON_CODES.FORBIDDEN,
        message: 'Department Secretary role does not possess evaluator evidence access authority.'
      }
    }

    // 4. College Dean Access
    if (actorRoles.includes('dean')) {
      const actorCollegeId = String(actor.assigned_college_id || (actor.profile && actor.profile.college_id) || '')
      const targetCollegeId = String(evaluationContext.evaluator_college_id || evaluationContext.target_college_id || evidence.college_id || '')
      const assignedRole = String(evaluationContext.assigned_reviewer_role || evaluationContext.evaluator_role || 'dean')

      if (assignedRole === 'hr' || assignedRole === 'hr_staff' || assignedRole === 'hr_admin') {
        return {
          evidence_id: evidenceId,
          actor_id: actorId,
          access_type: accessType,
          allowed: false,
          reason_code: ACCESS_REASON_CODES.ASSIGNMENT_MISSING,
          message: 'Evaluation is assigned to HR Office, not College Dean.'
        }
      }

      if (targetCollegeId && (!actorCollegeId || actorCollegeId !== targetCollegeId)) {
        return {
          evidence_id: evidenceId,
          actor_id: actorId,
          access_type: accessType,
          allowed: false,
          reason_code: ACCESS_REASON_CODES.CROSS_COLLEGE_DENIED,
          message: 'Cross-college evidence access is strictly prohibited.'
        }
      }

      return {
        evidence_id: evidenceId,
        actor_id: actorId,
        access_type: accessType,
        allowed: true,
        reason_code: ACCESS_REASON_CODES.DEAN_ALLOWED,
        message: 'Access authorized under College Dean review scope.'
      }
    }

    // 5. HR Oversight Access
    if (actorRoles.includes('hr_staff') || actorRoles.includes('hr_admin')) {
      return {
        evidence_id: evidenceId,
        actor_id: actorId,
        access_type: accessType,
        allowed: true,
        reason_code: ACCESS_REASON_CODES.HR_ALLOWED,
        message: 'Access authorized under HR institutional oversight scope.'
      }
    }

    // Default Deny
    return {
      evidence_id: evidenceId,
      actor_id: actorId,
      access_type: accessType,
      allowed: false,
      reason_code: ACCESS_REASON_CODES.FORBIDDEN,
      message: 'Access denied: Actor is not authorized to access this evidence.'
    }
  }

  /**
   * Sanitizes header filename for attachment downloads.
   */
  static sanitizeHeaderFilename(filename = 'evidence.pdf') {
    const base = filename.replace(/^.*[\\/]/, '')
    const safe = base.replace(/[\r\n"';\0]/g, '').replace(/[^\x20-\x7E]/g, '')
    return safe.trim() || 'evidence_download.pdf'
  }
}
