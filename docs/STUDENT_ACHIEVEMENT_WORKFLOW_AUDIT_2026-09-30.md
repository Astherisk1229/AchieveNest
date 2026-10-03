# AchieveNest — Student Achievement → Program Coordinator → Portfolio → OSAD Points Workflow Audit

**Audit type:** Static source audit, read-only. No code, database, or configuration was modified.
**Audited tree:** Current local working tree at `<REPO_ROOT>` (HEAD `160bcb0` plus **518 uncommitted/untracked paths**). The untracked canonical-lifecycle files dated 2026-09-29 are part of the running UI and were audited as current source.
**Evidence standard:** Every claim cites a file and, where useful, a line. Nothing was executed against a live database, so runtime-only facts (applied migrations, seeded rows, ClamAV installed) are marked **UNVERIFIED**.

---

## Summary in one paragraph

The current tree contains **two separate student-achievement systems that do not connect**:

1. **Canonical lifecycle (new, untracked)**: `achievement_records` / `achievement_record_versions` / `achievement_evidence` / `student_achievement_verification_routes`. **The student "Add achievement" UI now writes here.**
2. **Legacy portfolio model**: `student_portfolio_records` / `student_portfolio_evidence` / `student_portfolio_verification_events`. **The student achievement list, the Program Coordinator queue, the approve, return, and reject endpoints, the Student Portfolio, and both OSAD scoring engines read only this model.**

A submission made through the current student UI is routed to a coordinator **in a table that nothing reads**. It never appears in the coordinator queue, the student's own list, or the portfolio. Separately, **approval never triggers OSAD criterion matching or scoring.** Scoring runs only when an OSAD administrator triggers it manually, through one of two engines that disagree with each other. One of them cannot classify database-loaded records at all.

---

## A. Executive Verdict

| Question | Verdict | Deciding evidence |
|---|---|---|
| Can the student submit an achievement to the Program Coordinator? | **PARTIALLY** | The UI submit persists the draft, evidence, and a coordinator route (`CanonicalStudentAchievementDraftService::submit` → `StudentAchievementRoutingService::routeSubmittedVersion`). No coordinator-facing code reads `student_achievement_verification_routes`, so the submission reaches no one. |
| Can the correct Program Coordinator receive and review it? | **NO** for UI submissions. **PARTIALLY** for legacy `student_portfolio_records` rows. | The queue (`StudentPortfolioController::coordinatorQueue`) queries only `student_portfolio_records`. Even for legacy rows, the coordinator UI shows a filename only; its View and Download controls never fetch the file. |
| Can the coordinator return it for revision? | **PARTIALLY** | The backend works for legacy rows (`/portfolio/{id}/request-revision`, remarks required). The student cannot edit or resubmit from the UI because the modal ignores `editingItem`. |
| Can the coordinator reject it? | **PARTIALLY (backend only)** | `POST /portfolio/{id}/reject` exists and requires remarks. `useVerification` has no reject handler and the coordinator page has no Reject button. |
| Can the coordinator approve it? | **PARTIALLY** | This works end-to-end for legacy rows (`/portfolio/{id}/verify`). There is no approval path at all for canonical submissions. |
| Does approval automatically invoke OSAD criterion matching? | **NO** | `decideRecord()` updates status, writes the event and a notification, and nothing else. No event, hook, trigger, or queue calls a scoring service. |
| Can one achievement receive multiple applicable criterion contributions? | **PARTIALLY** | `AwardEvidenceMappingService` emits `matched_criteria[]` for the Sports and Socio-Cultural families, and `AwardEvaluationService` loops every criterion. This only happens when OSAD runs it manually. The Phase-5 engine cannot classify DB-loaded records (see F). |
| Are points derived automatically from authoritative OSAD rules? | **NO** | Scoring is manual and OSAD-triggered. The two engines are inconsistent. One has a hardcoded **15 points per record** fallback, and the other hardcodes its point matrices in PHP. |
| Does the approved achievement automatically appear in the student's portfolio? | **PARTIALLY** | A verified legacy row appears through a status projection (`GET /portfolio?status=verified`). Canonical submissions never can. |
| Can the student see it after a fresh login? | **PARTIALLY** | Legacy: yes, because it is database-backed and has no local storage. Canonical: no. |
| Are all point values hidden from the student? | **PARTIALLY** | No real student score is returned to students (OSAD-gated). However, the Student Portfolio page renders a hardcoded **"30 Points"**, the Export modal shows demo **"Points Conferred"**, and `GET /osad/awards` and `/osad/awards/{id}` return rubric point values to any authenticated user, including students. |

---

## B. End-to-End Flow Diagram (as actually implemented)

```text
STUDENT (StudentAchievementsPage → CanonicalAchievementSubmissionModal)
  ✅ POST /student/achievements/drafts          → achievement_records + achievement_record_versions(draft)
        ⚠ a new draft row is created EVERY time the modal opens
  ✅ POST /student/achievements/{id}/evidence   → bytes stored under WRITEPATH/uploads/evidence, achievement_evidence(pending)
  ✅ POST .../evidence/{eid}/scan               → ClamAV → security_status=clean   (⚪ ClamAV runtime UNVERIFIED)
  🟡 PUT  /student/achievements/{id}            → contract_code + contract fields only
        🔴 "Basic information" (title, dates, venue, organizer) is NEVER sent
  ✅ POST /student/achievements/{id}/submit     → detail table INSERT → routeSubmittedVersion()
                                                   → student_achievement_verification_routes(routed, coordinator_profile_id)
        🔴 BROKEN HERE: no queue, controller, or UI reads student_achievement_verification_routes
        🔴 the student's own list reads /portfolio (legacy) → the submission is invisible to the student too

PROGRAM COORDINATOR (CoordinatorDashboardPage → useVerification)
  🟡 GET /program-coordinator/verification-queue → student_portfolio_records ONLY (scoped by program)
  🔴 View/Download evidence → filename text only; Download has no onClick; no call to /evidence/student/{id}/download
  ✅ Approve  → POST /portfolio/{id}/verify          → status=verified, verification event, notification
  ✅ Return   → POST /portfolio/{id}/request-revision → status=revision_requested (remarks required)
  🟠 Reject   → backend only; no UI control

ON APPROVAL
  🔴 No criterion matching, no scoring, no contribution rows written

OSAD (manual, separate)
  🟡 POST /osad/awards/{id}/evaluate → AwardEvaluationService → student_award_evaluations / _criterion_scores / _score_evidence
  🔴 GET  /osad/awards/{id}/students/{sid}/score|basis|review → AwardScoringService → mapping reads spr rows with NO category_code → nothing is relevant

STUDENT PORTFOLIO (StudentPortfolioPage)
  ✅ GET /portfolio?status=verified → verified legacy rows rendered as "featured achievements"
  🟣 stats (5/3/1/"30 Points"), experiences, skills: hardcoded
  🟣 Export modal: DEFAULT_PORTFOLIO_ACHIEVEMENTS demo data with points; window.print()
```

