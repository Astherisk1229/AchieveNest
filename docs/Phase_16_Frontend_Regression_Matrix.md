# Phase 16 Frontend Regression Matrix

> **Environment:** Real Google Chrome (`Chrome/151.0.7922.174`) via Chrome DevTools Protocol (CDP) + Vite (`http://localhost:5173`) + CodeIgniter 4 Backend (`http://localhost:8080/api/v1`) + MySQL (`achievenest_local`).
> **Status:** **ALL 10 PERSONAS, SIDEBARS, DIRECT ROUTE GUARDS, AND DEVTOOLS NETWORK AUDIT PASSED**.

---

## 1. Persona Browser Regression Matrix

| Persona | Route / Module | Action | Expected API | Expected Result | Actual Browser Result | DevTools Console | DevTools Supabase Calls | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Student A** | `/student/dashboard`<br>`/student/portfolio` | Login, Remember Me, Portfolio, Refresh `/auth/me`, Logout | `POST /auth/login`<br>`GET /auth/me`<br>`POST /auth/logout` | Authenticate, BSA placement, own records only, session persists on reload, no HR/OSAD tabs | Observed in Chrome: redirected to `/student/dashboard`, BSA placement displayed, `/auth/me` restored session on reload, localStorage token saved | 0 errors | 0 | **PASS (Browser + E2E)** |
| **Student B** | `/student/dashboard` | Login, Session-only, Data Isolation | `POST /auth/login`<br>`GET /auth/me` | Authenticate, BSBA-FM placement, Student A data absent | Observed in Chrome: redirected to `/student/dashboard`, BSBA-FM placement displayed, sessionStorage-only token saved | 0 errors | 0 | **PASS (Browser + E2E)** |
| **Academic Personnel** | `/personnel/dashboard`<br>`/personnel/portfolio` | Login, Accomplishments, Classification check | `POST /auth/login`<br>`GET /auth/me` | Authenticate, Academic classification, CBA College, no Department Secretary | Observed in Chrome: redirected to `/personnel/dashboard`, CBA affiliation displayed, zero legacy Department labels | 0 errors | 0 | **PASS (Browser + E2E)** |
| **Non-Academic Personnel** | `/personnel/dashboard` | Login, Administrative Unit placement | `POST /auth/login`<br>`GET /auth/me` | Authenticate, Non-Academic classification, HR Administrative Unit context | Observed in Chrome: redirected to `/personnel/dashboard`, HR Unit displayed without fabricated College/Program | 0 errors | 0 | **PASS (Browser + E2E)** |
| **HR Admin** | `/hr/dashboard`<br>`/hr-admin/personnel-directory` | Login, Directory, Dean Governance | `POST /auth/login`<br>`GET /auth/me`<br>`GET /personnel` | Authenticate, Personnel Directory active, Assign Dean visible, Coordinator/Moderator buttons absent | Observed in Chrome: redirected to `/hr/dashboard`, Personnel Directory rendered, Dean governance scope verified, Coordinator/Moderator controls absent | 0 errors | 0 | **PASS (Browser + E2E)** |
| **OSAD Admin** | `/osad/dashboard`<br>`/osad-admin/academic-programs` | Login, Programs, Coordinator/Moderator Governance | `POST /auth/login`<br>`GET /auth/me`<br>`GET /colleges` | Authenticate, College -> Academic Program hierarchy, Coordinator/Moderator active, Dean buttons absent | Observed in Chrome: redirected to `/osad/dashboard`, Academic Programs hierarchy rendered without Department layer, Dean controls absent | 0 errors | 0 | **PASS (Browser + E2E)** |
| **College Dean** | `/personnel/dashboard` | Login, CBA College scope, check-and-balance | `POST /auth/login`<br>`GET /auth/me` | Authenticate, Dean role context active, CBA College scope, no HR mutation controls | Observed in Chrome: redirected to `/personnel/dashboard`, Dean role context verified with CBA College scope | 0 errors | 0 | **PASS (Browser + E2E)** |
| **Program Coordinator A** | `/personnel/dashboard` | Login, BSA scope, Verification Queue | `POST /auth/login`<br>`GET /auth/me` | Authenticate, Coordinator role context active, BSA Program scope, Student A visible | Observed in Chrome: redirected to `/personnel/dashboard`, BSA Coordinator role context verified | 0 errors | 0 | **PASS (Browser + E2E)** |
| **Program Coordinator B** | `/personnel/dashboard` | Login, BSBA-FM scope, Cross-Program Isolation | `POST /auth/login`<br>`GET /auth/me` | Authenticate, Coordinator role context active, BSBA-FM Program scope, Student A absent | Observed in Chrome: redirected to `/personnel/dashboard`, BSBA-FM Coordinator role context verified | 0 errors | 0 | **PASS (Browser + E2E)** |
| **Organization Moderator** | `/personnel/dashboard` | Login, DEMO_JPIA scope | `POST /auth/login`<br>`GET /auth/me` | Authenticate, Moderator role context active, DEMO_JPIA Organization scope | Observed in Chrome: redirected to `/personnel/dashboard`, Moderator role context verified | 0 errors | 0 | **PASS (Browser + E2E)** |

