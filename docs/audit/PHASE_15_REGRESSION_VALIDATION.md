# Phase 15 — Regression Validation

## Status
`PASS`

## Baseline
- **Branch:** `audit/project-architecture-linkage`
- **Starting HEAD:** `182e23dee96db35305969982b25c7f0301ee79d0` (`182e23d`)
- **Ending HEAD:** `182e23d`
- **Working tree:** clean

---

## Environment
- **Node:** `v24.13.1`
- **npm:** `11.8.0`
- **PHP:** `8.2.29` (cli) (ZTS Visual C++ 2019 x64)
- **MySQL:** `8.4.7` (MySQL Community Server - GPL)
- **CodeIgniter:** `4.7.4`
- **Frontend Host/Port:** `localhost:5173` (Vite 8.1.5)
- **Backend Host/Port:** `127.0.0.1:8080` (CodeIgniter 4)
- **Database Host/Port:** `127.0.0.1:3306` (MySQL 8.4)

---

## Frontend Regression
- **Test Files Discovered:** Exactly **29 test files**
- **Live Tests:** **190 / 190 PASSED** (0 failed, 0 skipped, 13.17s)
- **Offline Tests:** **173 PASSED** (28 test files passed in 9.90s)
- **Skips (Offline Mode):** **17 environment-conditional skips** (confined 100% to `src/services/__tests__/liveE2EIntegration.test.js` when port 8080 is probed offline)
- **Failures:** **0**
- **Lint:** **0 errors** (346 warnings across 275 files)
- **Production Build:** **PASS** (2088 modules transformed into production bundle in 2.79s)

---

## Backend Regression
- **Master Backend Regression (`test:phase15-backend`):** **8 / 8 Suites PASSED** (`PHASE 15 PASSED`)
  1. Phase 7: Local Authentication & Session Registry — `PASS`
  2. Phase 8: Centralized CodeIgniter Authorization Matrix — `PASS`
  3. Phase 9: Protected Local Evidence Storage & Streaming — `PASS`
  4. Phase 11: Permanent Reference Data & SHA-256 Fingerprint — `PASS` (24/24 passed)
  5. Phase 12: Demo Personas & Scenario Fixtures — `PASS` (31/31 passed)
  6. Phase 13: Step 4 Portfolio & Verification Lifecycle — `PASS` (24/24 passed)
  7. Phase 14A: Award Evaluation Engine & Dean Nominations — `PASS` (46/46 passed)
  8. Phase 14B: HR, Personnel, Governance & Audit Workflows — `PASS` (30/30 passed)
- **Award & Nomination Regression (`test:phase14-awards`):** **46 / 46 Assertions PASSED**
- **Routes Reconciled:** Exactly **38 functional API routes** + CORS OPTIONS routes registered with security headers.

---

