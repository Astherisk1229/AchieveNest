/**
 * PersonnelRevisionRequestService.js
 *
 * Frontend Authoritative Whole-Portfolio Revision Request Service for Plan J — Phase J2.
 * Manages revision validation, payload formation, subordinate comment handling,
 * Personnel and Reviewer read models, and resolution state tracking.
 */

import PersonnelWorkflowEventRegistry, {
  CANONICAL_STATUSES,
  CANONICAL_EVENT_KEYS
} from './PersonnelWorkflowEventRegistry.js';
import PersonnelReviewerRoutingRegistry from './PersonnelReviewerRoutingRegistry.js';

export const REVISION_RESOLUTION_STATUSES = Object.freeze({
  OPEN: 'open',
  RESOLVED: 'resolved'
});

export const REVISION_REASON_CODES = Object.freeze({
  AUTHORIZED: 'authorized',
  UNAUTHORIZED_REVIEWER: 'revision_request_unauthorized',
  INVALID_STATE: 'revision_request_invalid_state',
  ALREADY_OPEN: 'revision_request_already_open',
  OVERALL_MESSAGE_REQUIRED: 'revision_message_required',
  SUBMITTED_VERSION_MISSING: 'submitted_version_missing',
  SELF_REVIEW_PROHIBITED: 'self_evaluation_prohibited',
  DEPT_SECRETARY_EXCLUDED: 'department_secretary_excluded',
  CROSS_COLLEGE_DENIED: 'cross_college_evaluation_prohibited'
});

export default class PersonnelRevisionRequestService {
  /**
   * Validates whether an actor can request revision for the given evaluation.
   */
  static canRequestRevision(actor = {}, evaluation = {}) {
    const actorProfileId = actor.profile_id || actor.id || '';
    const personnelProfileId = evaluation.personnel_profile_id || '';

    // 1. Prohibit self-review
    if (actorProfileId && actorProfileId === personnelProfileId) {
      return {
        allowed: false,
        reason_code: REVISION_REASON_CODES.SELF_REVIEW_PROHIBITED,
        message: 'Personnel cannot return their own portfolio for revision.'
      };
    }

    const roles = Array.isArray(actor.roles) ? actor.roles : (actor.role ? [actor.role] : []);

    // 2. Department secretary strictly excluded
    if (roles.includes('department_secretary') && !roles.includes('dean') && !roles.includes('hr_staff') && !roles.includes('hr_admin')) {
      return {
        allowed: false,
        reason_code: REVISION_REASON_CODES.DEPT_SECRETARY_EXCLUDED,
        message: 'Department Secretary is strictly excluded from returning portfolios.'
      };
    }

    // 3. Personnel role cannot create reviewer request
    if (roles.includes('personnel') && !roles.includes('dean') && !roles.includes('hr_staff') && !roles.includes('hr_admin')) {
      return {
        allowed: false,
        reason_code: REVISION_REASON_CODES.UNAUTHORIZED_REVIEWER,
        message: 'Personnel role cannot create reviewer revision requests.'
      };
    }

    // 4. Plan G Reviewer Authority check
    if (!PersonnelReviewerRoutingRegistry.isAuthorizedReviewer(actor, evaluation)) {
      const assignedRole = evaluation.assigned_reviewer_role || 'reviewer';
      const targetCollegeId = evaluation.target_college_id || null;
      const actorCollegeId = actor.assigned_college_id || null;

      if (assignedRole === 'dean' && roles.includes('dean') && targetCollegeId && actorCollegeId !== targetCollegeId) {
        return {
          allowed: false,
          reason_code: REVISION_REASON_CODES.CROSS_COLLEGE_DENIED,
          message: 'Cross-college Dean cannot return portfolio outside assigned academic college scope.'
        };
      }

      return {
        allowed: false,
        reason_code: REVISION_REASON_CODES.UNAUTHORIZED_REVIEWER,
        message: 'Actor is not the authorized reviewer or HR administrator.'
      };
    }

    // 5. Valid state transition: only 'submitted' or 'in_evaluation' can be returned
    const status = String(evaluation.status || '').toLowerCase();
    if (![CANONICAL_STATUSES.SUBMITTED, CANONICAL_STATUSES.IN_EVALUATION].includes(status)) {
      return {
        allowed: false,
        reason_code: REVISION_REASON_CODES.INVALID_STATE,
        message: `Cannot return evaluation in '${status}' status. Only submitted or in_evaluation portfolios can be returned.`
      };
    }

    return {
      allowed: true,
      reason_code: REVISION_REASON_CODES.AUTHORIZED,
      message: 'Actor is authorized to request revision.'
    };
  }

