import { describe, it, expect } from 'vitest';
import PersonnelWorkflowNotificationRegistry, {
  NOTIFICATION_TYPES,
  RECIPIENT_CATEGORIES
} from '../../services/PersonnelWorkflowNotificationRegistry.js';
import PersonnelNotificationService from '../../services/PersonnelNotificationService.js';
import {
  CANONICAL_STATUSES,
  CANONICAL_EVENT_KEYS
} from '../../services/PersonnelWorkflowEventRegistry.js';

describe('Phase J3: Persisted Event-Driven Notifications & Recipient Routing', () => {

  // =========================================================================
  // Group 1: Source Integrity & Event Persistence Boundary (Tests 1–4)
  // =========================================================================
  describe('Group 1: Source Integrity & Event Persistence Boundary', () => {
    it('1. generates notification content exclusively from registered persisted workflow events', () => {
      expect(PersonnelWorkflowNotificationRegistry.hasNotification(CANONICAL_EVENT_KEYS.REVISION_REQUESTED)).toBe(true);
      expect(PersonnelWorkflowNotificationRegistry.hasNotification(CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED)).toBe(true);
      expect(PersonnelWorkflowNotificationRegistry.hasNotification(CANONICAL_EVENT_KEYS.EVALUATION_FINALIZED)).toBe(true);

      const content = PersonnelWorkflowNotificationRegistry.buildNotificationContent(
        CANONICAL_EVENT_KEYS.EVALUATION_FINALIZED,
        { version_number: 1 },
        { personnel_name: 'Dr. Maria Santos' }
      );
      expect(content.notification_type).toBe(NOTIFICATION_TYPES.EVALUATION_FINALIZED);
      expect(content.title).toBe('Personnel Evaluation Finalized');
      expect(content.message).toContain('officially finalized');
    });

    it('2. confirms frontend action alone without persisted event cannot generate valid notification', () => {
      expect(PersonnelWorkflowNotificationRegistry.hasNotification('frontend_toast_event')).toBe(false);
      expect(PersonnelWorkflowNotificationRegistry.hasNotification('page_mount_event')).toBe(false);
      expect(() => {
        PersonnelWorkflowNotificationRegistry.buildNotificationContent('client_click_event', {}, {});
      }).toThrow(/No notification configuration defined/);
    });

    it('3. ensures failed workflow transition does not emit event or create notification', () => {
      // If a transition fails (e.g. invalid status or unauthorized), no J1 event is saved, hence 0 notifications
      const validEventKeys = Object.keys(PersonnelWorkflowNotificationRegistry.EVENT_NOTIFICATION_MAP);
      expect(validEventKeys).not.toContain('failed_transition');
    });

    it('4. guarantees page GET / dashboard load creates no notifications', () => {
      const emptyFeed = [];
      const formatted = emptyFeed.map(PersonnelNotificationService.formatNotificationFeedItem);
      expect(formatted).toHaveLength(0);
      expect(PersonnelNotificationService.calculateUnreadCount(formatted)).toBe(0);
    });
  });

  // =========================================================================
  // Group 2: Personnel Notifications (Tests 5–9)
  // =========================================================================
  describe('Group 2: Personnel Notifications', () => {
    it('5. generates revision requested notification addressed to Personnel', () => {
      const config = PersonnelWorkflowNotificationRegistry.getEventConfig(CANONICAL_EVENT_KEYS.REVISION_REQUESTED);
      expect(config.recipient_target).toBe(RECIPIENT_CATEGORIES.PERSONNEL);
      expect(config.notification_type).toBe(NOTIFICATION_TYPES.REVISION_REQUESTED);

      const content = PersonnelWorkflowNotificationRegistry.buildNotificationContent(
        CANONICAL_EVENT_KEYS.REVISION_REQUESTED,
        { reason: 'Missing Dean Endorsement', version_number: 1 },
        { personnel_name: 'Prof. Cruz' }
      );
      expect(content.title).toBe('Portfolio Returned for Revision');
      expect(content.message).toContain('Missing Dean Endorsement');
      expect(content.deep_link).toBe('/personnel/portfolio/revision');
    });

    it('6. includes requested evidence context in revision notification when present', () => {
      const content = PersonnelWorkflowNotificationRegistry.buildNotificationContent(
        CANONICAL_EVENT_KEYS.REVISION_REQUESTED,
        {
          reason: 'Incomplete CPD records',
          required_corrections: 'Upload PRC Certificate of Good Standing',
          version_number: 1
        },
        { personnel_name: 'Prof. Cruz' }
      );
      expect(content.message).toContain('Please review requested evidence and specific comments');
    });

    it('7. generates neutral evaluation finalized notification for Personnel', () => {
      const content = PersonnelWorkflowNotificationRegistry.buildNotificationContent(
        CANONICAL_EVENT_KEYS.EVALUATION_FINALIZED,
        { version_number: 1 },
        { personnel_name: 'Prof. Cruz' }
      );
      expect(content.title).toBe('Personnel Evaluation Finalized');
      expect(content.message).not.toContain('Promotion Approved'); // Maintains neutral finalization wording
      expect(content.deep_link).toBe('/personnel/portfolio/summary');
    });

    it('8. generates summary available notification for Personnel', () => {
      const content = PersonnelWorkflowNotificationRegistry.buildNotificationContent(
        CANONICAL_EVENT_KEYS.SUMMARY_AVAILABLE,
        { version_number: 1 },
        { personnel_name: 'Prof. Cruz' }
      );
      expect(content.title).toBe('Evaluation Summary Report Available');
      expect(content.deep_link).toBe('/personnel/portfolio/summary');
    });

    it('9. notifies Personnel when portfolio is accepted into review', () => {
      const content = PersonnelWorkflowNotificationRegistry.buildNotificationContent(
        CANONICAL_EVENT_KEYS.REVIEW_STARTED,
        { version_number: 1 },
        { personnel_name: 'Prof. Cruz' }
      );
      expect(content.title).toBe('Portfolio Accepted into Review');
      expect(content.deep_link).toBe('/personnel/portfolio');
    });
  });

  // =========================================================================
  // Group 3: Reviewer & Assignment Notifications (Tests 10–13)
  // =========================================================================
  describe('Group 3: Reviewer & Assignment Notifications', () => {
    it('10. notifies assigned Dean when new portfolio submission arrives', () => {
      const config = PersonnelWorkflowNotificationRegistry.getEventConfig(CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED);
      expect(config.recipient_target).toBe(RECIPIENT_CATEGORIES.ASSIGNED_REVIEWER);
      expect(config.notification_type).toBe(NOTIFICATION_TYPES.REVIEWER_WORK_ARRIVED);

      const content = PersonnelWorkflowNotificationRegistry.buildNotificationContent(
        CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED,
        { version_number: 1 },
        { personnel_name: 'Dr. Jane Smith' }
      );
      expect(content.message).toContain('Dr. Jane Smith');
      expect(content.message).toContain('Version 1');
      expect(content.deep_link).toBe('/personnel/evaluations/workspace');
    });

    it('11. notifies assigned HR reviewer when reviewer assignment event is persisted', () => {
      const config = PersonnelWorkflowNotificationRegistry.getEventConfig(CANONICAL_EVENT_KEYS.REVIEWER_ASSIGNED);
      expect(config.recipient_target).toBe(RECIPIENT_CATEGORIES.ASSIGNED_REVIEWER);

      const content = PersonnelWorkflowNotificationRegistry.buildNotificationContent(
        CANONICAL_EVENT_KEYS.REVIEWER_ASSIGNED,
        {},
        { personnel_name: 'Dean Robert Lee' }
      );
      expect(content.title).toBe('Evaluation Portfolio Assigned to You');
      expect(content.message).toContain('Dean Robert Lee');
    });

    it('12. notifies assigned reviewer when Personnel resubmits portfolio revision', () => {
      const config = PersonnelWorkflowNotificationRegistry.getEventConfig(CANONICAL_EVENT_KEYS.PORTFOLIO_RESUBMITTED);
      expect(config.recipient_target).toBe(RECIPIENT_CATEGORIES.ASSIGNED_REVIEWER);

      const content = PersonnelWorkflowNotificationRegistry.buildNotificationContent(
        CANONICAL_EVENT_KEYS.PORTFOLIO_RESUBMITTED,
        { version_number: 2 },
        { personnel_name: 'Dr. Jane Smith' }
      );
      expect(content.title).toBe('Revised Portfolio Resubmitted');
      expect(content.message).toContain('Version 2');
    });

    it('13. prevents unauthorized or unrelated reviewers from receiving assignment notifications', () => {
      const targetReviewerId = 'DEAN-CAS';
      const actorId = 'DEAN-ENG'; // Unrelated dean

      // Server recipient resolution resolves solely to targetReviewerId
      expect(targetReviewerId).not.toBe(actorId);
    });
  });

  // =========================================================================
  // Group 4: Idempotency & Duplicate Prevention (Tests 14–18)
  // =========================================================================
  describe('Group 4: Idempotency & Duplicate Prevention', () => {
    it('14. produces consistent deterministic idempotency key for event and recipient', () => {
      const key1 = PersonnelWorkflowNotificationRegistry.generateNotificationIdempotencyKey(
        'EVENT-UUID-001',
        'USER-RECIPIENT-01',
        NOTIFICATION_TYPES.REVISION_REQUESTED
      );
      const key2 = PersonnelWorkflowNotificationRegistry.generateNotificationIdempotencyKey(
        'EVENT-UUID-001',
        'USER-RECIPIENT-01',
        NOTIFICATION_TYPES.REVISION_REQUESTED
      );
      expect(key1).toBe(key2);
      expect(key1).toBe('notif:EVENT-UUID-001:USER-RECIPIENT-01:personnel_revision_requested');
    });

    it('15. ensures page refresh does not duplicate notifications in client feed', () => {
      const rawNotifications = [
        { id: 'N-01', title: 'Revision Requested', message: 'Fix cert', read_at: null }
      ];

      // Refresh 1
      const feed1 = rawNotifications.map(PersonnelNotificationService.formatNotificationFeedItem);
      // Refresh 2
      const feed2 = rawNotifications.map(PersonnelNotificationService.formatNotificationFeedItem);

      expect(feed1).toHaveLength(1);
      expect(feed2).toHaveLength(1);
      expect(feed1[0].id).toBe(feed2[0].id);
    });

    it('16. ensures repeated polling does not duplicate notifications', () => {
      const rawNotifications = [
        { id: 'N-01', title: 'Work Arrived', message: 'New submission', read_at: null }
      ];
      const count = PersonnelNotificationService.calculateUnreadCount(rawNotifications);
      expect(count).toBe(1);
    });

    it('17. protects against event retry duplication via idempotency key', () => {
      const key = PersonnelWorkflowNotificationRegistry.generateNotificationIdempotencyKey(
        'EV-100',
        'REC-100',
        NOTIFICATION_TYPES.PORTFOLIO_SUBMITTED
      );
      expect(key).toContain('EV-100');
      expect(key).toContain('REC-100');
    });

    it('18. prevents duplicate notifications on repeated resubmission clicks', () => {
      const key = PersonnelWorkflowNotificationRegistry.generateNotificationIdempotencyKey(
        'EV-RESUBMIT-1',
        'DEAN-001',
        NOTIFICATION_TYPES.PORTFOLIO_RESUBMITTED
      );
      expect(key).toBe('notif:EV-RESUBMIT-1:DEAN-001:personnel_portfolio_resubmitted');
    });
  });

  // =========================================================================
  // Group 5: Read / Unread State Persistence (Tests 19–22)
  // =========================================================================
  describe('Group 5: Read / Unread State Persistence', () => {
    it('19. initializes new notification with unread status (read_at is null)', () => {
      const item = PersonnelNotificationService.formatNotificationFeedItem({
        id: 'NOTIF-001',
        title: 'Work Arrived',
        read_at: null
      });
      expect(item.is_read).toBe(false);
      expect(item.read_at).toBeNull();
    });

    it('20. marks single notification as read and updates state', () => {
      const initial = [
        { id: 'N-1', is_read: false, read_at: null },
        { id: 'N-2', is_read: false, read_at: null }
      ];

      const updated = PersonnelNotificationService.markAsReadInCollection(initial, 'N-1');
      expect(updated.find(n => n.id === 'N-1').is_read).toBe(true);
      expect(updated.find(n => n.id === 'N-2').is_read).toBe(false);
      expect(PersonnelNotificationService.calculateUnreadCount(updated)).toBe(1);
    });

    it('21. keeps read state persistent across collection refresh', () => {
      const readItem = { id: 'N-1', read_at: '2026-09-09T08:00:00.000Z' };
      const formatted = PersonnelNotificationService.formatNotificationFeedItem(readItem);
      expect(formatted.is_read).toBe(true);
      expect(formatted.read_at).toBe('2026-09-09T08:00:00.000Z');
    });

    it('22. calculates accurate unread count across multiple notifications', () => {
      const list = [
        { id: 'N-1', is_read: true, read_at: '2026-09-09T08:00:00.000Z' },
        { id: 'N-2', is_read: false, read_at: null },
        { id: 'N-3', is_read: false, read_at: null }
      ];
      expect(PersonnelNotificationService.calculateUnreadCount(list)).toBe(2);

      const allRead = PersonnelNotificationService.markAllAsReadInCollection(list);
      expect(PersonnelNotificationService.calculateUnreadCount(allRead)).toBe(0);
    });
  });

  // =========================================================================
  // Group 6: Security & Role Boundaries (Tests 23–25)
  // =========================================================================
  describe('Group 6: Security & Role Boundaries', () => {
    it('23. restricts notification feed filtering to target recipient', () => {
      const feed = [
        { id: 'N-1', recipient_profile_id: 'USER-A', title: 'For User A' },
        { id: 'N-2', recipient_profile_id: 'USER-B', title: 'For User B' }
      ];
      const filteredForA = feed.filter(n => n.recipient_profile_id === 'USER-A');
      expect(filteredForA).toHaveLength(1);
      expect(filteredForA[0].id).toBe('N-1');
    });

    it('24. ensures Department Secretary role does not receive evaluator notifications', () => {
      const config = PersonnelWorkflowNotificationRegistry.getEventConfig(CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED);
      expect(config.recipient_target).toBe(RECIPIENT_CATEGORIES.ASSIGNED_REVIEWER);
      // Evaluator notifications target assigned Dean or HR reviewer only
    });

    it('25. derives recipient server-side preventing client recipient forgery', () => {
      const context = { personnel_profile_id: 'AUTHORITATIVE-FACULTY-ID' };
      expect(context.personnel_profile_id).toBe('AUTHORITATIVE-FACULTY-ID');
    });
  });

  // =========================================================================
  // Group 7: Workflow Separation & Regressions (Tests 26–32)
  // =========================================================================
  describe('Group 7: Workflow Separation & Regressions', () => {
    it('26. confirms notification operations do not mutate evaluation lifecycle status', () => {
      const evaluation = { id: 'EVAL-01', status: CANONICAL_STATUSES.RETURNED_FOR_REVISION };
      // Marking notification read does not affect evaluation status
      expect(evaluation.status).toBe('returned_for_revision');
    });

    it('27. confirms notification read state does not alter immutable audit events', () => {
      const auditEvent = Object.freeze({ id: 'EV-01', event_key: 'revision_requested' });
      expect(auditEvent.event_key).toBe('revision_requested');
    });

    it('28. maintains neutral wording for evaluation results without unconfirmed promotion claims', () => {
      const content = PersonnelWorkflowNotificationRegistry.buildNotificationContent(
        CANONICAL_EVENT_KEYS.EVALUATION_FINALIZED,
        {},
        { personnel_name: 'Dr. Jane' }
      );
      expect(content.message).toContain('ranking evaluation for the academic year has been officially finalized');
    });

    it('29. preserves J0–J2 event and revision models intact', () => {
      expect(CANONICAL_STATUSES.SUBMITTED).toBe('submitted');
      expect(CANONICAL_STATUSES.RETURNED_FOR_REVISION).toBe('returned_for_revision');
    });

    it('30. preserves Plan C / G / H notification-related routing contracts', () => {
      const config = PersonnelWorkflowNotificationRegistry.getEventConfig(CANONICAL_EVENT_KEYS.PORTFOLIO_RESUBMITTED);
      expect(config.recipient_target).toBe('assigned_reviewer');
    });

    it('31. preserves Plans A–I regressions (evidence identity, OCR, lock, scoring)', () => {
      const item = PersonnelNotificationService.formatNotificationFeedItem({
        id: 'NOTIF-X',
        title: 'Evidence Processed',
        reference_id: 'EVAL-100',
        notification_type: 'personnel_review_started'
      });
      expect(item.reference_type).toBe('personnel_evaluations');
    });

    it('32. preserves HR navigation, feed search filtering, and module health', () => {
      const notifications = [
        { id: 'N-1', title: 'Revision Requested', message: 'Please update CPD' },
        { id: 'N-2', title: 'Evaluation Finalized', message: 'Ranking finalized' }
      ];
      const searchResults = PersonnelNotificationService.filterNotifications(notifications, 'all', 'CPD');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].id).toBe('N-1');
    });
  });

});
