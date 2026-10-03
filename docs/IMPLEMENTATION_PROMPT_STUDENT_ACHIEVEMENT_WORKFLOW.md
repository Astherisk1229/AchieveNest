# IMPLEMENTATION PROMPT — Reconnect the Student Achievement → Program Coordinator → Portfolio → OSAD Points Workflow

You are working in the AchieveNest repository (CodeIgniter 4 backend in `backend/`, React + Vite frontend in `frontend/`).

This prompt follows the audit report `docs/STUDENT_ACHIEVEMENT_WORKFLOW_AUDIT_2026-09-30.md`. **Read that report fully before changing anything.** Every task below maps to a finding in it.

This phase is **IMPLEMENTATION**, done in 7 gated steps. Complete one step, run its acceptance checks, write a short step report, and **stop for review** before starting the next step, unless told to continue.

---

## 0. ARCHITECTURE DECISION (AUTHORITATIVE — DO NOT REOPEN)

`student_portfolio_records` is the **single system of record** for student achievements in this release.

- Its related tables are `student_portfolio_evidence` and `student_portfolio_verification_events`.
- The canonical tables are **parked**. Do not delete them, do not drop their migrations, and do not write new features against them in this phase:
  - `achievement_records`, `achievement_record_versions`, `achievement_version_draft_fields`
  - `achievement_evidence`, `achievement_version_evidence`
  - `student_achievement_verification_routes`, `student_achievement_routing_events`
- The **UX and safety features** of `CanonicalAchievementSubmissionModal.jsx` are kept: evidence upload first, ClamAV scan, OCR suggestions, per-type structured fields, and full-document preview. They must be **re-pointed** to the `/portfolio` endpoints.
- There must be **exactly one** record per achievement. Do not create a bridge that copies canonical rows into `student_portfolio_records`, or the reverse.

---

## 1. NON-NEGOTIABLE RULES

1. **No guessing.** Before editing a file, read it. Before calling an endpoint from the frontend, confirm the route exists in `backend/app/Config/Routes.php` and read the handler.
2. **No invented tables, columns, or endpoints.** When a column is needed, confirm it in the migrations or in `backend/database/codeigniter-canonical-baseline/000001_schema.sql`. If you must add one, create a new migration in the existing migration folder convention. Never edit an already-applied migration.
3. **Server-side authority.** The frontend never decides status, reviewer, points, or criteria. Hiding with CSS is not a fix.
4. **Students never see points.** This covers per-achievement points, criterion points, totals, and rubric point values, in UI, API responses, exports, and print.
5. **Transactions.** Any operation that changes more than one table must be atomic, and must check `transStatus()` or catch and roll back.
6. **Idempotency.** Repeating the same request (a double click, a retry, or concurrent calls) must never create duplicate events, records, or score rows.
7. **Minimal blast radius.** Do not refactor unrelated modules: personnel, HR, dean, certificates, and events. Do not reformat files you only partially change.
8. **Preserve history.** Never delete rows from `student_portfolio_verification_events`. Never hard-delete evidence files.
9. **Tests.** Every step must add or update automated tests: PHPUnit feature tests in `backend/tests/Feature` and Vitest tests beside the changed frontend modules. Run them, and run the existing suites for the touched areas. Report the exact commands and results.
10. **Honest reporting.** If something cannot be finished or verified, say so, and mark it **UNVERIFIED** or **NOT DONE**. Never claim a step passes without having run its checks.

---

## 2. PRE-FLIGHT (before Step 1)

1. If `.git/index.lock` exists and no git process is running, stop and ask the user to delete it. Do not force anything.
2. Create a working branch, for example `fix/student-achievement-workflow`. Do not commit to `main`.
3. Record the baseline:
   - `git --no-optional-locks status --short` (summarized);
   - the current results of the backend and frontend test suites.
4. Confirm which database the backend uses locally (`backend/.env`), and whether the migrations referenced below are applied (`php spark migrate:status`). Report the result.

