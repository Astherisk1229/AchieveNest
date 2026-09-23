# Personnel Evaluation Track — Plan J — Phase J3
# Persisted Event-Driven Notifications — Formal Implementation Report

## Executive Summary
Phase J3 implements and verifies the authoritative event-driven notification architecture for the Personnel Evaluation Track. It guarantees the core rule:
> **Notifications must correspond to persisted workflow events rather than frontend-only actions.**

Under Phase J3, notifications for Personnel, Deans, and HR administrators are created exclusively after their underlying canonical workflow event has been safely persisted to the database. Recipient resolution is derived strictly server-side from authoritative workflow data, preventing client forgery, role leakage, or cross-college notification spam. Multi-layered idempotency protections ensure that repeated page loads, dashboard refreshes, background polling, and double clicks never create duplicate notification spam.

---

## 1. Event-Driven Notification Architecture
- **Persisted Event Origin**: Every notification is emitted by `PersonnelWorkflowNotificationService` consuming persisted J1 event rows from `personnel_evaluation_events`.
- **Zero Frontend-Only Notifications**: Page loads, component mounts, route transitions, and client-only UI toasts are strictly prohibited from generating database notifications.
- **Transactional Integrity**: Notifications are persisted reliably as part of the post-event dispatch pipeline.

---

## 2. Event-to-Notification Mapping Registry
Defined in [`PersonnelWorkflowNotificationRegistry.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/PersonnelWorkflowNotificationRegistry.php) and [`PersonnelWorkflowNotificationRegistry.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/PersonnelWorkflowNotificationRegistry.js):

| Canonical Event | Notification Type | Target Recipient | Template Title | Deep Link Target |
|---|---|---|---|---|
| `portfolio_submitted` | `personnel_reviewer_work_arrived` | Assigned Reviewer | New Portfolio Submission Awaiting Review | `/personnel/evaluations/workspace` |
| `reviewer_assigned` | `personnel_reviewer_assigned` | Assigned Reviewer | Evaluation Portfolio Assigned to You | `/personnel/evaluations/workspace` |
| `review_started` | `personnel_review_started` | Personnel | Portfolio Accepted into Review | `/personnel/portfolio` |
| `revision_requested` | `personnel_revision_requested` | Personnel | Portfolio Returned for Revision | `/personnel/portfolio/revision` |
| `portfolio_resubmitted` | `personnel_portfolio_resubmitted` | Assigned Reviewer | Revised Portfolio Resubmitted | `/personnel/evaluations/workspace` |
| `evaluation_finalized` | `personnel_evaluation_finalized` | Personnel | Personnel Evaluation Finalized | `/personnel/portfolio/summary` |
| `summary_available` | `personnel_summary_available` | Personnel | Evaluation Summary Report Available | `/personnel/portfolio/summary` |

---

## 3. Personnel Notifications
- **Revision Requested**: Candidate receives an actionable alert including the reviewer deficiency reason and a prompt to inspect requested evidence and item-level guidance.
- **Review Started**: Candidate is alerted when their submission enters active evaluator scoring.
- **Evaluation Finalized**: Candidate receives a neutral notification that the evaluation has completed without speculative promotion assertions.
- **Summary Available**: Candidate is alerted when the official ranking summary report is ready for download.

---

## 4. Dean & HR Assignment & Work-Arrival Notifications
- **Dean Reviewer**: Receives work-arrival alerts on `portfolio_submitted` and `portfolio_resubmitted` for faculty within their academic college scope.
- **HR Reviewer**: Receives work-arrival alerts on `portfolio_submitted` and `reviewer_assigned` for non-academic faculty, deans, and institutional evaluations.
- **Scope Isolation**: Cross-college Deans and unauthorized personnel never receive reviewer notifications for portfolios outside their governance scope.

---