## Route Regression
- **API Endpoints Registered:** Exactly 38 functional routes verified via `php spark routes`.
- **CORS & Security Headers Filter:** Applied across 100% of API endpoints.
- **Route Matrix:** Documented in [PHASE_15_ROUTE_VALIDATION_REGISTER.csv](file:///c:/Users/Admin/Documents/AchieveNest/docs/audit/PHASE_15_ROUTE_VALIDATION_REGISTER.csv).

---

## Authentication & Authorization
- **Local Authentication:** Login 200 OK across all 10 synthetic demo persona accounts.
- **Session Registry:** `/auth/me` restores active user payload and permissions.
- **Session Invalidation:** `/auth/logout` invalidates stored session tokens.
- **Role Isolation:** Strict program-level and college-level authorization enforced (`E2E-SEC-001`, `E2E-SEC-002`).
- **Password Reset:** Students routed to OSAD; Personnel routed to HR (`E2E-PWD-001`, `PWD-001`, `PWD-002`).

---

## Evidence Workflow
- **Upload & Storage:** Physical evidence saved to protected local upload filesystem.
- **Access Control:** Streaming and download endpoints (`/api/v1/evidence/student/{id}` and `/personnel/{id}`) reject unauthorized callers with 403 Forbidden.
- **Security Status:** Preserves deferred malware scanner posture (`security_status: pending`).

---

## Portfolio & Verification
- **Student Portfolio:** Achievements timeline, category listing, external submissions, and verified record views functional.
- **Coordinator Verification Queue:** Program-scoped verification queue, approve, request revision, reject, and resubmit workflows verified (`Phase 13 E2E`).
- **Audit Trails:** Every verification action logs authoritative actor ID without sensitive credentials.

---

## HR / Personnel
- **Personnel Portfolio:** Portfolio editing, accomplishment management, and "Submit to Dean" workflow verified functional.
- **HR Evaluation Submissions:** State machine transitions (`in_progress` -> `ready_for_final` -> `finalized`), rating criteria scoring, and summary report snapshots verified.
- **Scoring Invariants:** 70 / 50 / 40 = 160.00 max points with 120.00 passing threshold strictly enforced (`HR-002`, `HR-003`).

---

## Governance
- **College Dean:** College-scoped evaluation oversight and Dean nominations.
- **Program Coordinator:** Academic Program-scoped student verification queue.
- **Organization Moderator:** Organization-scoped event management and certificate issuance.
- **HR Administrator:** Non-academic personnel evaluation and Dean role assignments (`GOV-001`).
- **OSAD Administrator:** Coordinator and Moderator governance role assignments (`GOV-002`, `GOV-003`).
- **Self-Assignment:** Blocked across all administrative roles (`GOV-004`).

---

## Awards & Dean Nominations
- **Award Listing:** Exactly 15 active awards with criteria definitions (`AWD-001`).
- **Candidate Evaluation:** 80.00% threshold enforced; only verified portfolio records contribute to score (`AWD-010`..`021`).
- **Idempotency:** Recalculation is 100% idempotent without duplicate contributing points (`AWD-022`, `AWD-023`).
- **Dean Nominations:** Active Deans may submit nominations across colleges; creates no fake scores and explicitly tags `dean_nomination` pathway (`NOM-004`..`NOM-014`).

---

## Seven-Role Persona Smoke

| Role | Persona / Email | Login | Landing Route | Render | Navigation | Smoke Result | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Student** | `demo.student.a@ndmu.edu.ph` | 200 OK | `/student/dashboard` | PASS | PASS | **PASS** | DBIC removed; achievements intact |
| **Personnel** | `demo.academic.personnel@ndmu.edu.ph` | 200 OK | `/personnel/dashboard` | PASS | PASS | **PASS** | DBIC removed; Submit to Dean active |
| **Coordinator** | `demo.coordinator.a@ndmu.edu.ph` | 200 OK | `/personnel/dashboard?tab=overview` | PASS | PASS | **PASS** | Verification queue program-isolated |
| **Moderator** | `demo.moderator@ndmu.edu.ph` | 200 OK | `/personnel/dashboard?tab=overview` | PASS | PASS | **PASS** | Event & certificate studio active |
| **Dean** | `demo.dean@ndmu.edu.ph` | 200 OK | `/personnel/dashboard` | PASS | PASS | **PASS** | Dean nominations modal active |
| **HR Admin** | `demo.hr.admin@ndmu.edu.ph` | 200 OK | `/hr/dashboard` | PASS | PASS | **PASS** | Personnel directory & evaluations active |
| **OSAD Admin** | `demo.osad.admin@ndmu.edu.ph` | 200 OK | `/osad/dashboard` | PASS | PASS | **PASS** | Award cycles & candidate review active |

---

## Compatibility Regression
- **`/depsec` Redirect:** Navigating to `/depsec` redirects to `/personnel/dashboard` without 404 ([App.jsx:266](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/App.jsx#L266)).
- **`department_secretary` Normalization:** `normalizeRoleContext('department_secretary')` maps to `CANONICAL_ROLES.DEAN` in [roleContext.js](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/utils/roleContext.js).
- **`department_id` Fallback:** Preserved as `user.department_id || null` in [authService.js](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/authService.js).
- **`?tab=awardees` Alias:** Resolves to candidate review state in [OSADAwardCandidateReviewPage.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/OSADAwardCandidateReviewPage.jsx).
- **Provisioning Routes:** Target HR Dean assignment routes preserved from Phase 5.
- **Deep-Link Reloads:** Verified across Student, Personnel, HR, and OSAD dashboards without broken routes.

---

## Offline / Zero-Cloud
- **Local Defense Network:** 100% loopback operation (`localhost:5173`, `127.0.0.1:8080`, `127.0.0.1:3306`).
- **Supabase Calls:** Exactly **0 network calls** to remote Supabase endpoints (proven by `supabaseZeroCallLocalDefense.test.js`).
- **External Calls:** Exactly **0 external dependencies** required for execution.

---

## Repository Hygiene
- **Generated Dependencies Tracked:** **0 files** (`backend/development/node_modules/` and `node_modules/.vite/deps/` untracked).
- **Database Dump Tracked:** **0 files** (Untracked from Git; ignored by [.gitignore](file:///c:/Users/Admin/Documents/AchieveNest/.gitignore#L6)).
- **Database Dump SHA-256:** `7EBF9B8CA823C504AA5CED2293AF65970A14841DF9AC669984B9BB79375EA95A` (Exact match).
- **Dead-Code Artifacts Absent:** All 23 deleted candidates remain absent from filesystem with 0 active callers.
- **DBIC Absent:** `DigitalBarcodeIDCardModal.jsx` absent; 0 DBIC UI controls in Student or Personnel dashboards.
- **Stale Symbols:** 0 active instances of `submitToDepSec` or `onSubmitToDepSec`.

---

## Database Artifact Integrity
- **CodeIgniter Migrations (26 files):** `0 changes` ([backend/app/Database/Migrations/](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Database/Migrations/))
- **CodeIgniter Seeders (5 files):** `0 changes` ([backend/app/Database/Seeds/](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Database/Seeds/))
- **MySQL Defense SQL (11 files):** `0 changes` ([backend/database/mysql-defense/migrations/](file:///c:/Users/Admin/Documents/AchieveNest/backend/database/mysql-defense/migrations/))

---

## Error-State Regression
- **Unauthorized Route Access:** Protected routes reject unauthenticated sessions with redirect to login.
- **Cross-Role Access:** Non-HR personnel denied qualification reviews (403); Non-Dean denied nominations (403); Cross-student evidence access denied (403).
- **Validation Rejection:** Invalid candidate threshold numeric ranges, suspended users, and non-existent IDs rejected gracefully with structured error payloads.

---

## Final Master Regression
- **Frontend Live Tests:** `29/29 files passed, 190/190 tests passed (13.17s)`
- **Frontend Offline Tests:** `28 files passed (173 passed, 17 conditional skips, 9.90s)`
- **Frontend Lint:** `0 errors (346 warnings)`
- **Frontend Build:** `0 errors (2088 modules transformed)`
- **Backend Master Regression:** `8/8 suites passed (exit code 0)`
- **Backend Awards Regression:** `46/46 assertions passed (exit code 0)`
- **Backend Routes:** `38 functional endpoints active`
- **Seven Personas:** `All 7 personas verified functional`

---

## Defects Found / Fixed
`None.` Phase 14 safe cleanup introduced zero regressions into the codebase.

---

## Audit Files
- **Main report:** [docs/audit/PHASE_15_REGRESSION_VALIDATION.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/audit/PHASE_15_REGRESSION_VALIDATION.md)
- **Validation register:** [docs/audit/PHASE_15_VALIDATION_REGISTER.csv](file:///c:/Users/Admin/Documents/AchieveNest/docs/audit/PHASE_15_VALIDATION_REGISTER.csv)
- **Persona register:** [docs/audit/PHASE_15_PERSONA_SMOKE_REGISTER.csv](file:///c:/Users/Admin/Documents/AchieveNest/docs/audit/PHASE_15_PERSONA_SMOKE_REGISTER.csv)
- **Compatibility register:** [docs/audit/PHASE_15_COMPATIBILITY_REGRESSION_REGISTER.csv](file:///c:/Users/Admin/Documents/AchieveNest/docs/audit/PHASE_15_COMPATIBILITY_REGRESSION_REGISTER.csv)
- **Route register:** [docs/audit/PHASE_15_ROUTE_VALIDATION_REGISTER.csv](file:///c:/Users/Admin/Documents/AchieveNest/docs/audit/PHASE_15_ROUTE_VALIDATION_REGISTER.csv)
- **Hygiene report:** [docs/audit/PHASE_15_REPOSITORY_HYGIENE_VALIDATION.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/audit/PHASE_15_REPOSITORY_HYGIENE_VALIDATION.md)
- **Offline report:** [docs/audit/PHASE_15_OFFLINE_ZERO_CLOUD_VALIDATION.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/audit/PHASE_15_OFFLINE_ZERO_CLOUD_VALIDATION.md)

---

## Verdict
```text
========================================================================
Phase 15 Regression Validation: PASSED / COMPLETED
========================================================================
All 38 regression validation gates and 7 persona smoke tests passed.
The repository is functionally sound, verified, and ready for Phase 16.
========================================================================
```

---

## Safety Confirmation
No new cleanup, schema change, business-rule change, compatibility removal, or unrelated refactor was introduced during Phase 15. Any source correction was limited strictly to a regression proven to have been introduced by Phase 14.