  /**
   * Validates the whole-portfolio revision request payload.
   */
  static validateRevisionPayload(payload = {}) {
    const overallMessage = String(payload.overall_message || payload.reason || '').trim();
    if (!overallMessage) {
      throw new Error('An overall revision message is required.');
    }
    if (overallMessage.length > 2000) {
      throw new Error('Overall revision message cannot exceed 2000 characters.');
    }

    const itemComments = Array.isArray(payload.item_comments) ? payload.item_comments : (Array.isArray(payload.item_deficiencies) ? payload.item_deficiencies : []);
    const seenItemIds = new Set();

    for (const item of itemComments) {
      const itemId = String(item.portfolio_item_id || item.evaluation_item_id || item.item_id || '').trim();
      const commentText = String(item.comment_text || item.comment || item.remarks || '').trim();

      if (itemId && seenItemIds.has(itemId)) {
        throw new Error(`Duplicate comment provided for item: ${itemId}`);
      }
      if (itemId) {
        seenItemIds.add(itemId);
      }
      if (!commentText) {
        throw new Error(`Comment text is required for item: ${itemId}`);
      }
    }

    return true;
  }

  /**
   * Builds the client-side DTO for submitting a whole-portfolio revision request.
   */
  static buildRevisionRequestPayload(evaluation = {}, reviewer = {}, params = {}) {
    this.validateRevisionPayload(params);

    const overallMessage = String(params.overall_message || params.reason || '').trim();
    const deficiencyReason = String(params.deficiency_reason || params.reason || overallMessage).trim();
    const requestedEvidence = String(params.requested_evidence || params.required_corrections || overallMessage).trim();
    const itemComments = Array.isArray(params.item_comments) ? params.item_comments : (Array.isArray(params.item_deficiencies) ? params.item_deficiencies : []);
    const criterionComments = Array.isArray(params.criterion_comments) ? params.criterion_comments : [];

    return {
      evaluation_id: evaluation.id || null,
      portfolio_version_id: evaluation.id || null,
      version_number: evaluation.version_number || 1,
      overall_message: overallMessage,
      deficiency_reason: deficiencyReason,
      requested_evidence: requestedEvidence,
      item_comments: itemComments.map(c => ({
        portfolio_item_id: c.portfolio_item_id || c.evaluation_item_id || c.item_id || null,
        criterion_code: c.criterion_code || null,
        criterion_title: c.criterion_title || null,
        comment_text: c.comment_text || c.comment || c.remarks || '',
        requested_evidence: c.requested_evidence || null
      })),
      criterion_comments: criterionComments.map(c => ({
        criterion_code: c.criterion_code || '',
        criterion_title: c.criterion_title || null,
        comment_text: c.comment_text || c.comment || '',
        requested_evidence: c.requested_evidence || null
      })),
      idempotency_nonce: params.idempotency_nonce || null
    };
  }

  /**
   * Formats the Personnel read model for revision feedback.
   */
  static formatPersonnelRevisionView(evaluation = {}, revisionRequest = null) {
    const status = String(evaluation.status || '').toLowerCase();
    const isReturned = status === CANONICAL_STATUSES.RETURNED_FOR_REVISION;

    return {
      evaluation_id: evaluation.id || null,
      version_number: evaluation.version_number || 1,
      status,
      display_status: PersonnelWorkflowEventRegistry.getStatusDisplayLabel(status),
      has_active_revision: isReturned && (!revisionRequest || revisionRequest.status === REVISION_RESOLUTION_STATUSES.OPEN),
      overall_feedback: revisionRequest ? {
        request_id: revisionRequest.id || null,
        overall_message: revisionRequest.overall_message || evaluation.return_reason || '',
        deficiency_reason: revisionRequest.deficiency_reason || evaluation.return_reason || '',
        requested_evidence: revisionRequest.requested_evidence || '',
        reviewer_name: revisionRequest.reviewer_name || 'Authorized Reviewer',
        reviewer_role: revisionRequest.reviewer_role || 'reviewer',
        requested_at: revisionRequest.requested_at || evaluation.returned_at || null,
        resolution_status: revisionRequest.status || REVISION_RESOLUTION_STATUSES.OPEN,
        resolved_at: revisionRequest.resolved_at || null,
        resolved_by_version_id: revisionRequest.resolved_by_version_id || null
      } : null,
      subordinate_comments: revisionRequest?.comments || []
    };
  }

  /**
   * Formats the Reviewer read model for revision request management.
   */
  static formatReviewerRevisionView(evaluation = {}, revisionRequest = null) {
    const base = this.formatPersonnelRevisionView(evaluation, revisionRequest);
    return {
      ...base,
      personnel_profile_id: evaluation.personnel_profile_id || null,
      academic_year: evaluation.academic_year || '2025-2026',
      evaluator_profile_id: evaluation.evaluator_profile_id || null,
      is_locked_for_review: base.has_active_revision
    };
  }

  /**
   * Resolves a revision request when a new portfolio version is submitted.
   */
  static resolveRevisionOnResubmission(revisionRequest = {}, newVersion = {}) {
    if (!revisionRequest || revisionRequest.status !== REVISION_RESOLUTION_STATUSES.OPEN) {
      return revisionRequest;
    }

    return {
      ...revisionRequest,
      status: REVISION_RESOLUTION_STATUSES.RESOLVED,
      resolved_at: new Date().toISOString(),
      resolved_by_version_id: newVersion.id || null,
      resolved_by_version_number: newVersion.version_number || null
    };
  }
}