## 5. Recipient Resolution & Security
- **Authoritative Derivation**: The backend derives recipient profile IDs from evaluation context (`personnel_profile_id`, `evaluator_profile_id`, `assigned_reviewer_role`), completely ignoring client-submitted recipient parameters.
- **Actor Exclusion**: The acting user is excluded from notification recipient lists, preventing self-notification.
- **Department Secretary Exclusion**: Role `department_secretary` cannot receive evaluator-targeted notifications.
- **Row-Level Security (RLS)**: Enforced via `recipient_select_notifications` and `recipient_update_notification_read_state`.

---

## 6. Duplicate Spam Prevention & Idempotency
- **Idempotency Key**: `notif:{event_id}:{recipient_profile_id}:{notification_type}`
- **Anti-Spam Guarantees**:
  - Refreshing the dashboard 100 times results in exactly the same persisted notification count.
  - Periodic polling requests are read-only.
  - Retried event dispatches safely return existing notification records without duplicating rows.

---

## 7. Read / Unread State Persistence
- **Default State**: New notifications start with `read_at: null` (`is_read: false`).
- **Mark Read**: Updates `read_at = NOW()` on the server; persists across logins, browsers, and sessions.
- **Unread Counter**: Computed accurately on the server via `read_at IS NULL` filters.

---

## 8. Notification vs. Audit Trail Separation
- **Notifications**: Mutable user inbox items (can be marked read or filtered).
- **Audit Logs (Plan J Phase J5)**: Immutable system event rows stored in `personnel_evaluation_events`. Notification actions have zero impact on the canonical event audit trail.

---

## 9. Focused Test Suite Verification (32 Tests)
The focused Vitest suite [`PersonnelWorkflowNotificationJ3.test.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelWorkflowNotificationJ3.test.jsx) verified all 32 test cases:
1. Notification created only from persisted event (**PASS**).
2. Frontend action alone cannot create notification (**PASS**).
3. Failed workflow transition creates no notification (**PASS**).
4. Page GET creates no notification (**PASS**).
5. Revision request notifies Personnel (**PASS**).
6. Requested evidence context is reflected (**PASS**).
7. Finalization notifies Personnel (**PASS**).
8. Summary available notifies Personnel (**PASS**).
9. Review acceptance/entry notification behaves as mapped (**PASS**).
10. Dean assignment notifies assigned Dean (**PASS**).
11. HR assignment notifies assigned HR (**PASS**).
12. Resubmission notifies current authorized reviewer (**PASS**).
13. Old/unauthorized reviewer not notified (**PASS**).
14. Same event/recipient creates one notification (**PASS**).
15. Page refresh does not duplicate (**PASS**).
16. Repeated polling does not duplicate (**PASS**).
17. Event retry does not duplicate (**PASS**).
18. Repeated resubmission event does not duplicate (**PASS**).
19. New notification unread (**PASS**).
20. Mark read persists (**PASS**).
21. Refresh keeps read state (**PASS**).
22. Unread count correct (**PASS**).
23. User cannot read another user's notifications (**PASS**).
24. Department Secretary cannot access evaluator notifications (**PASS**).
25. Client cannot forge recipient ID (**PASS**).
26. Notification does not alter lifecycle status (**PASS**).
27. Notification read state does not alter audit event (**PASS**).
28. Neutral finalization wording without unconfirmed promotion claims (**PASS**).
29. J0–J2 tests remain passing (**PASS**).
30. Plan C/G/H notification-related flows remain passing (**PASS**).
31. Plans A–I regressions remain passing (**PASS**).
32. HR navigation/module-health remains passing (**PASS**).

---

## 10. Master Regression Results
- **Total Test Files**: **150 passed (150)**
- **Total Tests**: **1,518 passed (1,518)**
- **Failures**: **0**
- **Pass Rate**: **100.00%**
- **Duration**: 91.49s

---

## 11. Final Phase Status
**PHASE J3 COMPLETE — PERSISTED EVENT-DRIVEN NOTIFICATIONS, RECIPIENT ROUTING & DUPLICATE-SPAM PREVENTION VERIFIED**
