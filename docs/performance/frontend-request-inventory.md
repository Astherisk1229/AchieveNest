# AchieveNest Frontend Request Inventory

Audit date: 2026-09-12. “Measured” values use the local CodeIgniter development server and live `achievenest_local` MySQL. Other rows are source inventories and are labeled accordingly.

## Live HR measurements

| Page | Request | Trigger | Dependency | Parallel | Baseline status / avg | Payload | Duplicate/unneeded |
|---|---|---|---|---|---:|---:|---|
| Login | `POST /auth/login` | submit | credentials | No | 200 / 934.5 ms | not captured | No |
| Refresh | `GET /auth/me` | AuthProvider mount | token | No, blocks route | 200 / 204.2 ms | 1,709 B | Dev duplicate risk fixed |
| HR Directory | `GET /hr/personnel?per_page=100` | `useHR` mount | auth | Yes | 200 / 482.0 ms before | 95,568 B | Required |
| HR Directory | `GET /password-reset-requests` | `useHR` mount | auth | Yes | 200 / 322.2 ms before | 90 B | Used for reset tab/count |
| HR Directory, before | `GET /hr/dashboard` | broad `useHR` | auth | Yes | 500 / 186.2 ms | error | Unneeded; removed |
| HR Directory, before | `GET /hr/audit?per_page=50` | broad `useHR` | auth | Yes | 200 / 222.1 ms | 27,364 B | Unneeded; removed |
| HR Directory | `GET /osad/colleges` | master-data effect | auth | Yes | 200 / 364.9 ms | 10,826 B | Cached 5 min |
| HR Directory | `GET /osad/academic-programs` | master-data effect | auth | Yes | 200 / 194.1 ms | 7,015 B | Cached 5 min |
| HR Directory | `GET /administrative-units` | master-data effect | auth | Yes | 404 / 203.0 ms | error | Confirmed missing route; seeded fallback, P2 |
| HR Organization | `GET /hr/organizational-structure` | page mount | auth | N/A | 200 / 248.6 ms | 38,164 B | No duplicate confirmed |

The directory request count fell from 7 to 5 per cold route mount. Warm same-tab remounts can reuse the three reference-data results, leaving 2 requests. In development, concurrent duplicate reference calls are coalesced.

## Source inventory by important page

| Page/module | Initial requests | Classification |
|---|---|---|
| Login | `/auth/login` -> `/auth/me` | Required Sequential |
| Profile/account | none initially beyond auth; password change is a mutation | Deferred mutation |
| Notifications page | `/notifications` | Independent; duplicate with mounted popover possible |
| Student Home | no page API found | Local/model-backed |
| Student Achievements | `/portfolio` | Required page data |
| Student Portfolio | `/portfolio?status=verified` | Required page data |
| Student achievement submission | create -> evidence upload -> optional resubmit | Required Sequential mutation |
| Student evidence | `/evidence/student/{id}/download` | Deferred/on demand |
| Personnel Home | `/personnel/evaluation-period/current` | Independent secondary data |
| Personnel Portfolio/Edit | accomplishments + latest submission + history in parallel; workspace configuration + current period in parallel | Independent / Parallel |
| Personnel evidence/OCR | evidence upload, then extraction/read endpoints | Required Sequential; on action, not list load |
| Program Coordinator queue | `/program-coordinator/verification-queue` | Required role data |
| Dean/HR evaluation list | `/reviewer/evaluations` | Required role data; detail deferred |
| HR Dashboard | directory, dashboard, password resets, audit concurrently; current period separately | Parallel but broad; slowest blocks broad state |
| HR Personnel Directory | directory + resets; colleges + programs + units | Parallel; reference data cacheable |
| HR Organization Structure | `/hr/organizational-structure` | Required page data |
| HR Dean assignment | mutation then route refetch | Correct refetch, no hard reload |
| HR Evaluation Setup | `/hr/personnel-evaluation-periods` and current-period APIs | Required route data |
| OSAD Dashboard | `/osad/organizations`, `/osad/colleges`, `/osad/academic-programs` | Independent / Parallel |
| OSAD awards | `/osad/awards`, candidates after award selection | Required Sequential selection dependency |
| Organization/events/attendance/certificates | workspace-specific endpoints | Route or interaction scoped; binary content deferred |

## Duplicate and waterfall findings

| Endpoint/resource | Calls before | Calls after | Cause/status |
|---|---:|---:|---|
| HR dashboard from Personnel Directory | 1 | 0 | Broad hook scope; fixed |
| HR audit from Personnel Directory | 1 | 0 | Broad hook scope; fixed |
| `/auth/me` during concurrent Strict Mode restoration | up to 2 in development | 1 | In-flight promise deduplication; fixed |
| Personnel reference data on same-tab remount | 3 | 0 while fresh | Five-minute memory cache; fixed |
| Notifications popover + Notifications page | 2 consumers | 2 | Not yet consolidated; P2 |

## Not confirmed

Network waterfall screenshots, browser TTFB breakdown, FCP/LCP/CLS/INP, React render counts, and commit duration could not be captured because the browser-control runtime did not initialize. No numeric claims are made for those metrics.
