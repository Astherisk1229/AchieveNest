# AchieveNest Current Data Loading Flow

Audit date: 2026-09-12. Evidence sources are active React routes, hooks and services, CodeIgniter routes/controllers, live MySQL, and local HTTP probes. Browser paint/commit timings are **Not Confirmed** because the connected browser runtime was unavailable.

## Application boot and authenticated navigation

```text
main.jsx (React StrictMode in development)
  -> App / AuthProvider
  -> synchronously restore stored user snapshot
  -> GET /api/v1/auth/me when a token exists
  -> LayoutShell blocks protected content with RouteLoadingFallback
  -> validate account type, assigned role, password-change state
  -> render persistent MainLayout + lazy route chunk
  -> route component effects/hooks issue page requests
  -> state update and render
```

On a browser refresh, the stored identity is available synchronously but protected route content waits for `/auth/me`. This is security-compatible but produces a full route fallback rather than a shell with section-level loading. On sidebar navigation within one account-type layout, `MainLayout` remains mounted and only the outlet changes. Role switching updates local context and uses client navigation; it does not hard reload the browser.

Login is necessarily sequential: `POST /auth/login`, then authenticated `GET /auth/me`, then route navigation. Live baseline: login 934.5 ms and `/auth/me` 204.2 ms. The profile request is now deduplicated when development Strict Mode mounts the restoration effect concurrently.

## Page categories

| Category | Active loading flow | Loading behavior |
|---|---|---|
| Login | Login mutation, then `/auth/me`, then navigate | Localized submit state; auth calls are required sequential |
| Shared account/settings | Stored user; mutations only unless page needs notifications | Shell persists |
| Notifications | `NotificationPopover` fetches `/notifications` on layout mount; Notifications page fetches again when opened | Page and popover are separate consumers; cross-route duplicate remains a P2 candidate |
| Student dashboard | Primarily controller/local model data | No confirmed page API request |
| Student achievements | `useStudentAchievements` -> `GET /portfolio` | Page-level initial loading; evidence downloads only on demand |
| Student portfolio | `GET /portfolio?status=verified` | Page effect; evidence binary not fetched until download/open |
| Personnel dashboard | Local/default profile and accomplishments plus current evaluation period | Page content can render around the period request |
| Personnel portfolio editor | Three independent initial requests in `Promise.all`: accomplishments, latest submission, history; configuration and period also parallel | Full primary workspace loading for the first group |
| Program coordinator | Verification hook -> `/program-coordinator/verification-queue` | Role-specific route under persistent personnel shell |
| Dean | Reviewer/evaluation services load queue/detail on demand | Role-specific route under persistent personnel shell |
| HR dashboard | Broad `useHR` loads directory, dashboard, reset queue and audit concurrently; period is separate | One broad page loading state still waits for all four |
| HR Personnel Directory | After fix: directory + reset queue concurrently; colleges/programs/units concurrently and cached | Directory no longer requests HR dashboard/audit |
| HR Organizational Structure | One `/hr/organizational-structure` request | Page-level skeleton; refresh currently hides content (P2 remaining) |
| HR evaluation | `/reviewer/evaluations` plus detail requests on demand | Route-specific |
| OSAD dashboard | Organizations, colleges and programs start independently in the same effect | Independent section loading flags |
| Organization moderator | Organization/event/certificate endpoints are owned by their workspaces | Evidence/certificates load when the relevant view opens |

## Reload, refetch, and cache behavior

- Browser refresh rebuilds JavaScript state, validates `/auth/me`, lazy-loads the route, and refetches page data.
- Client navigation preserves the shell but route components generally remount and refetch; there is no application-wide query cache.
- A five-minute in-memory cache now covers personnel placement reference data. It deduplicates concurrent requests and keeps fresh values across route remounts in the same tab.
- The cache never authorizes access; backend authorization remains authoritative.
- Mutations generally call route-level `refreshData()` or `reload()`. The only hard redirect found is the error-boundary recovery to `/login`; this is a destructive recovery action, not routine synchronization.
- File metadata is loaded with records; evidence/PDF blobs are requested on explicit preview/download. Local document-preview object URLs are scoped to modal lifecycles.

## Confirmed architectural explanation

AchieveNest felt unlike a conventional responsive system because protected refreshes blocked the route while session validation completed, most page data was held only in component memory, several route hooks fetched broad datasets, and page-wide booleans often replaced usable content with skeletons during refetch. The shell is already persistent during ordinary navigation, so the application is not universally rebuilding on every click. Browser rendering cost and Core Web Vitals remain **Not Confirmed** pending an available browser trace.