---

## C. Wiring Matrix

| Stage | Frontend | API | Backend | DB | Status |
|---|---|---|---|---|---|
| Create draft | `CanonicalAchievementSubmissionModal.jsx` `useEffect` → `studentAchievementLifecycleService.createDraft` | `POST /student/achievements/drafts` | `StudentAchievementLifecycleController::create` → `CanonicalStudentAchievementDraftService::create` | INSERT `achievement_records`, `achievement_record_versions` (transaction) | 🟡 Wired, but creates an orphan draft on every modal open |
| Basic info (title/date/venue/organizer) | `basicFields` state, lines ~219 | — never sent | — | — | 🔴 Frontend only |
| Contract fields | `saveDraft` (line 103) | `PUT /student/achievements/{id}` | `…DraftService::save` (allow-listed keys) | `achievement_version_draft_fields` | ✅ |
| Upload evidence | `uploadEvidence` | `POST …/{id}/evidence` (multipart) | `…LifecycleController::upload` + `StudentAchievementEvidenceUploadPolicy` | file on disk + `achievement_evidence`, `achievement_version_evidence` | ✅ (inserts not transactional) |
| Scan evidence | `scanEvidence` | `POST …/evidence/{eid}/scan` | ClamAV + PaddleOCR | UPDATE `achievement_evidence.security_status` | ⚪ Runtime unverified |
| Submit | `submit()` line 188 | `POST …/{id}/submit` | `…DraftService::submit` → `StudentAchievementRoutingService` | detail table, `student_achievement_verification_routes`, `student_achievement_routing_events` | 🟡 Persists, but no consumer |
| Student list | `useStudentAchievements.refreshData` | `GET /portfolio` | `StudentPortfolioController::index` | `student_portfolio_records` | 🔴 Disconnected from canonical submissions |
| Coordinator queue | `useVerification.refreshQueue` | `GET /program-coordinator/verification-queue` | `StudentPortfolioController::coordinatorQueue` | `student_portfolio_records` + `student_program_enrollments` | 🟡 Legacy only |
| Coordinator evidence view | `CoordinatorDashboardPage` ~l.946–1005, ~1820 | none called | `EvidenceController::studentDownload` exists | `student_portfolio_evidence` | 🟠 Backend only |
| Approve | `handleApprove` → `portfolioService.verifyRecord` | `POST /portfolio/{id}/verify` | `decideRecord('verified')` | UPDATE spr, INSERT `student_portfolio_verification_events`, `notifications` | ✅ Legacy only |
| Return | `handleReturn` → `requestRevision` | `POST /portfolio/{id}/request-revision` | `decideRecord('revision_requested')` | same | ✅ Legacy backend, 🔴 student resubmit UI |
| Reject | none | `POST /portfolio/{id}/reject` | `decideRecord('rejected')` | same | 🟠 Backend only |
| Alt decision endpoint | none | `POST /verification/{id}/decide` | `VerificationQueueController::decide` | same, no notification | ⚫ Unused, but reachable (weaker rules) |
| Criterion matching on approval | — | — | — | — | 🔴 Absent |
| Scoring (engine 1) | OSAD pages | `POST /osad/awards/{id}/evaluate` | `AwardEvaluationService::evaluateStudentAward` | `student_award_evaluations`, `student_award_criterion_scores`, `student_award_score_evidence`, `award_interview_eligibilities` | 🟡 Manual, OSAD-only |
| Scoring (engine 2) | OSAD pages | `…/score`, `…/scoring-basis`, `…/review`, `…/recalculate` | `AwardScoringService` via `AwardEvidenceMappingService` | reads spr; review persists via `AwardReviewService` | 🔴 Cannot classify DB rows |
| Student portfolio | `StudentPortfolioPage` l.83 | `GET /portfolio?status=verified` | `index()` + `stripStudentScoringFields` | spr | 🟡 Real list + mock stats/export |
| Notifications | `NotificationsPage` | `GET /notifications` | `NotificationController::index` | `notifications` | 🟡 Created, but not navigable |

---

## D. Detailed Technical Trace

### D1. Student clicks "Submit achievement" (current UI)

```text
StudentAchievementsPage.jsx:5
  import AchievementSubmissionModal from './modals/CanonicalAchievementSubmissionModal'   (changed vs HEAD, which imported the legacy modal)
StudentAchievementsPage.jsx:597
  <AchievementSubmissionModal isOpen onClose />      ← no onSubmit / editingItem props
CanonicalAchievementSubmissionModal.jsx:188 submit()
  → saveDraft()  (swallows its own errors; submit continues)
  → studentAchievementLifecycleService.submit(recordId)
  → POST /api/v1/student/achievements/{id}/submit           (Routes.php:508)
  → StudentAchievementLifecycleController::submit
       actor(): AuthorizationService::resolveActor + account_type === 'student'
  → CanonicalStudentAchievementDraftService::submit (line 39)
       editable(): state ∈ {draft, revision_requested} AND owner_profile_id = actor
       normalizeDetailPayload(contract, draft_fields)
       require ≥1 evidence WHERE status='active' AND security_status='clean'
       INSERT {detailTable}(record_version_id,…)                ← outside any transaction
  → StudentAchievementRoutingService::routeSubmittedVersion
       resolveCoordinator(): student_program_enrollments(is_active=1, program active)
         → exactly 1 program → program_coordinator_assignments(is_active=1, profile active)
         → exactly 1 coordinator, else routing_pending
       transStart
         UPDATE achievement_record_versions SET submission_state='submitted'|'routing_pending', locked_at
         UPSERT student_achievement_verification_routes
         INSERT student_achievement_routing_events
       transComplete
  ← {routing_status:'routed', coordinator_profile_id…}
Modal shows "Submitted for verification."
```

**BROKEN HERE.** A search across `backend/app` and `frontend/src` finds only two references to `student_achievement_verification_routes`: its own migration (`2026-09-29-000021`) and `StudentAchievementRoutingService`. **No reader exists.** There is also no notification to the coordinator on this path.

### D2. Program Coordinator loads the queue

