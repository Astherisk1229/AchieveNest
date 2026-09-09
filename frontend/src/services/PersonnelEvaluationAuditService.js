/**
 * PersonnelEvaluationAuditService.js
 *
 * Canonical Frontend Audit Trail & Lifecycle Reconstruction Service for Plan J — Phase J5.
 * Provides timeline reconstruction, role-based audit access validation, display label formatting,
 * before/after state diff summaries, and immutability assertions.
 */

import { PersonnelWorkflowEventRegistry } from './PersonnelWorkflowEventRegistry';

export const AUDIT_EVENTS = Object.freeze({
  ACHIEVEMENT_UPLOADED: 'achievement_uploaded',
  PORTFOLIO_SUBMITTED: 'portfolio_submitted',
  REVIEWER_ASSIGNED: 'reviewer_assigned',
  REVIEW_STARTED: 'review_started',
  QUALIFICATION_STATE_CHANGED: 'qualification_state_changed',
  SCORE_DECISION_RECORDED: 'score_decision_recorded',
  REVISION_REQUESTED: 'revision_requested',
  PORTFOLIO_RESUBMITTED: 'portfolio_resubmitted',
  EVALUATION_SCALE_OVERRIDDEN: 'evaluation_scale_overridden',
  EVALUATION_RESULT_RECORDED: 'evaluation_result_recorded',
  EVALUATION_READY_FOR_FINALIZATION: 'evaluation_ready_for_finalization',
  EVALUATION_PRINT_GENERATED: 'evaluation_print_generated',
  PROMOTION_DECISION_RECORDED: 'promotion_decision_recorded',
  APPROVED_RANK_APPLIED: 'approved_rank_applied',
  EVALUATION_FINALIZED: 'evaluation_finalized',
  EVALUATION_LOCKED: 'evaluation_locked',
  SUMMARY_GENERATED: 'summary_generated',
  OWNER_DELETION_REQUESTED: 'owner_deletion_requested',
  OWNER_DELETION_EXECUTED: 'owner_deletion_executed',
});

export const AUDIT_DISPLAY_LABELS = Object.freeze({
  [AUDIT_EVENTS.ACHIEVEMENT_UPLOADED]: 'Evidence Upload Saved',
  [AUDIT_EVENTS.PORTFOLIO_SUBMITTED]: 'Portfolio Submitted for Review',
  [AUDIT_EVENTS.REVIEWER_ASSIGNED]: 'Evaluator Assigned',
  [AUDIT_EVENTS.REVIEW_STARTED]: 'Evaluation Scoring Started',
  [AUDIT_EVENTS.QUALIFICATION_STATE_CHANGED]: 'Qualification State Changed',
  [AUDIT_EVENTS.SCORE_DECISION_RECORDED]: 'Score Decision Recorded',
  [AUDIT_EVENTS.REVISION_REQUESTED]: 'Portfolio Returned for Revision',
  [AUDIT_EVENTS.PORTFOLIO_RESUBMITTED]: 'Revised Portfolio Resubmitted',
  [AUDIT_EVENTS.EVALUATION_SCALE_OVERRIDDEN]: 'Evaluation Ranking Scale Overridden',
  [AUDIT_EVENTS.EVALUATION_RESULT_RECORDED]: 'Evaluation Result Recorded',
  [AUDIT_EVENTS.EVALUATION_READY_FOR_FINALIZATION]: 'Evaluation Ready for Finalization',
  [AUDIT_EVENTS.EVALUATION_PRINT_GENERATED]: 'Evaluation Summary Document Printed',
  [AUDIT_EVENTS.PROMOTION_DECISION_RECORDED]: 'Promotion Decision Recorded',
  [AUDIT_EVENTS.APPROVED_RANK_APPLIED]: 'Approved Faculty Rank Applied',
  [AUDIT_EVENTS.EVALUATION_FINALIZED]: 'Personnel Evaluation Finalized',
  [AUDIT_EVENTS.EVALUATION_LOCKED]: 'Evaluation Record Locked',
  [AUDIT_EVENTS.SUMMARY_GENERATED]: 'Official Summary Report Generated',
  [AUDIT_EVENTS.OWNER_DELETION_REQUESTED]: 'Owner-Authorized Data Deletion Requested',
  [AUDIT_EVENTS.OWNER_DELETION_EXECUTED]: 'Owner-Authorized Data Deletion Executed',
});

export class PersonnelEvaluationAuditService {
  /**
   * Validates if an audit event key is canonical.
   */
  static isValidAuditEvent(eventKey) {
    return Object.values(AUDIT_EVENTS).includes(eventKey);
  }

