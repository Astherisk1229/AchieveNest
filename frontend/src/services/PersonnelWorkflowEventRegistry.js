/**
 * PersonnelWorkflowEventRegistry.js
 *
 * Frontend Authoritative Status & Event Registry for Plan J — Phase J1.
 * Centralizes lifecycle statuses, display labels, evaluation results, promotion decisions,
 * canonical event keys, and validation helpers.
 */

// 1. Canonical Lifecycle Statuses (5 Only)
export const CANONICAL_STATUSES = Object.freeze({
  SUBMITTED: 'submitted',
  IN_EVALUATION: 'in_evaluation',
  RETURNED_FOR_REVISION: 'returned_for_revision',
  READY_FOR_FINALIZATION: 'ready_for_finalization',
  COMPLETED: 'completed'
});

// 2. User-Facing Display Labels
export const STATUS_DISPLAY_LABELS = Object.freeze({
  [CANONICAL_STATUSES.SUBMITTED]: 'Submitted for Review',
  [CANONICAL_STATUSES.IN_EVALUATION]: 'Under Review',
  [CANONICAL_STATUSES.RETURNED_FOR_REVISION]: 'Returned for Revision',
  [CANONICAL_STATUSES.READY_FOR_FINALIZATION]: 'Ready for Finalization',
  [CANONICAL_STATUSES.COMPLETED]: 'Completed / Finalized'
});

// 3. Canonical Evaluation Results (Plan F / Plan J)
export const CANONICAL_EVALUATION_RESULTS = Object.freeze({
  PASSED: 'Passed',
  RETAINED: 'Retained'
});

// 4. Canonical Promotion Decisions (Plan H / Plan J)
export const CANONICAL_PROMOTION_DECISIONS = Object.freeze({
  APPROVED: 'Approved',
  NOT_APPROVED: 'Not Approved'
});

// 5. Canonical Material Workflow Events
export const CANONICAL_EVENT_KEYS = Object.freeze({
  ACHIEVEMENT_UPLOAD_SAVED: 'achievement_upload_saved',
  PORTFOLIO_SUBMITTED: 'portfolio_submitted',
  REVIEW_STARTED: 'review_started',
  QUALIFICATION_STATE_CHANGED: 'qualification_state_changed',
  REVISION_REQUESTED: 'revision_requested',
  PORTFOLIO_RESUBMITTED: 'portfolio_resubmitted',
  EVALUATION_RESULT_RECORDED: 'evaluation_result_recorded',
  EVALUATION_READY_FOR_FINALIZATION: 'evaluation_ready_for_finalization',
  EVALUATION_FINALIZED: 'evaluation_finalized',
  SUMMARY_AVAILABLE: 'summary_available',
  REVIEWER_ASSIGNED: 'reviewer_assigned',
  EVALUATION_SCALE_OVERRIDDEN: 'evaluation_scale_overridden',
  PROMOTION_DECISION_RECORDED: 'promotion_decision_recorded',
  APPROVED_RANK_APPLIED: 'approved_rank_applied',
  PORTFOLIO_PURGED: 'portfolio_purged'
});

// 6. Required Metadata Schema per Event
export const REQUIRED_EVENT_METADATA = Object.freeze({
  [CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED]: ['version_number', 'total_items'],
  [CANONICAL_EVENT_KEYS.PORTFOLIO_RESUBMITTED]: ['version_number', 'prior_version_number'],
  [CANONICAL_EVENT_KEYS.REVISION_REQUESTED]: ['reason', 'required_corrections'],
  [CANONICAL_EVENT_KEYS.EVALUATION_SCALE_OVERRIDDEN]: ['original_scale', 'overridden_scale', 'reason'],
  [CANONICAL_EVENT_KEYS.EVALUATION_RESULT_RECORDED]: ['evaluation_result', 'total_score', 'scale_code'],
  [CANONICAL_EVENT_KEYS.PROMOTION_DECISION_RECORDED]: ['promotion_decision', 'current_rank'],
  [CANONICAL_EVENT_KEYS.APPROVED_RANK_APPLIED]: ['previous_rank', 'new_rank'],
  [CANONICAL_EVENT_KEYS.REVIEWER_ASSIGNED]: ['reviewer_id', 'reviewer_role'],
  [CANONICAL_EVENT_KEYS.PORTFOLIO_PURGED]: ['target_profile_id', 'purged_by_role']
});