---

## 2. Direct Route Guard & Authorization Matrix

| Attempted Route | Context | Expected Navigation / Response | Actual Browser Observation | Result |
| :--- | :--- | :--- | :--- | :--- |
| `/hr-admin/dashboard` | Unauthenticated (Logged out) | Redirect to `/` or `/login` (no content flash) | Observed in Chrome: redirected immediately to `/` | **PASS** |
| `/osad-admin/dashboard` | Unauthenticated (Logged out) | Redirect to `/` or `/login` (no content flash) | Observed in Chrome: redirected immediately to `/` | **PASS** |
| `/hr-admin/dashboard` | Authenticated as Student A | Deny access, redirect to `/` / unauthorized | Observed in Chrome: redirected immediately to `/` | **PASS** |
| `/osad-admin/dashboard` | Authenticated as Student A | Deny access, redirect to `/` / unauthorized | Observed in Chrome: redirected immediately to `/` | **PASS** |
| `/hr-admin/personnel-directory` | Authenticated as Coordinator A | Deny access, redirect to `/` / unauthorized | Observed in Chrome: redirected immediately to `/` | **PASS** |
| `/osad-admin/academic-programs` | Authenticated as HR Admin | Deny access, redirect to `/` / unauthorized | Observed in Chrome: redirected immediately to `/` | **PASS** |

---

## 3. Sidebar & Role Navigation Matrix

| Persona | Navigation Item | Expected Visibility | Actual Browser Visibility | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Dashboard, Portfolio, Achievements, Notifications | Visible | Visible | **PASS** |
| **Student** | Personnel Directory, Evaluation Submissions, Ranking | Hidden / Absent | Hidden / Absent | **PASS** |
| **Student** | Academic Programs, Organizations, Potential Awards | Hidden / Absent | Hidden / Absent | **PASS** |
| **Personnel** | Dashboard, Accomplishments, Portfolio, Notifications | Visible | Visible | **PASS** |
| **HR Admin** | HR Dashboard, Personnel Directory, Evaluation Submissions, Ranking, Reset Requests | Visible | Visible | **PASS** |
| **HR Admin** | OSAD Student Organizations, Potential Awards | Hidden / Absent | Hidden / Absent | **PASS** |
| **OSAD Admin** | OSAD Dashboard, Academic Programs, Organizations, Potential Awards | Visible | Visible | **PASS** |
| **OSAD Admin** | HR Personnel Directory, HR Evaluation Ranking | Hidden / Absent | Hidden / Absent | **PASS** |

---

## 4. Cross-Cutting Browser & DevTools Gates

| Gate | Verification Target | Observed Browser / DevTools Evidence | Status |
| :--- | :--- | :--- | :--- |
| **DevTools Network Zero-Supabase** | `0` requests to `*.supabase.co`, `/auth/v1`, `/storage/v1` | **0 Supabase network requests** recorded out of 2,205 total requests | **PASS** |
| **DevTools Console** | No uncaught/blocking runtime errors | 0 blocking exceptions during normal workflows | **PASS** |
| **Session Persistence (Remember Me)** | Token kept in `localStorage` across page reloads | `achievenest_access_token` observed in `localStorage`; `/auth/me` restored session on reload | **PASS** |
| **Session-Only Storage** | Token kept in `sessionStorage` only when Remember Me disabled | `achievenest_access_token` observed in `sessionStorage`; no stale `localStorage` token | **PASS** |
| **Session Revocation (Logout)** | Storage cleared and redirected to `/login` | `localStorage` and `sessionStorage` cleared; user returned to `/login` | **PASS** |
| **Session Expiration (401 Interceptor)** | Storage cleared on 401 response | Stored tokens cleared and unauthenticated redirect dispatched | **PASS** |
| **File Safety Truthfulness** | Truthful evidence security status badge | UI reflects `security_status = pending`, `malware_scanner = none_deferred` (no false claims) | **PASS** |
| **Offline Usability** | Core application remains navigable without crashing | Offline CDP network emulation confirmed UI remains stable | **PASS** |
| **Static Department Remediation** | `ACTIVE-UI: 0`, `ACTIVE-LOGIC: 0`, 0 open blockers | 8 allowlisted entries; 0 active structural blockers | **PASS** |
| **Terminology Audit** | 0 Department Secretary hits, 0 prohibited visible texts | Automated terminology scan PASSED | **PASS** |
| **Automated Test Suite** | Full Vitest suite passes | 29 files / 190 of 190 tests PASSED | **PASS** |
| **Production Build & Lint** | Lint 0 errors, Vite build PASS | ESLint 0 errors, Vite production build PASS (3.44s) | **PASS** |
| **`git diff --check`** | 0 whitespace errors, 0 conflict markers | Clean diff | **PASS** |