```text
CoordinatorDashboardPage.jsx:269 useVerification()
  → portfolioService.fetchCoordinatorQueue()
  → GET /api/v1/program-coordinator/verification-queue      (Routes.php:530)
  → StudentPortfolioController::coordinatorQueue (line 980)
       programIds = authz.getCoordinatorProgramIds(actor)   ← from program_coordinator_assignments.is_active=1
       SELECT spr.*, … FROM student_portfolio_records spr
         JOIN student_program_enrollments spe ON … is_active=1
         WHERE spr.status IN ('submitted','revision_requested')
       + StudentPortfolioPolicy::scopeVerificationQuery
            → spr.student_profile_id IN (enrollments in coordinator programs) AND ≠ actor
       evidence rows attached raw (includes storage_path, sha256)
```

This is scoped server-side and is correct for legacy rows. It **cannot** contain canonical submissions.

### D3. Coordinator clicks "Approve & Verify"

```text
CoordinatorDashboardPage.jsx:1862 → handleApprove → useVerification.handleApprove
  → portfolioService.verifyRecord(id, remarks) → POST /api/v1/portfolio/{id}/verify   (Routes.php:520)
  → StudentPortfolioController::verifyRecord → decideRecord(id,'verified','verified') (line 1054)
       status must be 'submitted' (l.1068)
       StudentPortfolioPolicy::canVerify: not self, status='submitted',
            student's latest active enrollment program ∈ coordinator programs
       for 'verified': ≥1 student_portfolio_evidence.status='active'
       transStart
         UPDATE student_portfolio_records SET status='verified', verified_at
         INSERT student_portfolio_verification_events(actor, action, previous_status, new_status, remarks, occurred_at)
       transComplete
       INSERT notifications (outside the transaction; failure swallowed)
  ← 200
  ─── automatic criterion matcher: NOT CALLED (no code path exists)
```

### D4. Student opens the portfolio

```text
StudentPortfolioPage.jsx:83 portfolioService.fetchRecords({status:'verified'})
  → GET /api/v1/portfolio?status=verified → StudentPortfolioController::index
       scopeListQuery: account_type='student' → spr.student_profile_id = actor
       stripStudentScoringFields() per record
  → featuredAchievements = verifiedAchievements.map(...)   (line 165)
```

This is a projection of the single `student_portfolio_records` row by status. There is no separate portfolio table, so there is no duplicate or stale copy. Rejected and returned rows never display.

---

## E. Program Coordinator Authorization Audit

**How the coordinator is determined (server-side):**
`student_program_enrollments(student_profile_id, academic_program_id, is_active, effective_from)` → `program_coordinator_assignments(academic_program_id, personnel_profile_id, is_active)`. The actor's coordinator scope is loaded in `AuthenticatedActorService::resolveActor` (lines ~96–106), and students cannot choose a reviewer on any path.

| Check | Result | Evidence |
|---|---|---|
| Coordinator sees only own-program students | ✅ Legacy queue | `scopeVerificationQuery` subquery on active enrollments |
| Cross-program approve blocked | ✅ | `canVerify` compares the student's *latest* active program with the coordinator's programs, so a cross-program attempt returns 403 |
| Self-verification blocked | ✅ | `canVerify` Rule 1 |
| Student cannot pick a coordinator | ✅ | No reviewer field is accepted, and `PROTECTED_STUDENT_FIELDS` rejects `verifier_id`/`verified_by` |
| OSAD can view the queue but cannot decide | ✅ | `scopeVerificationQuery` allows OSAD; `canVerify` requires a coordinator assignment |
| Consistency of scope | 🟡 | Queue/list scope uses *any* active enrollment; `canVerify` uses the *latest*. A student with two active enrollments can appear in a queue whose coordinator then gets 403. Canonical routing refuses ambiguity (`AMBIGUOUS_ACTIVE_STUDENT_PROGRAM`); legacy does not. |
| Canonical routing correctness | ✅ | Unique program and unique active coordinator required; otherwise `routing_pending` |
| Canonical coordinator access to routed items | 🔴 | No endpoint exists |

---

## F. OSAD Automatic Criterion Matching Audit

**Finding: no automatic matching occurs on approval.** Neither `decideRecord()` nor `VerificationQueueController::decide()` calls any award service. `Config/Events.php` registers only `pre_system` and the toolbar. The only DB triggers related to scoring are `trg_verified_award_score_evidence` and `trg_calculate_portfolio_potential_score` in PostgreSQL-era migrations (`2026-08-27-000020`, `-000025`); they validate or derive, and they do not match criteria. These use PostgreSQL syntax, and whether they exist in the running MySQL DB is **UNVERIFIED**.

**Criteria sources that actually exist:**

| Source | Used by |
|---|---|
| `award_definitions`, `award_criteria` (`max_points`, `is_portfolio_computable`) | both engines |
| `award_scoring_rules` (`rule_type`, `points`, `max_points`, `rule_config`) | engine 1 (`AwardEvaluationService`) |
| `award_portfolio_mappings`, `award_evidence_mapping_rules` (category/subcategory → rule/criterion) | engine 1 |
| PHP constants and `if/elseif` on award/criterion codes (`SPORTS_AWARDS_MATRIX`, `SOCIO_AWARDS_MATRIX`, per-award component calls) | engine 2 (`AwardScoringService`) |
| String heuristics on titles and codes (`str_contains($critCode,'LEAD')`, title contains "editor") | engine 2 mapping (`AwardEvidenceMappingService`) |

**Critical defect in engine 2.** `AwardEvidenceMappingService::mapStudentEvidenceForAward` loads records with `SELECT * FROM student_portfolio_records` (line ~81), then classifies with `$rec['category_code'] ?? $rec['category']` (line 214). That table has **no `category_code` or `category` column** (`000001_schema.sql`: only `category_id`, `subcategory_id`), and no migration adds one. As a result `$catCode === ''`, so every production record falls to `CATEGORY_NOT_RELEVANT` and scores 0. The `VerifySA01ValidationCases` command passes preloaded arrays with `category_code` set, which hides this. Callers that pass no records and are therefore affected: `AwardEvaluationController` lines 822, 858, 894 and `AwardReviewService` lines 69 and 72.

**Engine 1** matches by `category_id`/`subcategory_id` against mapping tables, so it can match production rows.

---

## G. Multi-Criteria Audit

| Mechanism | Multiple criteria per achievement? | Evidence |
|---|---|---|
| Engine 2: Sports / Socio-Cultural | ✅ Yes, within one award | `matched_criteria[]` built from skills/level/placement (mapping service ~l.290–390) |
| Engine 2: Leadership, Church, Community, Citation, Membership | ❌ One criterion per award | a single `matched_criterion_id` |
| Engine 2: fallback | ⚠ Wrong-criterion risk | `findCriterionByCode()` returns `$criteria[0]` when nothing matches (l.612), so an unmatched record is attributed to the **first** criterion |
| Engine 2: duplicate guard | 🟡 | Uses `seenSubsectionKeys` keyed on the first matched criterion, even when several are matched |
| Engine 1 | ✅ Yes | Outer loop per criterion; `usedRecordIds` resets per criterion, so one record may contribute to each applicable criterion. Within a criterion, a record counts once. |
| Across awards | ✅ | Each award is evaluated independently |
| Contribution persistence | 🟡 | Engine 1 persists one `student_award_score_evidence` row per (criterion_score, record) under `UNIQUE(criterion_score_id, portfolio_record_id)`. Engine 2's `contributions` are returned in the response; persistence depends on `AwardReviewService`. |

