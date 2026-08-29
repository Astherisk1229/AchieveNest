# Phase 5 — Backend Route Audit Report

## Status
`PASS / COMPLETED`

## Baseline
- **Branch:** `audit/project-architecture-linkage`
- **Starting HEAD:** `45f28514b93c78b365edddb9f59ba787e78324b4`
- **Phase 0 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_0_FREEZE_AND_SAFETY_BASELINE.md`)
- **Phase 1 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_1_REPOSITORY_INVENTORY.md`)
- **Phase 2 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_2_FRONTEND_ROUTE_REACHABILITY.md`)
- **Phase 3 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_3_FRONTEND_DEPENDENCY_AUDIT.md`)
- **Phase 4 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_4_FRONTEND_BACKEND_API_CONTRACT_MAP.md`, `docs/audit/PHASE_4_API_CONTRACT_MAP.csv`)
- **Working Tree:** Clean (pre-existing untracked `STARTUP_COMMANDS.md` accounted)

---

## Route Configuration Overview
- **Primary Route Configuration:** `backend/app/Config/Routes.php` (204 lines)
- **Global / Special Filters:** `forcehttps`, `pagecache`, `secureheaders`, `cors`
- **API Group Prefix:** `api/v1`
- **Default Controller Namespace:** `App\Controllers\Api`
- **Live Routing Verification:** Verified via `php spark routes` matching `Routes.php` 100%.

---

## Route Summary Table
| Metric | Count | Observations |
| :--- | :---: | :--- |
| **Total Functional Backend Routes** | **38** | Complete enumeration across all functional subsystems |
| **Active Frontend-Called Routes** | **23** | Direct match to Phase 4 frontend API contracts |
| **Active Shared Routes (Frontend + CLI/Test)** | **2** | `/api/v1/health`, `/api/v1/provisioning/manual-personnel` |
| **Active Backend-Only Routes** | **7** | Lifecycle suspension/archive, direct student provisioning, role listing |
| **Active Public Routes** | **5** | `/`, `/api/v1/health`, `/api/v1/auth/login`, `/api/v1/password-reset-requests` (submit) |
| **Active Test-Only / Script Routes** | **4** | Regression test harnesses and database verification endpoints |
| **Compatibility / Legacy Routes** | **2** | Legacy CSV bulk roster preview and commit routes |
| **No Caller Proven Routes** | **0** | Every single backend route has verified callers or operational purpose |
| **Overlap Candidates** | **0** | No colliding or duplicate route handler patterns |
| **Review Required Routes** | **2** | Documented in review candidates CSV for Phase 13A |

---

## Detailed Subsystem Breakdown

### 1. Public & System Routes
- `GET /` -> `App\Controllers\Home::index` (Public root)
- `GET /api/v1/health` -> `App\Controllers\Api\HealthController::index` (Public health telemetry)

### 2. Authentication & Credential Management
- `POST /api/v1/auth/login` -> `AuthController::login` (Public credential authentication)
- `POST /api/v1/auth/logout` -> `AuthController::logout` (Token revocation)
- `GET /api/v1/auth/me` -> `AuthController::me` (Session payload)
- `POST /api/v1/auth/change-password` -> `AuthController::changePassword` (Password rotation)

### 3. Password Reset Queue
- `POST /api/v1/password-reset-requests` -> `PasswordResetRequestController::submit` (Public form submission)
- `GET /api/v1/password-reset-requests` -> `PasswordResetRequestController::list` (Admin queue listing)
- `POST /api/v1/password-reset-requests/(:segment)/reset` -> `PasswordResetRequestController::reset` (Temporary password generation)
- `POST /api/v1/password-reset-requests/(:segment)/reject` -> `PasswordResetRequestController::reject` (Admin rejection)

### 4. Personnel Governance & Dean Appointment
- `GET /api/v1/personnel/roles` -> `PersonnelRoleController::index` (Role listing)
- `POST /api/v1/personnel/(:segment)/roles` -> `PersonnelRoleController::assign` (Specialized role assignment)
- `DELETE /api/v1/personnel/(:segment)/roles/(:segment)` -> `PersonnelRoleController::revoke` (Role revocation)
- `GET /api/v1/hr/personnel` -> `TargetHRPersonnelController::directory` (Target schema personnel directory)
- `POST /api/v1/hr/personnel/(:segment)/dean-role` -> `TargetHRPersonnelController::assignDean` (Dean assignment)
- `DELETE /api/v1/hr/personnel/(:segment)/dean-role/(:segment)` -> `TargetHRPersonnelController::revokeDean` (Dean revocation)
- `GET /api/v1/hr/dashboard` -> `HRPersonnelController::dashboard` (HR KPIs)
- `GET /api/v1/hr/audit` -> `HRPersonnelController::audit` (Audit trail)

### 5. HR Faculty Evaluation Studio
- `GET /api/v1/hr/evaluations` -> `HREvaluationController::list` (Portfolio submissions queue)
- `POST /api/v1/hr/evaluations/(:segment)/finalize` -> `HREvaluationController::finalizeEvaluation` (Final score and rank transition)
- `PATCH /api/v1/hr/evaluations/(:segment)/items/(:segment)/rate` -> `HREvaluationController::rateItem` (Evidence score update)

### 6. Student Portfolio & Coordinator Verification
- `GET /api/v1/portfolio` -> `StudentPortfolioController::index` (Student accomplishments)
- `POST /api/v1/portfolio` -> `StudentPortfolioController::create` (Achievement submission)
- `GET /api/v1/program-coordinator/verification-queue` -> `StudentPortfolioController::coordinatorQueue` (In-scope coordinator queue)
- `POST /api/v1/portfolio/(:segment)/verify` -> `StudentPortfolioController::verifyRecord` (Approval / revision decision)

### 7. OSAD Awards & 80% Evaluation Benchmark
- `GET /api/v1/osad/awards` -> `AwardEvaluationController::listAwards` (Award categories)
- `POST /api/v1/osad/awards/(:segment)/evaluate` -> `AwardEvaluationController::evaluateAward` (Authoritative 80% benchmark calculation)
- `GET /api/v1/osad/awards/(:segment)/students/(:segment)/basis` -> `AwardEvaluationController::scoringBasis` (Transparent scoring breakdown)

### 8. Evidence File Streaming & Downloads
- `GET /api/v1/evidence/student/(:segment)` -> `EvidenceController::studentMetadata` (Attachment metadata)
- `GET /api/v1/evidence/personnel/(:segment)/download` -> `EvidenceController::personnelDownload` (Streamed proof PDF binary)

---

## Phase 4 Backend-Only Candidate Outcomes
- All candidate routes evaluated with direct caller evidence across CLI tools, background test harnesses, and DR procedures.
- 0 orphaned routes found; all 38 routes have verified structural and operational purpose.

---

## Audit Artifacts Generated
1. **Backend Route Register CSV:** `docs/audit/PHASE_5_BACKEND_ROUTE_MAP.csv` (39 lines, 38 route records across 27 columns)
2. **Review Candidates CSV:** `docs/audit/PHASE_5_BACKEND_ROUTE_REVIEW_CANDIDATES.csv` (3 lines, 2 records)
3. **Audit Narrative Report:** `docs/audit/PHASE_5_BACKEND_ROUTE_AUDIT.md`

---

## Verdict
`PASS / COMPLETED`

## Safety Confirmation
No backend route, controller, filter, auth, API, validation, schema, migration, seed, UI, or business-logic changes were performed in Phase 5.