---

## STEP 1 — Reconnect student submission to `student_portfolio_records`

**Goal:** The "Add achievement" flow creates exactly one `student_portfolio_records` row, persists real evidence, and submits it to the coordinator queue. Returned items can be edited and resubmitted from the UI.

### Files

- `frontend/src/pages/student/modals/CanonicalAchievementSubmissionModal.jsx` (rename is optional; keep the export working)
- `frontend/src/pages/student/StudentAchievementsPage.jsx`
- `frontend/src/hooks/useStudentAchievements.js`
- `frontend/src/services/portfolioService.js`
- `backend/app/Controllers/Api/StudentPortfolioController.php`
- `backend/app/Services/PortfolioStructuredMetadataValidator.php` (read; change only if needed)
- `backend/app/Services/StudentAchievementEvidenceUploadPolicy.php`
- `backend/app/Services/StudentEvidenceClamAvScanner.php`
- `backend/app/Services/StudentEvidencePaddleOcrService.php`

### Required behavior

1. **Lazy draft creation.** Do not create a record when the modal opens. Create the draft with `POST /portfolio` (`submit_now: false`) at the first moment it is needed: the first evidence upload or the first "Save draft".
2. **Collect and persist every entered field**, mapped to real `student_portfolio_records` columns: `title`, `organizer_or_body`, `start_date`, `end_date`, `occurrence_date`, `description`, `category_id`, `subcategory_id`, and `structured_metadata`.
   - The "Basic information" inputs must be saved.
   - Category and subcategory choices must come from `GET /portfolio/categories`, which uses the same taxonomy the validator and scoring use.
   - The per-type structured fields must match what `PortfolioStructuredMetadataValidator` expects for that subcategory. Read the validator and derive the fields from its schema; do not hardcode a second schema.
3. **Evidence upload** uses `POST /portfolio/{id}/evidence` (multipart field `file`).
   - Harden the backend handler to use `StudentAchievementEvidenceUploadPolicy`: only PDF, JPEG, or PNG; at most 10 MiB; PDFs at most 2 pages.
   - Keep the existing file cleanup when the DB insert fails.
4. **Scan and OCR for legacy evidence.** Add `POST /portfolio/{id}/evidence/{evidenceId}/scan`:
   - owner only;
   - the record must be in `draft` or `revision_requested`;
   - on a clean result, set `student_portfolio_evidence.security_status='clean'` and `malware_scanner`, then return advisory OCR suggestions;
   - on an infected result, set `security_status='rejected'` and `status='rejected'`;
   - if ClamAV is unavailable, fail closed and leave the status `pending`;
   - add the matching `options` route.
5. **Evidence preview for the owner.** Use the existing `GET /evidence/student/{id}/download` (`portfolioService.downloadEvidence`). Do not add a duplicate endpoint.
6. **Remove evidence while editable.** If no endpoint exists, add `DELETE /portfolio/{id}/evidence/{evidenceId}`:
   - owner only, and the record must be `draft` or `revision_requested`;
   - set the evidence `status='removed'` (soft delete), keep the file, and record who removed it and when, if columns exist;
   - use `EvidencePolicy::canDeleteStudentEvidence`.
7. **Submit** uses `POST /portfolio/{id}/resubmit`. Add this rule to `resubmitRecord()`: at least one evidence row with `status='active'` **and** `security_status='clean'`. The error code is `CLEAN_EVIDENCE_REQUIRED`.
8. **Edit and resubmit of returned items.**
   - `StudentAchievementsPage` passes `editingItem` into the modal.
   - The modal loads that record (`GET /portfolio/{id}`), including its evidence and the latest revision remarks.
   - It saves with `PUT /portfolio/{id}` and resubmits with `/portfolio/{id}/resubmit`.
   - Remove the dead `handleSubmitAchievement`, or make it the single path the modal uses. There must be one path only.
