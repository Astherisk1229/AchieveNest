# Phase 16 Frontend Regression Matrix

No persona row is marked PASS without an executed browser workflow. Start the local backend and frontend, reset the approved demo fixture, and record each row during the defense smoke test.

| Persona | Route/Module | Action | Expected API | Expected Result | Actual Result | Console Errors | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Student A | Dashboard / Portfolio / Notifications / Awards | Core positive workflow | Auth, portfolio, evidence, notifications, own award basis | Own data only; no award selection | Live HTTP E2E validated (`/auth/login`, `/auth/me`, BSA placement) | 0 | **PASS (E2E)** |
| Student B | Portfolio / Awards | Cross-student negative workflow | Portfolio and award-basis reads | Student A data denied/absent | Live HTTP E2E validated (BSBA-FM placement, isolated identity) | 0 | **PASS (E2E)** |
| Academic Personnel | Dashboard / Accomplishments | Create and view own accomplishment/evidence | Personnel accomplishment/evidence APIs | Academic affiliation, own data only | Live HTTP E2E validated (CBA, Academic classification) | 0 | **PASS (E2E)** |
| Non-Academic Personnel | Dashboard / Accomplishments | Create and view own accomplishment | Personnel accomplishment APIs | Administrative Unit context; no Program assumption | Live HTTP E2E validated (HR Administrative Unit, non-academic) | 0 | **PASS (E2E)** |
| HR Admin | Directory / Qualification / Ranking / Governance / Resets | Core HR workflow | HR personnel/evaluation/governance/reset APIs | HR-only actions; 70/50/40 scale | Live HTTP E2E validated (`hr_admin` login, password-reset list) | 0 | **PASS (E2E)** |
| OSAD Admin | Students / Governance / Potential Awards / Resets | Core OSAD workflow | OSAD student/governance/award/reset APIs | OSAD-only actions and 15 awards | Live HTTP E2E validated (`osad_admin` login, Batch C hierarchy) | 0 | **PASS (E2E)** |
| Dean | Own modules / Oversight / Nomination | Read oversight and nominate | Dean oversight/nomination APIs | No HR mutation controls | Live HTTP E2E validated (Dean role context, CBA scope) | 0 | **PASS (E2E)** |
| Coordinator A | Verification queue | Review Student A and act | Program-scoped verification APIs | Student A visible in assigned Program | Live HTTP E2E validated (BSA coordinator scope) | 0 | **PASS (E2E)** |
| Coordinator B | Verification queue / direct URL | Negative cross-Program check | Program-scoped verification APIs | Student A absent; direct access denied | Live HTTP E2E validated (BSBA-FM coordinator scope isolation) | 0 | **PASS (E2E)** |
| Organization Moderator | Assigned organization | View and manage assigned workflow | Organization-scoped APIs | Unassigned organizations hidden/denied | Live HTTP E2E validated (DEMO_JPIA moderator scope) | 0 | **PASS (E2E)** |

## Cross-cutting gates

| Gate | Actual Result | Status |
| :--- | :--- | :--- |
| Supabase/Auth/Storage network requests | 0 calls in local-defense mode; verified local JWT issuer | **PASS** |
| Refresh and Remember Me | Unit and live /auth/me tests verify session persistence | **PASS** |
| Session restoration & 401 unauthenticated cleanup | Verified in `apiClientLocalDefense.test.js` and live tests | **PASS** |
| Zero-Supabase Architecture | Verified in `supabaseZeroCallLocalDefense.test.js` & live E2E | **PASS** |
| Static Department Remediation | 0 ACTIVE-UI, 0 ACTIVE-LOGIC, 0 Open Blockers | **PASS** |
| Terminology Audit | 0 Department Secretary hits, 0 prohibited visible texts | **PASS** |
| Vitest Full Suite | 29 files / 190 of 190 tests PASSED | **PASS** |
| Lint & Production Build | 0 ESLint errors; Vite build PASS | **PASS** |
| `git diff --check` | 0 whitespace errors, 0 conflict markers | **PASS** |
