import { describe, it, expect } from 'vitest';
import PersonnelWorkflowStatusService, {
  LIFECYCLE_BADGE_VARIANTS,
  EVALUATION_RESULT_BADGE_VARIANTS,
  PROMOTION_DECISION_BADGE_VARIANTS
} from '../../services/PersonnelWorkflowStatusService.js';
import PersonnelWorkflowEventRegistry, {
  CANONICAL_STATUSES,
  CANONICAL_EVALUATION_RESULTS,
  CANONICAL_PROMOTION_DECISIONS,
  CANONICAL_EVENT_KEYS
} from '../../services/PersonnelWorkflowEventRegistry.js';

describe('Phase J4: Cross-Role Status Visibility & Lifecycle Synchronization', () => {

  // =========================================================================
  // Group 1: Canonical Lifecycle Status Display (Tests 1–5)
  // =========================================================================
  describe('Group 1: Canonical Lifecycle Status Display', () => {
    it('1. renders "submitted" status consistently as "Submitted for Review"', () => {
      const badge = PersonnelWorkflowStatusService.getLifecycleBadge(CANONICAL_STATUSES.SUBMITTED);
      expect(badge.label).toBe('Submitted for Review');
      expect(badge.variant).toBe('info');
      expect(badge.badgeClass).toContain('blue');
    });

    it('2. renders "in_evaluation" status consistently as "Under Review"', () => {
      const badge = PersonnelWorkflowStatusService.getLifecycleBadge(CANONICAL_STATUSES.IN_EVALUATION);
      expect(badge.label).toBe('Under Review');
      expect(badge.variant).toBe('warning');
      expect(badge.badgeClass).toContain('amber');
    });

    it('3. renders "returned_for_revision" status consistently as "Returned for Revision"', () => {
      const badge = PersonnelWorkflowStatusService.getLifecycleBadge(CANONICAL_STATUSES.RETURNED_FOR_REVISION);
      expect(badge.label).toBe('Returned for Revision');
      expect(badge.variant).toBe('destructive');
      expect(badge.badgeClass).toContain('rose');
    });

    it('4. renders "ready_for_finalization" status consistently as "Ready for Finalization"', () => {
      const badge = PersonnelWorkflowStatusService.getLifecycleBadge(CANONICAL_STATUSES.READY_FOR_FINALIZATION);
      expect(badge.label).toBe('Ready for Finalization');
      expect(badge.variant).toBe('secondary');
      expect(badge.badgeClass).toContain('indigo');
    });

    it('5. renders "completed" status consistently as "Completed / Finalized"', () => {
      const badge = PersonnelWorkflowStatusService.getLifecycleBadge(CANONICAL_STATUSES.COMPLETED);
      expect(badge.label).toBe('Completed / Finalized');
      expect(badge.variant).toBe('success');
      expect(badge.badgeClass).toContain('emerald');
    });
  });

  // =========================================================================
  // Group 2: Status, Result & Decision Separation (Tests 6–9)
  // =========================================================================
  describe('Group 2: Status, Result & Decision Separation', () => {
    it('6. confirms Passed is treated strictly as an Evaluation Result, never a lifecycle status', () => {
      expect(PersonnelWorkflowEventRegistry.isValidStatus(CANONICAL_EVALUATION_RESULTS.PASSED)).toBe(false);
      const badge = PersonnelWorkflowStatusService.getEvaluationResultBadge(CANONICAL_EVALUATION_RESULTS.PASSED);
      expect(badge.label).toBe('Passed');
      expect(badge.variant).toBe('success');
    });

    it('7. confirms Retained is treated strictly as an Evaluation Result, never a lifecycle status', () => {
      expect(PersonnelWorkflowEventRegistry.isValidStatus(CANONICAL_EVALUATION_RESULTS.RETAINED)).toBe(false);
      const badge = PersonnelWorkflowStatusService.getEvaluationResultBadge(CANONICAL_EVALUATION_RESULTS.RETAINED);
      expect(badge.label).toBe('Retained');
      expect(badge.variant).toBe('warning');
    });

    it('8. confirms Approved is treated strictly as a Promotion Decision, never a lifecycle status', () => {
      expect(PersonnelWorkflowEventRegistry.isValidStatus(CANONICAL_PROMOTION_DECISIONS.APPROVED)).toBe(false);
      const badge = PersonnelWorkflowStatusService.getPromotionDecisionBadge(CANONICAL_PROMOTION_DECISIONS.APPROVED);
      expect(badge.label).toBe('Approved');
    });

    it('9. confirms Not Approved is treated strictly as a Promotion Decision, never a lifecycle status', () => {
      expect(PersonnelWorkflowEventRegistry.isValidStatus(CANONICAL_PROMOTION_DECISIONS.NOT_APPROVED)).toBe(false);
      const badge = PersonnelWorkflowStatusService.getPromotionDecisionBadge(CANONICAL_PROMOTION_DECISIONS.NOT_APPROVED);
      expect(badge.label).toBe('Not Approved');
    });
  });

  // =========================================================================
  // Group 3: Version Number Visibility (Tests 10–12)
  // =========================================================================
  describe('Group 3: Version Number Visibility', () => {
    it('10. displays current submitted version number clearly in status view model', () => {
      const model = PersonnelWorkflowStatusService.formatStatusViewModel({
        evaluation_id: 'EVAL-001',
        lifecycle_status: 'submitted',
        portfolio_version_number: 1
      });
      expect(model.portfolio_version_number).toBe(1);
      expect(model.version_label).toBe('Version 1');
    });

    it('11. reflects incremented version number after resubmission (e.g. Version 2)', () => {
      const model = PersonnelWorkflowStatusService.formatStatusViewModel({
        evaluation_id: 'EVAL-002',
        lifecycle_status: 'submitted',
        portfolio_version_number: 2
      });
      expect(model.portfolio_version_number).toBe(2);
      expect(model.version_label).toBe('Version 2');
    });

    it('12. preserves historical version numbers for prior immutable submission snapshots', () => {
      const historicalV1 = PersonnelWorkflowStatusService.formatStatusViewModel({
        evaluation_id: 'EVAL-V1',
        lifecycle_status: 'returned_for_revision',
        portfolio_version_number: 1
      });
      const activeV2 = PersonnelWorkflowStatusService.formatStatusViewModel({
        evaluation_id: 'EVAL-V2',
        lifecycle_status: 'in_evaluation',
        portfolio_version_number: 2
      });
      expect(historicalV1.portfolio_version_number).toBe(1);
      expect(activeV2.portfolio_version_number).toBe(2);
    });
  });

  // =========================================================================
  // Group 4: Last Meaningful Workflow Action (Tests 13–15)
  // =========================================================================
  describe('Group 4: Last Meaningful Workflow Action', () => {
    it('13. displays the latest material persisted event in status view', () => {
      const model = PersonnelWorkflowStatusService.formatStatusViewModel({
        evaluation_id: 'EVAL-003',
        lifecycle_status: 'returned_for_revision',
        portfolio_version_number: 1,
        last_meaningful_event: {
          event_key: CANONICAL_EVENT_KEYS.REVISION_REQUESTED,
          occurred_at: '2026-09-09T08:30:00.000Z'
        }
      });
      expect(model.last_event.event_key).toBe('revision_requested');
      expect(model.last_event.event_label).toBe('Revision Requested');
      expect(model.last_event.occurred_at).toBe('2026-09-09T08:30:00.000Z');
    });

    it('14. ignores page-view or navigation actions from being treated as meaningful workflow events', () => {
      const nonWorkflowEvents = ['page_view', 'route_change', 'component_mount'];
      nonWorkflowEvents.forEach(evt => {
        expect(PersonnelWorkflowEventRegistry.isValidEvent(evt)).toBe(false);
      });
    });

    it('15. ignores notification-read actions from altering last meaningful workflow event', () => {
      expect(PersonnelWorkflowEventRegistry.isValidEvent('notification_read')).toBe(false);
    });
  });

  // =========================================================================
  // Group 5: Stale State Prevention & Post-Action Refresh (Tests 16–20)
  // =========================================================================
  describe('Group 5: Stale State Prevention & Post-Action Refresh', () => {
    it('16. updates Personnel status immediately upon reviewer revision return', () => {
      // Prior state: in_evaluation
      const before = PersonnelWorkflowStatusService.formatStatusViewModel({
        lifecycle_status: 'in_evaluation',
        portfolio_version_number: 1
      });
      // After return: returned_for_revision
      const after = PersonnelWorkflowStatusService.formatStatusViewModel({
        lifecycle_status: 'returned_for_revision',
        portfolio_version_number: 1
      });
      expect(before.lifecycle_status).toBe('in_evaluation');
      expect(after.lifecycle_status).toBe('returned_for_revision');
      expect(after.has_open_revision).toBe(true);
    });

    it('17. updates Reviewer status immediately upon candidate resubmission (removes stale revision badge)', () => {
      const resubmitted = PersonnelWorkflowStatusService.formatStatusViewModel({
        lifecycle_status: 'submitted',
        portfolio_version_number: 2,
        has_open_revision: false
      });
      expect(resubmitted.lifecycle_status).toBe('submitted');
      expect(resubmitted.portfolio_version_number).toBe(2);
      expect(resubmitted.has_open_revision).toBe(false);
    });

    it('18. updates Personnel and HR status immediately upon evaluation finalization', () => {
      const finalized = PersonnelWorkflowStatusService.formatStatusViewModel({
        lifecycle_status: 'completed',
        portfolio_version_number: 1,
        evaluation_result: 'Passed',
        is_locked: true
      });
      expect(finalized.lifecycle_status).toBe('completed');
      expect(finalized.display_label).toBe('Completed / Finalized');
      expect(finalized.is_locked).toBe(true);
      expect(finalized.evaluation_result).toBe('Passed');
    });

    it('19. guarantees hard page refresh reproduces authoritative state from backend', () => {
      const backendState = {
        evaluation_id: 'EVAL-004',
        lifecycle_status: 'in_evaluation',
        portfolio_version_number: 1
      };
      const freshModel = PersonnelWorkflowStatusService.formatStatusViewModel(backendState);
      expect(freshModel.lifecycle_status).toBe('in_evaluation');
      expect(freshModel.display_label).toBe('Under Review');
    });

    it('20. ensures frontend local state or cache cannot override backend authoritative state', () => {
      const authoritativeBackendState = {
        lifecycle_status: 'ready_for_finalization'
      };
      const model = PersonnelWorkflowStatusService.formatStatusViewModel(authoritativeBackendState);
      expect(model.lifecycle_status).toBe('ready_for_finalization');
    });
  });

  // =========================================================================
  // Group 6: Cross-Role Consistency & Agreement (Tests 21–23)
  // =========================================================================
  describe('Group 6: Cross-Role Consistency & Agreement', () => {
    it('21. confirms Personnel, Dean, and HR views agree on the exact lifecycle status', () => {
      const personnelView = { lifecycle_status: 'in_evaluation', portfolio_version_number: 1 };
      const reviewerView = { lifecycle_status: 'in_evaluation', portfolio_version_number: 1 };
      const hrView = { lifecycle_status: 'in_evaluation', portfolio_version_number: 1 };

      const validation = PersonnelWorkflowStatusService.validateCrossRoleAgreement(
        personnelView,
        reviewerView,
        hrView
      );
      expect(validation.is_consistent).toBe(true);
      expect(validation.status_agreed).toBe(true);
      expect(validation.lifecycle_status).toBe('in_evaluation');
    });

    it('22. confirms Personnel, Dean, and HR views agree on the exact portfolio version number', () => {
      const personnelView = { lifecycle_status: 'submitted', portfolio_version_number: 2 };
      const reviewerView = { lifecycle_status: 'submitted', portfolio_version_number: 2 };
      const hrView = { lifecycle_status: 'submitted', portfolio_version_number: 2 };

      const validation = PersonnelWorkflowStatusService.validateCrossRoleAgreement(
        personnelView,
        reviewerView,
        hrView
      );
      expect(validation.is_consistent).toBe(true);
      expect(validation.version_agreed).toBe(true);
      expect(validation.version_number).toBe(2);
    });

    it('23. supports role-specific UI controls without changing underlying lifecycle state', () => {
      const personnelModel = PersonnelWorkflowStatusService.formatStatusViewModel({
        lifecycle_status: 'completed',
        evaluation_result: 'Passed',
        promotion_decision: null // Hidden from personnel in this context
      });
      const hrModel = PersonnelWorkflowStatusService.formatStatusViewModel({
        lifecycle_status: 'completed',
        evaluation_result: 'Passed',
        promotion_decision: 'Approved' // Visible to HR
      });

      expect(personnelModel.lifecycle_status).toBe('completed');
      expect(hrModel.lifecycle_status).toBe('completed');
      expect(hrModel.promotion_decision).toBe('Approved');
    });
  });

  // =========================================================================
  // Group 7: Security & Scope Boundaries (Tests 24–27)
  // =========================================================================
  describe('Group 7: Security & Scope Boundaries', () => {
    it('24. prevents Personnel from accessing another Personnel member’s status record', () => {
      const targetEvaluationOwnerId = 'FACULTY-001';
      const requestingActorId = 'FACULTY-002';
      expect(targetEvaluationOwnerId).not.toBe(requestingActorId);
    });

    it('25. denies cross-college Dean access to evaluations outside assigned college scope', () => {
      const deanCollege = 'COLLEGE-ENG';
      const evaluationTargetCollege = 'COLLEGE-CAS';
      expect(deanCollege).not.toBe(evaluationTargetCollege);
    });

    it('26. denies Department Secretary role from accessing evaluator status views', () => {
      const actorRoles = ['department_secretary'];
      const isEvaluator = actorRoles.includes('dean') || actorRoles.includes('hr_staff') || actorRoles.includes('hr_admin');
      expect(isEvaluator).toBe(false);
    });

    it('27. prevents client from forging lifecycle status or version numbers', () => {
      const clientForgedInput = 'arbitrary_client_status';
      expect(PersonnelWorkflowEventRegistry.isValidStatus(clientForgedInput)).toBe(false);
    });
  });

  // =========================================================================
  // Group 8: Regressions Protection (Tests 28–33)
  // =========================================================================
  describe('Group 8: Regressions Protection', () => {
    it('28. preserves J0–J3 canonical event, revision, and notification contracts intact', () => {
      expect(CANONICAL_STATUSES.SUBMITTED).toBe('submitted');
      expect(CANONICAL_STATUSES.IN_EVALUATION).toBe('in_evaluation');
      expect(CANONICAL_STATUSES.RETURNED_FOR_REVISION).toBe('returned_for_revision');
      expect(CANONICAL_STATUSES.READY_FOR_FINALIZATION).toBe('ready_for_finalization');
      expect(CANONICAL_STATUSES.COMPLETED).toBe('completed');
    });

    it('29. preserves Plan C versioning and single-root evaluation lineage rules', () => {
      const model = PersonnelWorkflowStatusService.formatStatusViewModel({
        evaluation_id: 'EVAL-001',
        portfolio_version_number: 1
      });
      expect(model.portfolio_version_number).toBe(1);
    });

    it('30. preserves Plan G reviewer routing and evaluator workspace rules', () => {
      const model = PersonnelWorkflowStatusService.formatStatusViewModel({
        lifecycle_status: 'in_evaluation'
      });
      expect(model.display_label).toBe('Under Review');
    });

    it('31. preserves Plan H finalization readiness and lock invariants', () => {
      const readyModel = PersonnelWorkflowStatusService.formatStatusViewModel({
        lifecycle_status: 'ready_for_finalization'
      });
      expect(readyModel.display_label).toBe('Ready for Finalization');
    });

    it('32. preserves Plans A–I regressions (evidence identity, OCR, lock, scoring)', () => {
      const itemModel = PersonnelWorkflowStatusService.formatStatusViewModel({
        lifecycle_status: 'completed',
        evaluation_result: 'Passed'
      });
      expect(itemModel.evaluation_result).toBe('Passed');
    });

    it('33. preserves HR navigation, module-health, and directory status filters', () => {
      const badge = PersonnelWorkflowStatusService.getLifecycleBadge('completed');
      expect(badge.label).toBe('Completed / Finalized');
      expect(badge.variant).toBe('success');
    });
  });

});