9. **After a successful save or submit**, the modal calls the page's refresh (`refreshData`) so the student list shows the correct status immediately.
10. **Error display.** Show backend error codes and messages accurately. Never show success when the request failed. `saveDraft` errors must stop `submit`.
11. The canonical lifecycle service file and routes may stay in the codebase, but **no UI may call them**. Leave a short comment in the canonical service/controller marking them as parked.

### Acceptance checks

| Check | Expected |
|---|---|
| Open the modal and close it without saving | No new row in `student_portfolio_records` |
| Upload evidence → scan clean → fill fields → submit | One `spr` row, `status='submitted'`, `submitted_at` set; one `submitted`/`resubmitted` event; evidence row `security_status='clean'`; file bytes exist on disk |
| Submit with only pending or infected evidence | 422 `CLEAN_EVIDENCE_REQUIRED` |
| Title, organizer, and dates entered in the UI | Present in the DB row |
| Student list after submit (no reload) | Shows "Pending Review" |
| Returned record → Edit → change → Resubmit | Same `id`, `status='submitted'`, earlier `revision_requested` event still present |
| Student sends `status`, `points`, `verified_by`, or `student_profile_id` in the payload | 422 `PROTECTED_FIELDS_NOT_EDITABLE` |
| Student hits another student's record or evidence | 403 |

---

## STEP 2 — Complete the Program Coordinator review screen

**Goal:** The coordinator can open real evidence and can approve, return, or reject, each through the correct endpoint.

### Files

- `frontend/src/pages/personnel/program-coordinator/CoordinatorDashboardPage.jsx`
- `frontend/src/hooks/useVerification.js`
- `frontend/src/services/portfolioService.js`
- `backend/app/Controllers/Api/StudentPortfolioController.php` (`coordinatorQueue`)
- `backend/app/Services/LocalEvidenceStorageService.php` (`formatSafeEvidence`)

### Required behavior

1. **Queue evidence.** `coordinatorQueue()` must return evidence through `formatSafeEvidence(...)`, so no `storage_path` and no internal hashes are exposed. Only `status='active'` evidence is returned.
2. **View and Download** call `portfolioService.downloadEvidence(evidence.id)` (blob).
   - Render inline PDF/image previews for **every** evidence item, not only the first.
   - Revoke object URLs on close.
   - Show real file name, MIME type, and size from the API. Delete the hardcoded "Validated PDF • ~345 KB" and "Photo Evidence • ~1.2 MB" text.
3. **Record detail** comes from `GET /portfolio/{id}` (record, evidence, event timeline) when the coordinator opens an item.
4. **Add Reject.**
   - `useVerification.handleReject(id, remarks)` → `portfolioService.rejectRecord`.
   - Add a Reject button in both the workspace panel and the review modal.
   - Remarks are required in the UI; the backend already enforces this.
   - Return also requires remarks in the UI.
5. **After each decision**, refresh the queue and close the panel. Show backend errors verbatim, especially 403 and 422.
6. **Remove fake data** from `CoordinatorDashboardPage.jsx`:
   - the "Live Audit Stream" array;
   - hardcoded toast program names;
   - the commented-out fixture blocks.

   Replace the audit stream with real `student_portfolio_verification_events` for the coordinator's scope, **or** remove the section. If you add an endpoint, it must use `StudentPortfolioPolicy` scoping.
7. **Status filters** in the coordinator UI must match the real backend statuses: `submitted`, `revision_requested`, `verified`, `rejected`.

### Acceptance checks

| Check | Expected |
|---|---|
| Coordinator opens evidence of their own program's student | Real file renders |
| Coordinator of another program requests that evidence id | 403 |
| Reject with empty remarks | UI blocks it; direct API call gives 422 `REMARKS_REQUIRED` |
| Reject with remarks | `status='rejected'`, event with remarks, student notification, item leaves the queue |
| Queue response | Contains no `storage_path` |

---

