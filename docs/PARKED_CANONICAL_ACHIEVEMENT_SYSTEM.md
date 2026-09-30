# Parked: canonical student achievement lifecycle

Status as of 2026-09-30: **PARKED.** `student_portfolio_records` is the single system of record for student achievements (Step 1, commit `9ba606d`). No UI calls the canonical lifecycle. It is kept in the codebase, not deleted, and nothing new is built on it. Data is never copied between the two systems.

## What is parked

| Layer | Items |
|---|---|
| Tables (Phase2 migrations `2026-09-21-000002` … `000022`) | `achievement_records`, `achievement_record_versions`, `achievement_evidence`, `student_achievement_verification_routes`, `achievement_verification_events`, `achievement_field_resolutions`, `achievement_version_draft_fields`, student detail tables |
| Backend (each carries a `PARKED (2026-09-30)` header) | `Controllers/Api/StudentAchievementLifecycleController.php`, `Services/CanonicalStudentAchievementDraftService.php`, `Services/StudentAchievementRoutingService.php` |
| Routes still registered | `POST student/achievements/drafts`, `GET/PUT student/achievements/{id}`, `POST student/achievements/{id}/evidence` (and related). They are reachable by an authenticated student but used by no screen. Their writes go only to the canonical tables, which nothing downstream reads. |
| Frontend | `services/studentAchievementLifecycleService.js` (PARKED header), `pages/student/modals/CanonicalAchievementSubmissionModal.jsx` and its test (not imported by any page) |

## Why it was parked (audit 2026-09-30)

The canonical path wrote submissions that no queue, coordinator, portfolio or scoring code read. It had no approve, return or reject states. Its submit was not atomic, and it sent no coordinator notification. The full list is in `STUDENT_ACHIEVEMENT_WORKFLOW_AUDIT_2026-09-30.md` §M items 1, 7, 8 and 9.

## Conditions for resuming it

Resume only when **all** of these are true, and as a planned migration, never as a parallel path:

1. **Decision recorded.** The adviser/OSAD approve moving the system of record, and the Step 1 decision is formally reversed.
2. **Full lifecycle exists.** The canonical model has approve, return (`revision_requested`), reject and resubmit, with a race-safe conditional transition (the same guarantees as Step 3), verification events and required remarks.
3. **Atomic submit.** The detail insert, routing and event are written in one transaction, and a retry is safe.
4. **Coordinator side switched.** The coordinator queue, evidence download, decision endpoints and notifications read the canonical tables and use the same single-resolved-coordinator rule (`StudentPortfolioPolicy::resolveStudentProgram` / `activeCoordinatorIds`).
5. **Scoring input switched.** `AwardEvidenceMappingService::loadVerifiedRecordsForStudent`, `ApprovedAchievementScoringService` and `student_achievement_criterion_contributions` reference canonical records. This needs a new migration: today the contribution FK points at `student_portfolio_records`.
6. **One-time data migration.** Existing `student_portfolio_records`, their evidence, verification events and contributions move with full history, and the counts are verified.
7. **Legacy retired in the same release.** The `/portfolio` write endpoints are removed or made read-only, so there is never more than one writable system of record.
8. **All proof tests re-pass** against the canonical model: Steps 1–6 HTTP proof tests and the student point-privacy test.

Until then: do not delete these tables or files, and do not add features to them.