The verdict is PARTIALLY: the schema and engine 1 can represent one achievement contributing to many criteria, but only through a manual OSAD run, and never automatically.

---

## H. Points Calculation Audit

**Engine 1 (`AwardEvaluationService::evaluateStudentAward`)**, as it appears in source:

- Criterion **without** scoring rules: `$pointsPerRecord = 15.0; // Standard 15 points per verified record up to max` (line 147). Categories are chosen by `str_contains` heuristics on the criterion code. **This is not an OSAD rule.**
- Criterion **with** rules: `$rulePoints = (float)($rule['points'] ?? 10.0)` (l.178), then `$pointsToAdd = $rulePoints > 0 ? $rulePoints : 10.0` (l.216). This is added per matching record and capped at `rule.max_points`, then at `criterion.max_points`. **`rule_type` (highest_only, matrix_mapping, count_mapping…) and `rule_config` are ignored**, so a "highest only" rule is summed.
- Total: `potential % = raw / Σ computable max × 100`; if the max is 0 it silently becomes 100 (l.~257).
- Recalculation deletes and re-inserts child rows inside a transaction. `student_award_evaluations` has **no UNIQUE(cycle_id, award_definition_id, student_profile_id)**, so concurrent runs can insert duplicates.

**Engine 2 (`AwardScoringService::scoreCriterion`)** hardcodes award-specific values in PHP. Examples: leadership `SSG 10 / Council 8 / Club 6 / Year-level 4`; `SPORTS_AWARDS_MATRIX` (e.g. PRISAA National Gold 7.0); journalism column 4 per item, cap 20. Criterion max comes from `award_criteria.max_points`. Reconciliation checks throw if allocations do not sum.

| Question | Answer |
|---|---|
| Hardcoded? | Engine 2: yes (PHP). Engine 1: 15/10-point fallbacks are hardcoded. |
| Authoritative DB configuration? | Partly (`award_criteria.max_points`, `award_scoring_rules.points`) |
| Coordinator can override? | No. Coordinators have no award endpoints (`AwardPolicy::canRunAwardEvaluation` requires `osad_admin` + `osad_staff`). |
| Student can alter? | No. Points are never stored on the achievement; `/portfolio` rejects `points`, `award_score`, and `candidate_score` (`PROTECTED_STUDENT_FIELDS`). |
| Frontend values trusted? | No. The server recomputes. |
| Versions/cycles respected? | Engine 1 is cycle-scoped. Neither engine persists the `award_scoring_model_versions` id used, so a recalculation after criteria change silently rewrites historical results. |
| Caps? | Yes, in both engines (different semantics) |
| Duplicate achievements double-scoring? | Engine 1: once per criterion. Engine 2: subsection key guard. Duplicate *records* (same event entered twice) are guarded only at legacy resubmit (`DUPLICATE_ACHIEVEMENT`), not on `POST /achievements`. |
| Two engines agree? | **No.** They can return different scores for the same student and award, and both write `student_award_evaluations`. |

---

## I. Student Point-Privacy Audit