## STEP 3 — Close the security gaps

### Files

- `backend/app/Config/Routes.php`
- `backend/app/Controllers/Api/VerificationQueueController.php`
- `backend/app/Controllers/Api/AchievementController.php`
- `backend/app/Controllers/Api/StudentPortfolioController.php` (`decideRecord`, `resubmitRecord`)
- `backend/app/Services/Policies/StudentPortfolioPolicy.php`
- `frontend/src/services/achievementService.js`

### Required behavior

1. **`POST /verification/{id}/decide`**
   - First search the whole repo for callers, including tests and scripts.
   - If no production caller exists, remove the route and its `options` route.
   - If a caller must remain, make `decide()` delegate to the same logic as `decideRecord()`, with remarks required for return and reject, active clean evidence required for approve, and **no default decision** (a missing decision gives 422).
   - Remove the matching wrappers in `achievementService.js` when they become unused.
2. **`POST /achievements`**: remove it, or make it reject creation of a `submitted` record. It must never skip draft → evidence → resubmit. Same caller search first. `GET /achievements` may stay if it is used; if you keep it, confirm its scope.
3. **Atomic, race-safe decisions.** In `decideRecord()`, the UPDATE must be conditional:
   `UPDATE student_portfolio_records SET … WHERE id = ? AND status = 'submitted'`
   Check affected rows. If 0, roll back, skip the event and the notification, and return 409 `DECISION_ALREADY_RECORDED`.
4. **Approval evidence rule.** Approval requires at least one evidence row with `status='active'` and `security_status='clean'`.
5. **One consistent scope rule.** Make `scopeListQuery`/`scopeVerificationQuery` and `canVerify` use the same program resolution. The student's single active program is authoritative. If a student has more than one active enrollment, resubmission must fail with `AMBIGUOUS_ACTIVE_STUDENT_PROGRAM`, matching the canonical routing rule.
6. **Resubmit routing** must also require exactly one active coordinator for the program; otherwise return 503 `VERIFICATION_ROUTING_UNAVAILABLE`. The notification goes to that coordinator.

### Acceptance checks

| Check | Expected |
|---|---|
| Approve twice, sequentially | Second call: 409, still one `verified` event |
| Two concurrent approve calls (test with two DB connections or a simulated conditional update) | Exactly one succeeds |
| `POST /verification/{id}/decide` | 404 (route removed) **or** same rules as `decideRecord` |
| Student `POST /achievements` | 404/405, **or** cannot produce `status='submitted'` |
| Approve a record whose evidence is not clean | 422 |
| Coordinator from another program | 403 |

---

## STEP 4 — Remove every point value from student-facing surfaces

### Files

- `frontend/src/pages/student/StudentPortfolioPage.jsx`
- `frontend/src/pages/student/modals/ExportPortfolioPreviewModal.jsx`
- `frontend/src/pages/student/StudentDashboardPage.jsx`
- `backend/app/Controllers/Api/AwardEvaluationController.php` (`listAwards`, `showAward`)
- `backend/app/Services/Policies/AwardPolicy.php`

### Required behavior

1. **StudentPortfolioPage**
   - Delete the "Points" tile.
   - Compute Total, Verified, Pending, and per-category counts from real `/portfolio` data. There must be no hardcoded numbers.
   - Remove the hardcoded experiences, skills, and profile fallbacks, or clearly source them from real profile data. If no backend source exists, hide the section instead of showing fake content.
2. **ExportPortfolioPreviewModal**
   - Delete `DEFAULT_PORTFOLIO_ACHIEVEMENTS` and all `points`/"Points Conferred" UI.
   - Receive real verified achievements from `StudentPortfolioPage` via the `achievements` prop.
   - Initialise `selectedIds` from the real IDs.
   - The export shows only verified records.
