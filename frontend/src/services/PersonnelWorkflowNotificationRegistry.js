/**
 * PersonnelWorkflowNotificationRegistry.js
 *
 * Frontend Authoritative Notification Registry for Plan J — Phase J3.
 * Defines notification types, event-to-notification mappings, template content builders,
 * and deep links for client-side synchronization and presentation.
 */

import { CANONICAL_EVENT_KEYS } from './PersonnelWorkflowEventRegistry.js';

export const NOTIFICATION_TYPES = Object.freeze({
  REVIEWER_WORK_ARRIVED: 'personnel_reviewer_work_arrived',
  REVIEWER_ASSIGNED: 'personnel_reviewer_assigned',
  REVIEW_STARTED: 'personnel_review_started',
  REVISION_REQUESTED: 'personnel_revision_requested',
  PORTFOLIO_RESUBMITTED: 'personnel_portfolio_resubmitted',
  EVALUATION_FINALIZED: 'personnel_evaluation_finalized',
  SUMMARY_AVAILABLE: 'personnel_summary_available'
});

export const RECIPIENT_CATEGORIES = Object.freeze({
  PERSONNEL: 'personnel',
  ASSIGNED_REVIEWER: 'assigned_reviewer',
  HR_OFFICE: 'hr_office'
});

export const EVENT_NOTIFICATION_MAP = Object.freeze({
  [CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED]: {
    notification_type: NOTIFICATION_TYPES.REVIEWER_WORK_ARRIVED,
    recipient_target: RECIPIENT_CATEGORIES.ASSIGNED_REVIEWER,
    title_template: 'New Portfolio Submission Awaiting Review',
    deep_link_route: '/personnel/evaluations/workspace'
  },
  [CANONICAL_EVENT_KEYS.REVIEWER_ASSIGNED]: {
    notification_type: NOTIFICATION_TYPES.REVIEWER_ASSIGNED,
    recipient_target: RECIPIENT_CATEGORIES.ASSIGNED_REVIEWER,
    title_template: 'Evaluation Portfolio Assigned to You',
    deep_link_route: '/personnel/evaluations/workspace'
  },
  [CANONICAL_EVENT_KEYS.REVIEW_STARTED]: {
    notification_type: NOTIFICATION_TYPES.REVIEW_STARTED,
    recipient_target: RECIPIENT_CATEGORIES.PERSONNEL,
    title_template: 'Portfolio Accepted into Review',
    deep_link_route: '/personnel/portfolio'
  },
  [CANONICAL_EVENT_KEYS.REVISION_REQUESTED]: {
    notification_type: NOTIFICATION_TYPES.REVISION_REQUESTED,
    recipient_target: RECIPIENT_CATEGORIES.PERSONNEL,
    title_template: 'Portfolio Returned for Revision',
    deep_link_route: '/personnel/portfolio/revision'
  },
  [CANONICAL_EVENT_KEYS.PORTFOLIO_RESUBMITTED]: {
    notification_type: NOTIFICATION_TYPES.PORTFOLIO_RESUBMITTED,
    recipient_target: RECIPIENT_CATEGORIES.ASSIGNED_REVIEWER,
    title_template: 'Revised Portfolio Resubmitted',
    deep_link_route: '/personnel/evaluations/workspace'
  },
  [CANONICAL_EVENT_KEYS.EVALUATION_FINALIZED]: {
    notification_type: NOTIFICATION_TYPES.EVALUATION_FINALIZED,
    recipient_target: RECIPIENT_CATEGORIES.PERSONNEL,
    title_template: 'Personnel Evaluation Finalized',
    deep_link_route: '/personnel/portfolio/summary'
  },
  [CANONICAL_EVENT_KEYS.SUMMARY_AVAILABLE]: {
    notification_type: NOTIFICATION_TYPES.SUMMARY_AVAILABLE,
    recipient_target: RECIPIENT_CATEGORIES.PERSONNEL,
    title_template: 'Evaluation Summary Report Available',
    deep_link_route: '/personnel/portfolio/summary'
  }
});

export default class PersonnelWorkflowNotificationRegistry {
  static NOTIFICATION_TYPES = NOTIFICATION_TYPES;
  static RECIPIENT_CATEGORIES = RECIPIENT_CATEGORIES;
  static EVENT_NOTIFICATION_MAP = EVENT_NOTIFICATION_MAP;

  /**
   * Validates if a workflow event triggers a notification.
   */
  static hasNotification(eventKey) {
    return Boolean(EVENT_NOTIFICATION_MAP[eventKey]);
  }

  /**
   * Retrieves notification mapping config for an event key.
   */
  static getEventConfig(eventKey) {
    return EVENT_NOTIFICATION_MAP[eventKey] || null;
  }

  /**
   * Formats notification title and message from persisted event data.
   */
  static buildNotificationContent(eventKey, eventPayload = {}, context = {}) {
    const config = this.getEventConfig(eventKey);
    if (!config) {
      throw new Error(`No notification configuration defined for event: [${eventKey}]`);
    }

    const version = eventPayload.version_number || context.version_number || 1;
    const personnelName = context.personnel_name || 'Candidate';

    let message = '';
    switch (eventKey) {
      case CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED:
        message = `A new portfolio (Version ${version}) from ${personnelName} has been submitted and is awaiting your review.`;
        break;
      case CANONICAL_EVENT_KEYS.REVIEWER_ASSIGNED:
        message = `You have been assigned to evaluate the portfolio submission for ${personnelName}.`;
        break;
      case CANONICAL_EVENT_KEYS.REVIEW_STARTED:
        message = `Your submitted portfolio (Version ${version}) has been accepted into active review by the assigned evaluator.`;
        break;
      case CANONICAL_EVENT_KEYS.REVISION_REQUESTED: {
        const reason = eventPayload.reason || eventPayload.deficiency_reason || 'Incomplete documentation';
        const hasEvidence = Boolean(eventPayload.required_corrections || eventPayload.requested_evidence);
        const evidenceNote = hasEvidence ? ' Please review requested evidence and specific comments.' : '';
        message = `Your portfolio (Version ${version}) was returned for revision: "${reason}".${evidenceNote}`;
        break;
      }
      case CANONICAL_EVENT_KEYS.PORTFOLIO_RESUBMITTED:
        message = `A revised portfolio (Version ${version}) has been resubmitted by ${personnelName} for your review.`;
        break;
      case CANONICAL_EVENT_KEYS.EVALUATION_FINALIZED:
        message = 'Your personnel ranking evaluation for the academic year has been officially finalized.';
        break;
      case CANONICAL_EVENT_KEYS.SUMMARY_AVAILABLE:
        message = 'Your official personnel evaluation summary report is now available for download and review.';
        break;
      default:
        message = 'A workflow update occurred for your evaluation portfolio.';
        break;
    }

    return {
      notification_type: config.notification_type,
      title: config.title_template,
      message,
      deep_link: config.deep_link_route
    };
  }

  /**
   * Generates a deterministic idempotency key for notification deduplication.
   */
  static generateNotificationIdempotencyKey(eventId, recipientProfileId, notificationType) {
    return `notif:${eventId}:${recipientProfileId}:${notificationType}`;
  }
}