| Surface | Contains point values? | Verdict |
|---|---|---|
| `GET /portfolio`, `GET /portfolio/{id}` (student) | No. The table has no score columns, and `stripStudentScoringFields` removes keys matching score/points/award/candidate/weight. | ✅ |
| `GET /student/achievements/{id}` | No score fields in the canonical tables | ✅ |
| `/osad/awards/{id}/students/{sid}/*` (score, basis, review, eligibility), `/osad/candidates`, `/awards/campus-journalism/*` | OSAD-only (`canViewAwardEvaluation` → `canRunAwardEvaluation`), so a student gets 403 | ✅ |
| `GET /osad/awards` (`listAwards`) and `GET /osad/awards/{id}` (`showAward`) | Only `resolveActor()` is checked, so **any authenticated student** receives criteria, `max_points`, rule point mappings, and `computable_max_score` | 🟡 **Info exposure (rubric points, not the student's own score)** |
| `StudentPortfolioPage.jsx` ~l.640–646 | Hardcoded tile `30` / "Points" | 🔴 Visible to students (fake value) |
| `ExportPortfolioPreviewModal.jsx` l.23–91, 136, 332–333 | Demo achievements with `points: 10/10/10/5`; renders "Points Conferred"; `StudentPortfolioPage` does not pass `achievements`, so the demo is always used; print via `window.print()` | 🔴 Visible and printable |
| `StudentDashboardPage.jsx` | Entirely hardcoded demo timeline; no point tile found | 🟣 Mock, no points |
| `notifications` | No points | ✅ |
| Hidden HTML / data attributes | None found in student pages | ✅ |

The backend does not leak a student's real score to that student. The UI does display fabricated point totals, and any student can fetch rubric point values.

---

## J. Portfolio Persistence Audit

- **Architecture:** Option B, a projection. The portfolio is `student_portfolio_records WHERE status='verified'` for the owner. There is no separate portfolio table, so no duplicate or stale copy can exist.
- **Persistence across sessions:** Yes for legacy rows. `useStudentAchievements` and `StudentPortfolioPage` read only from the API, and there is no localStorage in these paths (`StudentAchievementController.js` header comment; code confirms).
- **Non-approved rows excluded:** Yes (status filter plus a client filter `record.status === 'verified'`).
- **Rejected/deleted rows:** Never shown. There is no un-verify or revoke path for a verified record.
- **Scenario 10 (new-session persistence):** PASS for a legacy verified record. **FAIL for anything submitted through the current UI**, which never reaches `student_portfolio_records`.
- **Other writers of verified rows:** `EventSourceRecordBridgeService` (line ~138) inserts `status='verified'` records directly for event participants (OSAD/organizer-managed events), bypassing coordinator review. This is a separate institutional path and is noted for completeness.

---

## K. Dummy / Mock / Hardcoded Findings

| File | Variable/Function | Dummy data | User-visible? | Production reachable? | Risk |
|---|---|---|---|---|---|
| `pages/student/StudentDashboardPage.jsx` | `student` fallback, `allTimelineItems` | Maria Santos, Dean's Lister, SSC President… | Yes | Yes | High: the student dashboard shows fabricated achievements |
| `pages/student/StudentPortfolioPage.jsx` | `student` fallback, `experiences`, `skills`, stat tiles (5/3/5/2, 5/3/1/**30 Points**) | Hardcoded | Yes | Yes | High: fake counts and fake points |
| `pages/student/modals/ExportPortfolioPreviewModal.jsx` | `DEFAULT_PORTFOLIO_ACHIEVEMENTS`, `selectedIds [1,2,3,4]` | 4 demo achievements with points and named verifiers ("Prof. Juan Dela Cruz") | Yes, and printed | Yes (always used) | High |
| `pages/personnel/program-coordinator/CoordinatorDashboardPage.jsx` ~l.78–182 | legacy queue/roster fixtures | Maria Santos, Juan Dela Cruz | No (commented out) | No | Low |
| same, ~l.430–470 | "Live Audit Stream" array | "Approved … by Maria Santos", "John Doe" | Yes | Yes | Medium: fake activity feed |
| same, ~l.955, 987 | "Validated PDF • ~345 KB", "Photo Evidence • ~1.2 MB" | Hardcoded file metadata | Yes | Yes | Medium |
| same, l.330 | toast "BS Computer Science verification CSV report downloaded!" | Hardcoded program | Yes | Yes | Low |
| `controllers/VerificationController.js` + `models/VerificationQueueModel` | In-memory queue model | — | No (not used by `useVerification`) | No | Low (dead code) |
| `services/achievementService.js` | `/achievements`, `/verification/*` wrappers | — | No callers | Backend routes reachable | Medium (see L) |
| `backend/app/Services/AwardEvaluationService.php:147` | `$pointsPerRecord = 15.0` | Invented rubric | Via OSAD results | Yes | High |
| Seeders (`DefenseDemoSeeder`, `DemoAcademicStructureSeeder`, `Phase2AchievementContractSeeder`) | Demo transactions vs reference data | Not inspected row-by-row | — | Depends on deploy | ⚪ UNVERIFIED |

Award criteria, categories, and scoring rules seeded by migrations are **reference master data**, not dummy data.

---

## L. Security Findings

| # | Finding | Evidence | Severity |
|---|---|---|---|
| L1 | **`POST /verification/{id}/decide` is a weaker parallel decision endpoint.** The decision defaults to `'approved'` when omitted (l.114). It requires **no remarks** for reject or return, performs **no evidence check** before approval, and sends no notification. `canVerify` still enforces `submitted` status and coordinator scope. | `VerificationQueueController.php:99–160` | High |
| L2 | **`POST /achievements` lets a student create a `submitted` record with no evidence, no subcategory, and a fallback "first active category"** (l.156). Combined with L1, a coordinator can approve it with zero evidence, and it then feeds engine 1 scoring by `category_id`. | `AchievementController.php:108–219` | High |
| L3 | Student payload manipulation (`status`, `verification_status`, `points`, `award_score`, `verifier_id`, `student_profile_id`) on `/portfolio` returns 422 `PROTECTED_FIELDS_NOT_EDITABLE` | `StudentPortfolioController.php:21–25, 67–79` | ✅ Pass |
| L4 | Canonical draft fields are allow-listed per contract and must be scalar; state cannot be set by the client | `CanonicalStudentAchievementDraftService::save` | ✅ Pass |
| L5 | Cross-student portfolio access: `canView` means owner, OSAD, scoped coordinator, or scoped dean. The `student_profile_id` query param is ignored for students. | `StudentPortfolioPolicy.php` | ✅ Pass |
| L6 | Evidence download requires owner or `canView` on the parent record; files are stored under `WRITEPATH` with UUID filenames and served `private, no-store` | `EvidenceController::studentDownload`, `LocalEvidenceStorageService` | ✅ Pass |
| L7 | Rubric point configuration is readable by students (`listAwards`, `showAward`) | `AwardEvaluationController.php:90–195` | Medium |
| L8 | Coordinator queue returns raw evidence rows including `storage_path` and `sha256` (not passed through `formatSafeEvidence`) | `coordinatorQueue()` | Low |
| L9 | Duplicate approval: a second call returns 403 (status no longer `submitted`). Two **concurrent** calls can both pass the check, because the UPDATE is not conditional on `status='submitted'`, producing two events and two notifications. No points are affected, since scoring is not triggered. | `decideRecord()` | Low |
| L10 | Legacy evidence is never malware-scanned (`malware_scanner='none_deferred'`), allows `.doc`/`.docx`, and submission/approval do not require `security_status='clean'` | `StudentPortfolioController::addEvidence`, `LocalEvidenceStorageService::ALLOWED_EXTENSIONS_MAP` | Medium |
| L11 | Coordinators and students cannot modify OSAD criteria. No controller writes `award_criteria` or `award_scoring_rules`; OSAD can change only `candidate_threshold`. | grep of `Controllers/Api` | ✅ Pass |
| L12 | Manual-criteria endpoints pass `$actor['profile_id']`, a key that does not exist (the actor exposes `$actor['profile']['id']`), so the evaluator identity is recorded as null | `AwardEvaluationController.php` saveManualCriteria/finalize/recalculate | Medium (audit trail) |

---

## M. Broken / Missing Connections

1. **Canonical submission has no consumer.** `student_achievement_verification_routes` is written but never read by any queue, API, or UI. *(Core blocker)*
2. **The student list reads the legacy table**, so newly submitted achievements are invisible to the student who submitted them.
3. **The "Basic information" inputs are never persisted.** `basicFields` is not included in the `saveDraft` payload, and its keys (`activity_title`, `start_date_raw`, `venue`, `organizer_granting_body`) are not contract fields.
4. **A new canonical draft is created every time the modal opens**, leaving orphan draft rows.
5. **The modal ignores `editingItem`/`onSubmit`.** `handleSubmitAchievement` (StudentAchievementsPage l.114) is dead code, so Edit and Resubmit of Returned items open a blank new draft.
6. **The modal does not refresh the page list on close or submit.**
7. **The canonical lifecycle has no approve, return, or reject states or services.** The CHECK allows `draft, routing_pending, submitted, revision_requested, resolved`, and nothing writes `resolved` or `revision_requested`. `achievement_verification_events` and `achievement_field_resolutions` have no service writers.
8. **The canonical submit is not atomic.** The detail-table INSERT happens before, and outside, the routing transaction. If routing fails, the retry hits the detail table's `PRIMARY KEY(record_version_id)` and the draft is stuck.
9. **The canonical path sends no coordinator notification.**
10. **The coordinator cannot open evidence.** Download has no handler, View shows a filename, and `/evidence/student/{id}/download` is never called from this page.
11. **There is no Reject action in the coordinator UI.**
12. **Approval triggers no OSAD criterion matching or scoring.**
13. **Engine 2 mapping reads non-existent `category_code`**, so score, basis, and review return 0 for real DB records.
14. **Two divergent scoring engines** write the same `student_award_evaluations` table.
15. **Notifications are not navigable.** `NotificationController::index` does not return `reference_id`, and portfolio notifications have no `route_path`, so `targetPath` is null.
16. **Scoring is not bound to a criteria version.** Recalculation silently rewrites history.
17. **Student Portfolio stats, dashboard, and export are mock data.**

---

## N. Priority Fixes

### P0 — correctness/security blockers

| Issue | Files / endpoint / table | Reason | Recommended change | Acceptance test |
|---|---|---|---|---|
| Choose one system of record | `CanonicalAchievementSubmissionModal.jsx`, `StudentAchievementsPage.jsx`, `useStudentAchievements.js`, `useVerification.js`, `StudentPortfolioController`, award services | UI writes canonical; everything downstream reads legacy | Either (a) revert the student UI to the legacy draft → evidence → `/portfolio/{id}/resubmit` flow, or (b) build a canonical coordinator queue, a decision service, and a portfolio projection, and repoint the scoring input. Do not ship both. | Submit through the UI; the item appears in the student list and the correct coordinator queue |
| Remove or harden `POST /verification/{id}/decide` | `VerificationQueueController`, Routes.php:195–198 | No remarks or evidence rule; defaults to approve | Delete the routes, or delegate to `decideRecord()` | Reject without remarks returns 422; approve without evidence returns 422 |
| Remove or harden `POST /achievements` | `AchievementController::create`, Routes.php:84 | Creates a submitted record without evidence or classification | Delete, or force draft + evidence + resubmit validations | A POST cannot yield `status=submitted` without clean evidence |
| Remove fabricated points shown to students | `StudentPortfolioPage.jsx` ~l.640, `ExportPortfolioPreviewModal.jsx` | Violates the no-points rule | Delete the Points tile and "Points Conferred"; pass real `verifiedAchievements` to export; delete `DEFAULT_PORTFOLIO_ACHIEVEMENTS` | No "point"/"score" string rendered in any student route (DOM test) |

### P1 — core workflow blockers

| Issue | Files | Change | Acceptance |
|---|---|---|---|
| Auto criterion matching on approval | `decideRecord()` plus a new `ApprovedAchievementScoringService` | After a successful verify commit (or in the same transaction), compute matches and contributions per applicable award/criterion using one engine, persisted with record_id, criterion_id, rule_id, version_id, and points; idempotent key (record, criterion, version) | Approve once gives N contribution rows; approve again gives no new rows; return or reject gives 0 rows |
| Engine 2 `category_code` | `AwardEvidenceMappingService::mapStudentEvidenceForAward` | Join `portfolio_categories`/`portfolio_subcategories` and select `pc.code AS category_code, ps.code AS subcategory_code` | A seeded verified leadership record yields a non-zero criterion match through `/osad/.../score` |
| Single scoring engine | `AwardEvaluationService`, `AwardScoringService` | Retire one; remove the 15/10-point fallbacks; honor `rule_type`/`rule_config` | Same inputs give identical totals across endpoints |
| Remove `findCriterionByCode` first-criterion fallback | mapping service l.612 | Return null and treat as not relevant | Unmatched record contributes 0 |
| Coordinator evidence viewer | `CoordinatorDashboardPage.jsx` | Wire View/Download to `portfolioService.downloadEvidence(evidence.id)` for each evidence item; drop the hardcoded sizes | Coordinator opens real bytes; another program's coordinator gets 403 |
| Reject in UI | `useVerification.js`, coordinator page | Add `handleReject` → `portfolioService.rejectRecord` with required remarks | Rejected record leaves the queue; student sees Rejected and remarks |
| Student revise and resubmit | `StudentAchievementsPage.jsx`, modal | Pass `editingItem` and load the existing record | Returned → edit → resubmit → back in the queue with history retained |
| Persist basic info | Canonical modal / contract | Map basic fields into contract fields or core columns | Title and dates are visible to the coordinator |

### P2 — reliability/integration

- Make canonical submit atomic, with the detail insert and routing in one transaction.
- Create the draft lazily (on first save or upload), not on modal open.
- Make the approval UPDATE conditional (`WHERE status='submitted'`) and check affected rows, which closes the race in L9.
- Add `UNIQUE(cycle_id, award_definition_id, student_profile_id)` to `student_award_evaluations`.
- Persist `scoring_model_version_id` on evaluations and contributions.
- Return `reference_type`/`reference_id` from `NotificationController`, and map `student_portfolio_records` to `/student/achievements` with `highlightId`.
- Add a canonical-path coordinator notification.
- Pass coordinator-queue evidence through `formatSafeEvidence`.
- Gate `listAwards`/`showAward` to OSAD, or strip point fields for students.
- Fix `$actor['profile_id']` to `$actor['profile']['id']`.
- Require clean-scanned evidence on the legacy path, or retire it.

### P3 — cleanup

- Remove `StudentDashboardPage` demo data, or wire it to `/portfolio`.
- Remove the fake "Live Audit Stream".
- Delete `VerificationController.js` and `VerificationQueueModel` if unused.
- Delete the unused `achievementService` wrappers.
- Delete the dead `handleSubmitAchievement`.
- Remove the `.student06-backup` service file from `app/Services`.

---

## Required Tables

### State machine (legacy `student_portfolio_records`, the one the coordinator acts on)

| Current state | Action | Allowed actor | Resulting state | Backend enforcement |
|---|---|---|---|---|
| — | `POST /portfolio` (submit_now=false) | Student (`canCreate`) | draft | ✅ submit_now=true rejected |
| — | `POST /achievements` | Student | **submitted** | ⚠ No evidence or classification check (L2) |
| — | Event bridge | OSAD/organizer event manager | **verified** | Separate path, no coordinator review |
| draft / revision_requested | `POST /portfolio/{id}/resubmit` | Owner (`canSubmit`) | submitted | ✅ Taxonomy, metadata, common fields, ≥1 active evidence, duplicate check, coordinator exists |
| submitted | verify | Coordinator of the student's latest program | verified | ✅ `canVerify` + evidence ≥1 |
| submitted | request-revision | same | revision_requested | ✅ Remarks required |
| submitted | reject | same | rejected | ✅ Remarks required |
| submitted | `/verification/{id}/decide` | same | verified / rejected / revision_requested | ⚠ No remarks or evidence check; default approve |
| draft → verified, rejected → verified, verified → * | any decide | anyone | — | ✅ Blocked (`canVerify` requires `submitted`) |
| verified | student edit | Owner | — | ✅ `canEdit` only allows draft or revision_requested |

### State machine (canonical `achievement_record_versions.submission_state`)

| Current | Action | Actor | Result | Enforcement |
|---|---|---|---|---|
| — | create draft | Student | draft | ✅ |
| draft / revision_requested | save / upload / detach | Owner | same | ✅ `editable()` |
| draft / revision_requested | submit | Owner | submitted (routed) or routing_pending | ✅ Contract validation + clean evidence |
| routing_pending | `reconcilePendingForProgram` | caller not found in controllers | submitted | ⚪ No HTTP caller found |
| submitted | approve / return / reject | — | — | 🔴 **Not implemented** |

### Role access to points

| Role | Achievement? | Criterion match? | Points? | Student total? | Evidence |
|---|---:|---:|---:|---:|---|
| Student | Own only | No | **Rubric only (L7)**; own points NO | NO | `AwardPolicy`, `stripStudentScoringFields` |
| Program Coordinator | Own-program students | No | No | No | No award endpoint allows them |
| Dean | College scope (view) | No | No | No | Only `canNominateStudent` |
| OSAD admin (`account_type=osad_admin` + `osad_staff`) | All non-draft | Yes | Yes | Yes (per award/cycle) | `canRunAwardEvaluation` |
| `osad_staff` without `osad_admin` account type | All non-draft | No | No | No | `canRunAwardEvaluation` requires both |

### Total-points architecture

There is **no universal student total**. Totals are **per (cycle, award, student)** in `student_award_evaluations.raw_score` / `potential_score`, computed on demand and persisted by engine 1 or `AwardReviewService`. Only `status='verified'` legacy rows are included (engine 1 query; engine 2 hard gate), so drafts, submitted, returned, and rejected rows are excluded. Duplicate-record exclusion is partial (see H).

### Database data flow

| Table | Purpose | Written by | Read by | Key relationship |
|---|---|---|---|---|
| `profiles` | identity | provisioning | everything | — |
| `student_program_enrollments` | student → program | provisioning | routing, policies | → `academic_programs` |
| `program_coordinator_assignments` | coordinator → program | OSAD admin | actor resolver, routing | → `academic_programs`, `profiles` |
| `achievement_records`, `achievement_record_versions` | canonical achievement | DraftService | DraftService, routing | versions → records |
| `achievement_version_draft_fields` | draft values | DraftService::save | submit | → versions |
| `achievement_evidence`, `achievement_version_evidence` | canonical evidence | LifecycleController::upload | submit, preview | → versions |
| `student_achievement_verification_routes`, `student_achievement_routing_events` | canonical routing | RoutingService | **nobody** | → versions, programs, profiles |
| `student_portfolio_records` | legacy achievement = portfolio | `/portfolio`, `/achievements`, event bridge | lists, queue, portfolio, both scoring engines | → `portfolio_categories`/`_subcategories`, `profiles` |
| `student_portfolio_evidence` | legacy evidence | `/portfolio/{id}/evidence` | queue, download, verify check | → spr (CASCADE) |
| `student_portfolio_verification_events` | legacy audit trail | `decideRecord`, resubmit, create | `/portfolio/{id}` timeline | → spr |
| `award_definitions`, `award_criteria`, `award_criterion_components`, `award_scoring_rules`, `award_portfolio_mappings`, `award_evidence_mapping_rules`, `award_scoring_model_versions`, `award_cycles` | OSAD rubric (reference) | migrations/seeders | scoring engines, `/osad/awards` | criteria → definitions; rules → criteria |
| `student_award_evaluations`, `student_award_criterion_scores`, `student_award_score_evidence` | computed scores | engine 1, `AwardReviewService`, `AwardPotentialCandidateService` | OSAD endpoints | score_evidence → spr (RESTRICT), → rules |
| `award_interview_eligibilities` | candidate pathway | engine 1 | OSAD | → evaluations |
| `notifications` | alerts | resubmit, `decideRecord` | `/notifications` | → profiles |

### Required test scenarios

| # | Scenario | Result against current source |
|---|---|---|
| 1 | Successful approval, end to end | **FAIL.** UI submission never reaches the coordinator, and approval does not score. |
| 2 | Three criteria match | **FAIL** automatically; PARTIAL via manual OSAD engine 1 |
| 3 | Some criteria not applicable | Engine 1: non-matching criteria get 0 (PASS if run manually). Engine 2: the fallback may mis-attribute. |
| 4 | Return for revision | Backend PASS (legacy); student UI resubmit FAIL |
| 5 | Reject | Backend PASS; UI FAIL (no control) |
| 6 | Duplicate approval | Sequential PASS (403); concurrent: two events. No scoring is involved. |
| 7 | Student sends `points`/`status` | PASS on `/portfolio` (422). `/achievements` ignores `points` but forces `submitted`. |
| 8 | Student hits a score endpoint | PASS (403) for student-score endpoints; rubric endpoints are open (L7) |
| 9 | Cross-program coordinator | PASS (403) |
| 10 | New-session persistence | PASS for legacy verified rows; FAIL for UI-created submissions |

### Module status

| Module | Status |
|---|---|
| Student submission (current UI → canonical) | 🟡 PARTIALLY WIRED (persists; disconnected downstream) |
| Evidence upload and storage | ✅ VERIFIED WIRED (canonical); ⚪ ClamAV runtime |
| Coordinator routing (canonical) | 🟠 BACKEND ONLY (no reader) |
| Coordinator queue (legacy) | ✅ VERIFIED WIRED for legacy rows |
| Coordinator evidence viewing | 🟠 BACKEND ONLY |
| Approve | 🟡 PARTIALLY WIRED (legacy only) |
| Return / resubmit | 🟡 PARTIALLY WIRED |
| Reject | 🟠 BACKEND ONLY |
| `/verification/*`, `/achievements` | ⚫ UNUSED BY UI, reachable (risk) |
| Automatic OSAD criterion matching | 🔴 BROKEN / ABSENT |
| OSAD scoring engine 1 | 🟡 PARTIALLY WIRED (manual; non-authoritative fallbacks) |
| OSAD scoring engine 2 | 🔴 BROKEN (no `category_code` on DB rows) |
| Student portfolio list | 🟡 PARTIALLY WIRED (real list, mock stats) |
| Portfolio export | 🟣 MOCK / DEMO |
| Student dashboard | 🟣 MOCK / DEMO |
| Student point privacy (API) | ✅ for personal scores; 🟡 rubric exposure |
| Notifications | 🟡 PARTIALLY WIRED (not navigable) |

---

## Items I could not verify

- Which migrations are applied in the running MySQL database, including `2026-09-29-000021`/`-000022` and the PostgreSQL-syntax triggers.
- Whether ClamAV and PaddleOCR are installed at the configured paths.
- Seeder contents, meaning which rows are demo transactions versus reference data.
- Actual HTTP behavior. No server or tests were run; all findings come from reading the source.

---

## Resolution (updated 2026-09-30, after Steps 1–7)

Commits on branch: Step 1 `9ba606d` · Step 2 `6cdef12` · Step 3 `ef9cb3f` · Step 4 `4f18a02` · Step 5 `22e6a4d` · Step 5b `fc96c8a` · Step 6 `cc6f93f` · Step 7 (this change).
The canonical lifecycle is **PARKED**; see `PARKED_CANONICAL_ACHIEVEMENT_SYSTEM.md`.

### M. Broken / missing connections

| # | Finding | Resolution |
|---|---|---|
| M1 | Canonical submission has no consumer | **FIXED, Step 1.** The student UI writes `student_portfolio_records`; canonical PARKED |
| M2 | Student list reads legacy table, new submissions invisible | **FIXED, Step 1** |
| M3 | Basic information not persisted | **FIXED, Step 1** (title, organizer, dates saved through `/portfolio`) |
| M4 | New draft created on every modal open | **FIXED, Step 1** (draft created lazily, one per session) |
| M5 | Modal ignores `editingItem`; `handleSubmitAchievement` dead | **FIXED, Step 1** (edit/resubmit loads the record; dead handler removed) |
| M6 | Modal does not refresh the list | **FIXED, Step 1** (`onSaved` refreshes) |
| M7 | Canonical lifecycle lacks approve/return/reject | **N/A: PARKED** (conditions in the parked doc) |
| M8 | Canonical submit not atomic | **N/A: PARKED** |
| M9 | Canonical path sends no coordinator notification | **N/A: PARKED.** The live path notifies the single resolved coordinator after commit (Steps 3, 7) |
| M10 | Coordinator cannot open evidence | **FIXED, Step 2** |
| M11 | No Reject action in coordinator UI | **FIXED, Step 2** |
| M12 | Approval triggers no criterion matching | **FIXED, Step 6** (`ApprovedAchievementScoringService`, contributions table, rescore endpoint, backfill command) |
| M13 | Engine 2 reads a non-existent `category_code` | **FIXED, Step 5** |
| M14 | Two divergent scoring engines | **FIXED for all HTTP paths, Step 5.** **OPEN (low):** `AwardScoringRuleEngine` and `AwardCandidateGenerationService` remain, used only by CLI verification commands |
| M15 | Notifications not navigable | **FIXED, Step 7** (`reference_type`/`reference_id` returned; student → `/student/achievements` with `highlightId`; coordinator → `/personnel/dashboard?tab=workspace&record=<id>`) |
| M16 | Scoring not bound to a criteria version | **FIXED, Steps 5 and 6** (`scoring_model_version_id`/`scoring_version` on evaluations; `scoring_version` on contributions) |
| M17 | Student portfolio stats, dashboard, export are mock data | **FIXED, Step 4** |

### L. Security findings

| # | Resolution |
|---|---|
| L1 `POST /verification/{id}/decide` | **FIXED, Step 3** (route and handler removed) |
| L2 `POST /achievements` | **FIXED, Step 3** (route and handler removed) |
| L7 Rubric readable by students | **FIXED, Step 4** (`listAwards`/`showAward` OSAD-only) |
| L8 Queue returns `storage_path`/`sha256` | **FIXED, Step 2** (`formatSafeEvidence`) |
| L9 Concurrent double approval | **FIXED, Step 3** (conditional UPDATE + affected-rows check; proven with concurrent requests) |
| L10 Legacy evidence not scanned; DOC/DOCX allowed | **FIXED, Steps 1 and 3** (PDF/JPEG/PNG only, ClamAV scan, clean evidence required for submit and approve) |
| L12 `$actor['profile_id']` | **FIXED, Step 5** |
| L3–L6, L11 | Were already passing |

### K. Dummy / mock / hardcoded

| Item | Resolution |
|---|---|
| Student dashboard demo data | **FIXED, Step 4** |
| Student portfolio stat tiles / "30 Points" | **FIXED, Step 4** |
| Export modal demo achievements and points | **FIXED, Step 4** |
| Coordinator commented fixtures, "Live Audit Stream", hardcoded file sizes, hardcoded program toast | **FIXED, Step 2** |
| `VerificationController.js` + `VerificationQueueModel.js` | **REMOVED, Step 7** (zero imports confirmed) |
| `services/achievementService.js` | **REMOVED, Step 7** (no importers anywhere; the backend routes it wrapped are removed or event-only) |
| `AwardEvaluationService` 15.0/10.0 invented points | **FIXED, Step 5** |
| Seeder demo vs reference rows | **OPEN: UNVERIFIED** |

P3 cleanup: `handleSubmitAchievement` removed (Step 1); `.student06-backup` service file removed (Step 7). No further stray commented fixtures were found in the workflow files (Step 7 search).

### Still OPEN (for the next iteration or an adviser decision)

1. **Rubric value conflicts** between the DB `rule_config` and the scoring-engine constants: `STEP5_RUBRIC_CONFLICTS_2026-09-30.md` (OSAD/adviser decision).
2. **Student form vocabulary ≠ engine vocabulary** for sports, citations and civic (e.g. `champion` vs `GOLD`, `recognition_level` vs `scope`). Form-submitted records in those areas score 0.
3. **Only Campus Journalism routes through the seeded `award_evidence_mapping_rules`** (Step 5b). The other awards follow the same category routing but in code. Engine component codes do not match the DB codes, so persisted `component_id` is NULL for non-Journalism awards.
4. **Socio-Cultural / Performer mapping rules are `PROPOSED`** in the DB. Legacy mapping rows (`d88…`, older award definitions) are still active; they are ignored by code.
5. **Candidate notions differ:** `/evaluate` writes interview eligibility at the threshold, while the Potential Candidates list also requires a finalized OSAD review.
6. **`AwardReviewService`** reads saved review state without the cycle. `AwardPotentialCandidateService.php:84` calls a non-existent method (unreachable in practice).
7. **Awards catalog shows "Eligibility details unavailable"**, because the backend never sends `field_availability.graduating_only`/`gender_restriction`.
8. **Dean scoping unchanged**; coordinator Students tab uses a hardcoded course list; hidden portfolio sections (about/skills/experience).
9. **Browser click-through of the whole flow not performed.** All proof is HTTP/unit/Vitest.
10. **Pre-existing test issues unrelated to these steps:** OSAD navigation/form Vitest failures; `Phase8Step4PortfolioE2ETest` tagged `legacy-postgres`. The ambiguous program/coordinator guard is untestable because DB unique keys prevent that state.
11. **Housekeeping:** leftover Step 1 test drafts (cleanup SQL provided earlier, run status unknown); `scratch/claude-jobs` files.