3. **StudentDashboardPage**: replace the hardcoded timeline and "Maria Santos" fallback with real `/portfolio` data, or render an empty state. No fabricated achievements.
4. **Award rubric endpoints.** `GET /osad/awards` and `GET /osad/awards/{id}` must not return point values to students. Choose one:
   - (a) require `canViewAwardEvaluation`; or
   - (b) for non-OSAD actors, return a catalog view with point, max, rule, and score fields removed.

   First check which non-OSAD frontend screens call these endpoints, and keep them working.
5. **Automated privacy test.** Add a backend feature test: authenticate as a student and call every student-reachable endpoint used by the student pages (`/portfolio`, `/portfolio/{id}`, `/portfolio/categories`, `/notifications`, `/osad/awards`, `/student/profile`, evidence endpoints). Recursively assert that no response key matches `/(points|score|total_points|awarded_points|raw_score|potential_score|max_points|weight)/i`.
6. **Frontend test.** Add a Vitest test that renders the student pages and asserts no "Points" or "Score" text appears.

### Acceptance checks

- Both privacy tests pass.
- A manual search of `frontend/src/pages/student` for `points|score` returns no user-visible usages.

---

## STEP 5 — Single scoring engine, fixed inputs

**Goal:** One authoritative engine produces criterion matches and contributions from verified records.

### Decision

Keep **`AwardScoringService` + `AwardEvidenceMappingService`** (engine 2) as the rubric engine. Retire the ad-hoc point logic in `AwardEvaluationService`.

### Files

- `backend/app/Services/AwardEvidenceMappingService.php`
- `backend/app/Services/AwardScoringService.php`
- `backend/app/Services/AwardEvaluationService.php`
- `backend/app/Services/AwardReviewService.php`
- `backend/app/Services/AwardCandidateGenerationService.php`
- `backend/app/Services/AwardEvaluationSummaryService.php`
- `backend/app/Services/AwardPotentialCandidateService.php`
- `backend/app/Controllers/Api/AwardEvaluationController.php`

### Required behavior

1. **Fix the input.** Where `mapStudentEvidenceForAward` loads records itself, join the taxonomy tables:

   ```sql
   SELECT spr.*, pc.code AS category_code, ps.code AS subcategory_code
   FROM student_portfolio_records spr
   JOIN portfolio_categories pc ON pc.id = spr.category_id
   LEFT JOIN portfolio_subcategories ps ON ps.id = spr.subcategory_id
   WHERE spr.student_profile_id = ? AND spr.status = 'verified'
   ```

   Use the query builder with bound parameters and delete the string-concatenated `mysqli` fallback queries. Verify the actual `portfolio_categories.code` values used in the DB/seeders match the codes the mapping service compares against (`LEADERSHIP_POSITION`, `SPORTS`, `CAMPUS_JOURNALISM`, …). Report any mismatch; do not silently remap.
2. **Remove the wrong-criterion fallback.** `findCriterionByCode()` must return `null` when nothing matches, not `$criteria[0]`. An unmatched record is `CATEGORY_NOT_RELEVANT` and contributes 0. Also remove the `'crit-…'` string placeholder criterion IDs; a match must reference a real `award_criteria.id` or not exist.
3. **Keep multi-criteria matching.** Where a record legitimately satisfies several criteria or components, keep every match. The duplicate guard must key on each (criterion, component, source activity) separately.
4. **Retire the invented points** in `AwardEvaluationService::evaluateStudentAward`:
   - the `15.0` per-record fallback;
   - the `10.0` rule fallbacks;
   - flat per-record summing that ignores `rule_type`.

   `evaluateStudentAward` must call `AwardScoringService::scoreStudentForAward` and persist its criteria, components, and contributions. Do not duplicate the persistence logic in several services; create one persistence method and reuse it.
5. **Points come only from:**
   - `award_criteria.max_points`;
   - `award_scoring_rules.points`, `max_points`, `rule_config`;
   - the rubric constants already in `AwardScoringService`.

   Do not invent new values. If a constant in `AwardScoringService` conflicts with a DB rule value, **do not choose one silently**; list every conflict in the step report for OSAD/adviser decision.
