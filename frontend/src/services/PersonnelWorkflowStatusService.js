/**
 * PersonnelWorkflowStatusService.js
 *
 * Frontend Authoritative Status Visibility & Lifecycle Synchronization Service for Plan J — Phase J4.
 * Coordinates cross-role status read models, badge styling registries, display label separation,
 * and stale-state elimination across Personnel, Dean, and HR views.
 */

import PersonnelWorkflowEventRegistry, {
  CANONICAL_STATUSES,
  STATUS_DISPLAY_LABELS,
  CANONICAL_EVALUATION_RESULTS,
  CANONICAL_PROMOTION_DECISIONS,
  CANONICAL_EVENT_KEYS
} from './PersonnelWorkflowEventRegistry.js';

export const LIFECYCLE_BADGE_VARIANTS = Object.freeze({
  [CANONICAL_STATUSES.SUBMITTED]: {
    label: STATUS_DISPLAY_LABELS[CANONICAL_STATUSES.SUBMITTED],
    variant: 'info',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  },
  [CANONICAL_STATUSES.IN_EVALUATION]: {
    label: STATUS_DISPLAY_LABELS[CANONICAL_STATUSES.IN_EVALUATION],
    variant: 'warning',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  [CANONICAL_STATUSES.RETURNED_FOR_REVISION]: {
    label: STATUS_DISPLAY_LABELS[CANONICAL_STATUSES.RETURNED_FOR_REVISION],
    variant: 'destructive',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800'
  },
  [CANONICAL_STATUSES.READY_FOR_FINALIZATION]: {
    label: STATUS_DISPLAY_LABELS[CANONICAL_STATUSES.READY_FOR_FINALIZATION],
    variant: 'secondary',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
  },
  [CANONICAL_STATUSES.COMPLETED]: {
    label: STATUS_DISPLAY_LABELS[CANONICAL_STATUSES.COMPLETED],
    variant: 'success',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  }
});

export const EVALUATION_RESULT_BADGE_VARIANTS = Object.freeze({
  [CANONICAL_EVALUATION_RESULTS.PASSED]: {
    label: 'Passed',
    variant: 'success',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  [CANONICAL_EVALUATION_RESULTS.RETAINED]: {
    label: 'Retained',
    variant: 'warning',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
  }
});

export const PROMOTION_DECISION_BADGE_VARIANTS = Object.freeze({
  [CANONICAL_PROMOTION_DECISIONS.APPROVED]: {
    label: 'Approved',
    variant: 'success',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  [CANONICAL_PROMOTION_DECISIONS.NOT_APPROVED]: {
    label: 'Not Approved',
    variant: 'neutral',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300'
  }
});

export default class PersonnelWorkflowStatusService {
  /**
   * Resolves canonical lifecycle badge configuration.
   */
  static getLifecycleBadge(status) {
    const clean = String(status || '').toLowerCase();
    if (LIFECYCLE_BADGE_VARIANTS[clean]) {
      return LIFECYCLE_BADGE_VARIANTS[clean];
    }
    return {
      label: PersonnelWorkflowEventRegistry.getStatusDisplayLabel(clean),
      variant: 'default',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-200'
    };
  }

  /**
   * Resolves evaluation result badge configuration (Passed / Retained).
   */
  static getEvaluationResultBadge(result) {
    return EVALUATION_RESULT_BADGE_VARIANTS[result] || null;
  }

  /**
   * Resolves promotion decision badge configuration (Approved / Not Approved).
   */
  static getPromotionDecisionBadge(decision) {
    return PROMOTION_DECISION_BADGE_VARIANTS[decision] || null;
  }

  /**
   * Validates cross-role consistency between different role read models for the same evaluation.
   */
  static validateCrossRoleAgreement(personnelView = {}, reviewerView = {}, hrView = {}) {
    const statusP = personnelView.lifecycle_status;
    const statusR = reviewerView.lifecycle_status;
    const statusH = hrView.lifecycle_status;

    const versionP = personnelView.portfolio_version_number;
    const versionR = reviewerView.portfolio_version_number;
    const versionH = hrView.portfolio_version_number;

    const statusMatch = (statusP === statusR && statusR === statusH);
    const versionMatch = (versionP === versionR && versionR === versionH);

    return {
      is_consistent: statusMatch && versionMatch,
      status_agreed: statusMatch,
      version_agreed: versionMatch,
      lifecycle_status: statusP,
      version_number: versionP
    };
  }

  /**
   * Builds normalized status state for UI rendering from API response.
   */
  static formatStatusViewModel(rawModel = {}) {
    const status = String(rawModel.lifecycle_status || rawModel.status || 'submitted').toLowerCase();
    const version = Number(rawModel.portfolio_version_number || rawModel.version_number || 1);
    const lastEvent = rawModel.last_meaningful_event || null;

    return {
      evaluation_id: rawModel.evaluation_id || null,
      lifecycle_status: status,
      display_label: PersonnelWorkflowEventRegistry.getStatusDisplayLabel(status),
      badge_config: this.getLifecycleBadge(status),
      portfolio_version_number: version,
      version_label: `Version ${version}`,
      last_event: lastEvent ? {
        event_key: lastEvent.event_key || lastEvent.event_type,
        event_label: PersonnelWorkflowEventRegistry.getStatusDisplayLabel(lastEvent.event_key || lastEvent.event_type),
        occurred_at: lastEvent.occurred_at || lastEvent.created_at || null
      } : null,
      evaluation_result: rawModel.evaluation_result || null,
      result_badge: this.getEvaluationResultBadge(rawModel.evaluation_result),
      promotion_decision: rawModel.promotion_decision || null,
      promotion_badge: this.getPromotionDecisionBadge(rawModel.promotion_decision),
      is_locked: Boolean(rawModel.is_locked),
      has_open_revision: Boolean(rawModel.has_open_revision || status === CANONICAL_STATUSES.RETURNED_FOR_REVISION)
    };
  }
}