  /**
   * Resolves display label for an audit event key.
   */
  static getAuditDisplayLabel(eventKey) {
    return AUDIT_DISPLAY_LABELS[eventKey] || String(eventKey).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Formats a single audit entry into a standardized UI presentation model.
   */
  static formatAuditEntry(entry = {}) {
    const eventKey = entry.audit_event_key || entry.event_key || '';
    const label = this.getAuditDisplayLabel(eventKey);
    const occurredAt = entry.occurred_at || new Date().toISOString();

    let diffSummary = null;
    if (entry.before_state !== undefined || entry.after_state !== undefined) {
      diffSummary = {
        before: entry.before_state !== null ? String(entry.before_state) : 'none',
        after: entry.after_state !== null ? String(entry.after_state) : 'none',
      };
    }

    return {
      id: entry.id || `audit-${Math.random().toString(36).substring(2, 9)}`,
      eventKey,
      displayLabel: label,
      actorUserId: entry.actor_user_id || 'system',
      actorRole: entry.actor_role || 'System',
      actorContext: entry.actor_context || {},
      subjectPersonnelId: entry.subject_personnel_id || entry.personnel_profile_id || null,
      evaluationId: entry.evaluation_id || null,
      portfolioVersionNumber: Number(entry.portfolio_version_number) || 1,
      beforeState: entry.before_state ?? null,
      afterState: entry.after_state ?? null,
      diffSummary,
      metadata: entry.metadata || {},
      occurredAt,
      formattedDate: new Date(occurredAt).toLocaleString(),
      isImmutable: true,
    };
  }

  /**
   * Reconstructs an ordered, human-readable lifecycle timeline and version lineages.
   */
  static reconstructLifecycleTimeline(rawEntries = [], currentUser = null, subjectContext = null) {
    if (currentUser && subjectContext) {
      this.validateAuditAccess(currentUser, subjectContext);
    }

    // Sort chronologically
    const sorted = [...rawEntries].sort((a, b) => {
      const timeA = new Date(a.occurred_at || 0).getTime();
      const timeB = new Date(b.occurred_at || 0).getTime();
      return timeA - timeB;
    });

    const timeline = [];
    const versionLineages = {};

    for (const raw of sorted) {
      const entry = this.formatAuditEntry(raw);
      timeline.push(entry);

      const ver = entry.portfolioVersionNumber;
      if (!versionLineages[ver]) {
        versionLineages[ver] = [];
      }
      versionLineages[ver].push(entry);
    }

    return {
      totalEvents: timeline.length,
      timeline,
      versionLineages,
      isComplete: timeline.length > 0,
    };
  }

  /**
   * Enforces role-based authorization for audit inspection.
   */
  static validateAuditAccess(currentUser = {}, subjectContext = {}) {
    const role = currentUser.role || '';
    const userId = currentUser.user_id || currentUser.id || '';
    const profileId = currentUser.profile_id || currentUser.personnel_profile_id || userId;

    if (!role || !userId) {
      throw new Error('Unauthenticated access to audit trail is denied.');
    }

    if (role === 'department_secretary') {
      throw new Error('Department Secretary is not authorized to inspect personnel evaluation audit records.');
    }

    if (['hr_admin', 'hr', 'system_admin', 'admin'].includes(role)) {
      return true;
    }

    if (role === 'dean' || role === 'reviewer') {
      const userCollege = currentUser.college_code;
      const subjectCollege = subjectContext.college_code;
      if (userCollege && subjectCollege && userCollege !== subjectCollege) {
        throw new Error('Cross-college audit access denied for Dean.');
      }
      return true;
    }

    if (role === 'personnel' || role === 'faculty') {
      const subjectPersonnelId = subjectContext.subject_personnel_id || subjectContext.personnel_profile_id;
      if (subjectPersonnelId && profileId !== subjectPersonnelId) {
        throw new Error('Personnel are strictly forbidden from inspecting other personnel audit records.');
      }
      return true;
    }

    throw new Error(`Unauthorized role [${role}] denied from accessing audit trail.`);
  }

  /**
   * Asserts append-only immutability against ordinary client update/delete operations.
   */
  static assertImmutability(operation = 'modify') {
    throw new Error(`Immutable audit trail violation: audit records cannot be ${operation}d by ordinary users.`);
  }

  /**
   * Generates a deterministic idempotency key for an audit record.
   */
  static generateIdempotencyKey(eventKey, evaluationId = null, versionNumber = null, nonce = null) {
    const parts = ['audit', eventKey];
    if (evaluationId) parts.push(evaluationId);
    if (versionNumber !== null) parts.push(`v${versionNumber}`);
    if (nonce) parts.push(nonce);
    return parts.join(':');
  }
}
