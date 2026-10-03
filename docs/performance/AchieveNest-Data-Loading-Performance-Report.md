# AchieveNest Data Loading Performance Report

## 1. Executive Summary

The audit confirmed three material causes of avoidable HR loading work: an over-broad directory hook issued two unrelated requests, the live HR dashboard endpoint always failed against schema drift, and the active personnel-directory controller performed three database queries per returned personnel row. For the current 27-row dataset, application-issued directory queries fell from 89 to 13. A comparable five-run HTTP average improved from 482.0 ms to 390.0 ms (92.0 ms, 19.1%). The cold HR Directory request inventory fell from seven calls to five; warm same-tab remounts can use cached reference data and issue two.

The application already preserves its shell during ordinary client navigation and does not routinely hard reload. Its unusual perceived behavior comes from refresh-time auth blocking, route-local data with little reuse, broad fetch ownership, and page-wide loading booleans. Browser paint/render metrics are **Not Confirmed** because the connected browser runtime was unavailable.

## 2. Current Loading Architecture

React restores a local user snapshot, revalidates it with `/auth/me`, authorizes the route, lazy-loads the route chunk, and then mounts page effects. Axios attaches the bearer token to every request. CodeIgniter resolves the actor again server-side, runs controller queries against MySQL, serializes JSON, and React updates component state. Backend checks remain authoritative; the new cache only stores non-sensitive reference data in memory.

See `current-data-loading-flow.md` for role/page flows and `frontend-request-inventory.md` for the request catalog.

## 3. Page-by-Page Measurements

| Page/API | Runs | Status | Average | Payload | Server/DB evidence |
|---|---:|---:|---:|---:|---|
| Login | 1 | 200 | 934.5 ms | Not captured | End-to-end client probe |
| Session `/auth/me` | 1 | 200 | 204.2 ms | 1,709 B | End-to-end client probe |
| HR Directory before | 5 | 200 | 482.0 ms | 95,568 B | 89 application queries derived from active controller and 27 returned rows |
| HR Directory after | 7 | 200 | 390.0 ms | 95,568 B | 13 queries; server work 47.1–130.3 ms, DB/controller segment 38.3–120.0 ms |
| HR Dashboard before | 3 | 500 | 186.2 ms | error | Unknown `assigned_office` column |
| HR Dashboard after | 5 | 200 | 280.7 ms | 339 B | Instrumented sample: auth 11.6 ms, DB 4.7 ms, 4 queries |
| HR Organization Structure | 1 | 200 | 248.6 ms | 38,164 B | Client probe only |

Local PowerShell HTTP timing includes development-server scheduling and client overhead. Server-Timing isolates measured controller-side auth/database work where instrumentation was added.

## 4. Request Waterfall Findings

Login’s authentication then profile fetch is required sequential behavior. Page data calls are generally parallel. The confirmed waste was breadth, not a sequential waterfall: HR Directory issued directory, dashboard, password reset, audit, colleges, programs and units together, and a page-wide state waited for the broad hook. Dashboard and audit were removed from that route. The current personnel portfolio editor correctly uses `Promise.all` for independent initial datasets.

## 5. Frontend Findings

### PERF-001 — HR Directory over-fetch

**Evidence:** Seven cold requests from active source ownership; dashboard and audit responses were unused by the primary directory view. Audit payload alone was 27,364 B. **Fix:** `useHR` accepts an explicit resource scope; Directory asks only for directory and reset resources. **Status:** Confirmed / Fixed.

### PERF-002 — Concurrent/remount duplicate reference requests

**Evidence:** React Strict Mode is enabled; effects mount in development, and reference services had no cache/in-flight ownership. **Fix:** small memory cache with in-flight coalescing and a five-minute TTL for colleges, programs and units. `/auth/me` now shares an in-flight promise for the same token. **Status:** Code-confirmed / Fixed; browser network screenshot unavailable.

### Loading-state architecture

Protected refresh uses a route-wide fallback until `/auth/me` completes. Several pages use one loading boolean and replace content on refresh; Organization Structure is a confirmed example. Directory refresh behavior remains route-level and is a P2 refinement. No routine mutation-driven `window.location.reload()` was found. The sole `window.location.href='/login'` is explicit error-boundary recovery.

## 6. Backend Findings

### PERF-003 — Active Directory N+1 queries

**Evidence:** The active `TargetHRPersonnelController` ran program, role and latest-evaluation queries inside the row loop. With 27 rows: 6 schema checks + count + list + (27 × 3) = 89 application-issued queries. **Fix:** batch programs, three assignment tables and evaluations for all returned IDs, then map in memory. After count: 13. **Impact:** query count -85.4%; client average -19.1%. **Status:** Confirmed / Fixed.

### PERF-004 — HR Dashboard schema-drift failure

**Evidence:** HTTP 500 and CodeIgniter/MySQL error `Unknown column 'assigned_office'`; live `SHOW COLUMNS` confirmed the column is absent. **Fix:** count pending reset requests by joining profiles and filtering `account_type='personnel'`, matching the active reset-list controller. **Status:** Confirmed / Fixed.