export const EVENT_DISPLAY_LABELS = Object.freeze({
  [CANONICAL_EVENT_KEYS.ACHIEVEMENT_UPLOAD_SAVED]: 'Achievement Upload Saved',
  [CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED]: 'Portfolio Submitted',
  [CANONICAL_EVENT_KEYS.REVIEW_STARTED]: 'Review Started',
  [CANONICAL_EVENT_KEYS.QUALIFICATION_STATE_CHANGED]: 'Qualification State Changed',
  [CANONICAL_EVENT_KEYS.REVISION_REQUESTED]: 'Revision Requested',
  [CANONICAL_EVENT_KEYS.PORTFOLIO_RESUBMITTED]: 'Portfolio Resubmitted',
  [CANONICAL_EVENT_KEYS.EVALUATION_RESULT_RECORDED]: 'Evaluation Result Recorded',
  [CANONICAL_EVENT_KEYS.EVALUATION_READY_FOR_FINALIZATION]: 'Ready for Finalization',
  [CANONICAL_EVENT_KEYS.EVALUATION_FINALIZED]: 'Evaluation Finalized',
  [CANONICAL_EVENT_KEYS.SUMMARY_AVAILABLE]: 'Summary Available',
  [CANONICAL_EVENT_KEYS.REVIEWER_ASSIGNED]: 'Reviewer Assigned',
  [CANONICAL_EVENT_KEYS.EVALUATION_SCALE_OVERRIDDEN]: 'Evaluation Scale Overridden',
  [CANONICAL_EVENT_KEYS.PROMOTION_DECISION_RECORDED]: 'Promotion Decision Recorded',
  [CANONICAL_EVENT_KEYS.APPROVED_RANK_APPLIED]: 'Approved Rank Applied',
  [CANONICAL_EVENT_KEYS.PORTFOLIO_PURGED]: 'Portfolio Purged'
});

export default class PersonnelWorkflowEventRegistry {
  static isValidStatus(status) {
    return Object.values(CANONICAL_STATUSES).includes(status);
  }

  static getStatusDisplayLabel(statusOrEvent) {
    if (STATUS_DISPLAY_LABELS[statusOrEvent]) {
      return STATUS_DISPLAY_LABELS[statusOrEvent];
    }
    if (EVENT_DISPLAY_LABELS[statusOrEvent]) {
      return EVENT_DISPLAY_LABELS[statusOrEvent];
    }
    if (typeof statusOrEvent === 'string') {
      const clean = statusOrEvent.replace(/_/g, ' ');
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return String(statusOrEvent || 'Unknown');
  }

  static isValidEventKey(eventKey) {
    return Object.values(CANONICAL_EVENT_KEYS).includes(eventKey);
  }

  static isValidEvent(eventKey) {
    return this.isValidEventKey(eventKey);
  }

  /**
   * Validates that payload metadata contains all required keys for the event.
   */
  static validateRequiredMetadata(eventKey, metadata = {}) {
    if (!this.isValidEventKey(eventKey)) {
      throw new Error(`Unrecognized canonical event key: [${eventKey}]`);
    }

    const requiredKeys = REQUIRED_EVENT_METADATA[eventKey] || [];
    for (const key of requiredKeys) {
      if (metadata[key] === undefined || metadata[key] === null || metadata[key] === '') {
        throw new Error(`Missing required metadata field [${key}] for event [${eventKey}]`);
      }
    }
    return true;
  }

  /**
   * Composes a deterministic idempotency key for an event.
   */
  static generateIdempotencyKey(eventKey, evaluationId = null, versionNumber = null, nonce = null) {
    const parts = [eventKey];
    if (evaluationId) parts.push(evaluationId);
    if (versionNumber !== null && versionNumber !== undefined) parts.push(`v${versionNumber}`);
    if (nonce) parts.push(nonce);
    return parts.join(':');
  }
}