6. **Uniqueness.** Add a migration with a UNIQUE key on `student_award_evaluations(cycle_id, award_definition_id, student_profile_id)`. First check for existing duplicates and report them; do not auto-delete.
7. **Version binding.** Persist the scoring version used, `award_scoring_model_versions.id` or `active_scoring_version`, on the evaluation row. If no column exists, add it via a new migration.
8. Fix `$actor['profile_id']` to `$actor['profile']['id']` in `AwardEvaluationController` (manual criteria, finalize, recalculate) so the evaluator identity is recorded.

### Acceptance checks (feature tests with seeded fixtures)

| Check | Expected |
|---|---|
| A verified leadership record (e.g. SSG officer) for the Leadership Award | Non-zero match on the leadership criterion via `/osad/awards/{id}/students/{sid}/score` |
| A verified sports record with skill + event level + placement | 3 criterion/component matches, 3 contributions, correct capped total |
| Record matching criteria A and C but not B | A and C contribute, B = 0 |
| A `submitted`, `revision_requested`, or `rejected` record | Excluded |
| Running evaluation twice | Identical result, one evaluation row |
| Output of `/osad/awards/{id}/evaluate` vs `/score` for the same student | Same totals |

---

## STEP 6 — Automatic criterion matching on approval

**Adviser decision placeholder.** Default behavior, unless instructed otherwise: **on approval, compute matches and contributions for every active award in the currently active award cycle.** If there is no active cycle, the approval still succeeds and scoring is deferred (see below).

### Files

- a new `backend/app/Services/ApprovedAchievementScoringService.php`
- `StudentPortfolioController::decideRecord`
- a new migration for the contribution table
- `AwardScoringService` (reuse; do not reimplement)

### Required behavior

1. **New table** `student_achievement_criterion_contributions`. Confirm the name is unused first.

   | Column | Notes |
   |---|---|
   | `id` | PK |
   | `portfolio_record_id` | FK → `student_portfolio_records`, RESTRICT |
   | `award_cycle_id` | FK |
   | `award_definition_id` | FK |
   | `criterion_id` | FK → `award_criteria` |
   | `criterion_component_id` | nullable |
   | `scoring_rule_id` | nullable FK |
   | `scoring_version` | |
   | `mapping_rule` | |
   | `allocated_points` | DECIMAL(10,2) |
   | `basis_snapshot` | JSON |
   | `status` | `active` or `superseded` |
   | `created_by_profile_id` | |
   | `created_at` | |

   Add a **UNIQUE** key on (`portfolio_record_id`, `award_cycle_id`, `criterion_id`, `criterion_component_id`, `scoring_version`). Make the component part of the key null-safe, for example by storing `''` instead of NULL, or by using a generated column.

2. **`ApprovedAchievementScoringService::scoreApprovedRecord(recordId, actorId)`**
   - Asserts the record is `verified`; otherwise throws.
   - Resolves the active cycle.
   - For each active award where the student passes eligibility (`AwardEligibilityService`), runs `AwardScoringService` for that student.
   - Keeps the contributions whose source is this record.
   - Upserts them idempotently. Re-running changes nothing, and previous rows for a changed version are marked `superseded`, never deleted.
   - Returns counts only.
   - Allocated points must equal the engine's post-cap allocation (`contributing_evidence`), not raw component points, so criterion caps across multiple records stay correct. Because caps are per student and criterion, recompute the student's affected awards and re-allocate. Document how this is handled in the step report.

3. **Wiring in `decideRecord()`** for `targetStatus === 'verified'`:
   - The status change, the verification event, and a new `scoring_requested` event are committed **in one transaction**.
   - Then call `ApprovedAchievementScoringService` in its own transaction.
   - If scoring fails:
     - the approval stands;
     - write a `scoring_failed` verification event with the error code, never the stack trace;
     - log it;
     - return 200 with `scoring_status: 'DEFERRED'`, which is visible only to the coordinator, never to the student.
   - Provide an OSAD-only retry endpoint `POST /osad/scoring/records/{id}/rescore` and a spark command `php spark scoring:backfill-verified` that scores every verified record lacking contributions. Both are idempotent.