Development-only instrumentation now emits `[PERF] API` client records and `Server-Timing`, `X-Request-ID`, `X-Query-Count`, and safe server log entries for the two measured HR endpoints. It logs no tokens, passwords, or file contents.

## 7. Database Findings

| Endpoint/query | Before queries | After | DB evidence | Fix |
|---|---:|---:|---|---|
| HR Personnel Directory, 27 rows | 89 | 13 | Active controller trace; post-fix `X-Query-Count` | Batched affiliations, assignments and latest evaluations |
| HR Dashboard reset count | failed | 1 valid join/count | Live schema + 500 log | Align query with MySQL schema |

The personnel profile filter uses `idx_profiles_account_type_status`; EXPLAIN estimated 27 rows and reported a filesort for name ordering. No new index was added because the dataset and measured DB segment do not establish that filesort as a material bottleneck.

## 8. Payload Findings

The largest measured metadata response was HR Directory at 95,568 B for 27 records (requested limit 100). It includes extensive readiness, placement, roles and evaluation metadata but no attachment binaries. Audit was 27,364 B and was eliminated from Directory. Evidence/PDF binaries are loaded on explicit preview/download, not as part of list metadata. Pagination exists in backend APIs, although the HR frontend deliberately requests 100 records; server-driven paging remains P2 before larger production datasets.

The production build also measured a 412.55 kB main JavaScript chunk (120.02 kB gzip), a 401.17 kB OSAD Dashboard route chunk (73.72 kB gzip), a 233.28 kB Personnel Dashboard chunk (42.13 kB gzip), and a 1,133.04 kB campus-banner image. Route splitting is active, but the OSAD/Personnel chunks and banner are evidence-backed P2 bundle/image candidates; they were not changed without browser LCP/usage measurements.

## 9. Loading UX Findings

Why it did not feel like other systems: a refresh waits for server session validation before rendering the protected shell; return navigation remounts pages without a general data cache; broad hooks can make a fast section wait for unrelated data; and some refetches replace existing content with a skeleton. The improved Directory requests only its resources and reuses fresh reference data. Security-sensitive authorization is never accepted from cache alone.

## 10. Before/After Benchmark

| Metric | Before | After | Difference |
|---|---:|---:|---:|
| HR Directory cold page API requests | 7 | 5 | -28.6% |
| HR Directory warm same-tab API requests | 7 | 2 | -71.4% |
| Unused Directory payload measured | at least 27,364 B + failed dashboard | 0 | eliminated |
| Directory application queries (27 rows) | 89 | 13 | -85.4% |
| Directory HTTP average | 482.0 ms (5 runs) | 390.0 ms (7 runs) | -19.1% |
| Dashboard response | HTTP 500 | HTTP 200 | repaired |

## 11. Implemented Fixes

| File/module | Change | Risk/control |
|---|---|---|
| `useHR.js` | Explicit resource ownership | Default remains all resources for existing consumers |
| `HRPersonnelDirectoryPage.jsx` | Requests only directory/reset datasets | No business data removed from the route |
| `requestCache.js` / master-data service | TTL cache + in-flight dedup | Memory-only, reference data only, failure evicts entry |
| `authService.js` | Same-token `/auth/me` in-flight dedup | Every new restoration still validates server-side |
| `apiClient.js` | Development timing records | Production disabled unless explicitly enabled |
| `TargetHRPersonnelController.php` | Batch N+1 relations/evaluations | Same response fields; live payload size unchanged |
| `HRPersonnelController.php` | Schema-compatible dashboard count + timing | Matches reset controller’s personnel ownership rule |

## 12. Remaining Issues

- Browser Core Web Vitals, paint timing, request waterfall screenshots, and React Profiler commits: **Not Confirmed**.
- `/administrative-units` returns 404 and costs about 203 ms on the first Directory visit before falling back to seeded data. A canonical HR-readable endpoint should be designed rather than silently invented.
- Notification popover and full Notifications page can independently request the same feed.
- Organization Structure clears usable content during refresh.
- HR requests up to 100 directory rows and filters/sorts client-side; production-scale pagination needs a dataset benchmark.
- The current response’s correlated scalar subqueries run inside one SQL statement. They are not application N+1 calls, but should be profiled with production-size data before rewriting.

## 13. Validation

Live probes used authenticated HR access against local CodeIgniter/MySQL. The post-fix directory returned the same 95,568-byte payload size, indicating DTO shape preservation. PHP syntax checks passed. Targeted frontend verification passed 39 tests; backend verification passed 10 tests with 25 assertions; and the Vite production build completed successfully. Browser-specific validation remains outstanding due to unavailable browser control.

## 14. Conclusion

The primary measured HR Directory delay was identified as excessive request ownership plus an active-controller N+1 pattern, and both improved measurably without weakening authorization or changing business rules. The dashboard’s guaranteed failure was also repaired. AchieveNest now performs less redundant work and exposes repeatable timing evidence, but a browser-enabled follow-up is still required before claiming improvements to FCP, LCP, React rendering, or perceived performance across every role.