4. **No scoring on return or reject.** Also, if a verified record is ever moved out of `verified` by an existing path, mark its contributions `superseded`.

5. **Access.** Contribution rows are readable only through OSAD endpoints guarded by `AwardPolicy::canRunAwardEvaluation`. No student, coordinator, or dean endpoint returns them.

6. **Audit.** Every automatic scoring run writes a row, either in `student_portfolio_verification_events` (`action='criteria_scored'`, remarks = counts only, no points) or in an existing audit-log table if one fits. The row records the actor, the record, and the timestamp.

### Acceptance checks

| Check | Expected |
|---|---|
| Approve a qualifying record | `verified` + contribution rows for each matched criterion |
| Approve the same record again | 409, no new contribution rows |
| Return or reject | 0 contribution rows |
| Scoring throws (simulate) | Record remains `verified`, `scoring_failed` event exists, rescore endpoint later creates the rows |
| Backfill command run twice | Same row count |
| Student API responses after approval | Still contain no point fields (Step 4 test passes) |

---

## STEP 7 — Notifications, traceability, cleanup

1. **Notifications**
   - `NotificationController::index` must return `reference_type` and `reference_id`.
   - `NotificationsPage.jsx` maps:
     - `reference_type === 'student_portfolio_records'` for a student → `/student/achievements` with `state.highlightId`;
     - for a coordinator → the coordinator workspace with the item selected.
   - Confirm the real route paths in `App.jsx` and the navigation config before using them.
   - Notification types map to the correct icon or colour: submitted, verified, revision_requested, rejected.
2. **Coordinator notification on submit** must be sent to the single resolved coordinator (Step 3.6) and must be created only after commit.
3. **Dead code removal**, each only after confirming zero imports:
   - `frontend/src/controllers/VerificationController.js`
   - `frontend/src/models/VerificationQueueModel.js`
   - unused wrappers in `achievementService.js`
   - `backend/app/Services/CanonicalStudentAchievementService.php.student06-backup`
   - stray commented fixtures
4. **Docs**
   - Append a "Resolution" section to `docs/STUDENT_ACHIEVEMENT_WORKFLOW_AUDIT_2026-09-30.md` mapping each finding to the commit/step that fixed it, or marking it OPEN.
   - Document the parked canonical system and the conditions for resuming it.

---

## 3. FINAL END-TO-END VERIFICATION (after Step 7)

Run and report all 10 scenarios from the audit with real HTTP calls against a local server and a test database, using seeded accounts: one student, a coordinator of the student's program, a coordinator of another program, and one OSAD admin.

1. Submit → coordinator approves → contributions created → student portfolio shows the item after a fresh login → no point fields anywhere in the student's responses.
2. Three-criteria record → three contributions, correct aggregate, no duplicates.
3. Some criteria not applicable → only applicable ones contribute.
4. Return → no contributions → student edits and resubmits → back in the queue.
5. Reject → no contributions → student sees remarks.
6. Double approve → one approval, one scoring run.
7. Student payload `{ "points": 999, "status": "approved" }` → 422.
8. Student calls score/total endpoints → 403, and rubric endpoints expose no points.
9. Cross-program coordinator approve → 403.
10. Restart backend and frontend → log in again → verified item still present.

Deliver a final report with:

- the changed files list;
- migrations added;
- endpoints added and removed;
- test commands and results;
- scenario results table (PASS / FAIL / UNVERIFIED);
- open issues, including any rubric-value conflicts needing OSAD or adviser decision.

**Do not declare the workflow complete unless all 10 scenarios pass with evidence.**
