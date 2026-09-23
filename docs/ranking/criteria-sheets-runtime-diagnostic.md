# Criteria Sheets Runtime Diagnostic

Date: 2026-09-12 (Asia/Manila)

## Root cause

**Frontend API contract mismatch.** `apiClient` returns the parsed HTTP body, and `fetchEvaluationScalesCatalogue()` then returns that body's `data` property. For the live catalogue response this is already an array of two scales. `PersonnelEvaluationSetupPage` did not accept an array at the top level; it looked only for `payload.data`, `payload.data.scales`, or `payload.scales`, replaced the valid response with `[]`, and rendered an empty bordered container without an empty-state message.

The repair normalizes direct arrays and the supported wrapped response shapes. The Criteria Sheets overview now also has an explicit empty state, visible Active status, and keyboard focus treatment on its actions.

## Live route and data path

- Frontend route: `/hr/personnel-evaluation-setup` (Ranking Setup, Criteria Sheets tab)
- Catalogue request: `GET /api/v1/admin/evaluation-scales`
- Live result: HTTP 200, 3,829 bytes, 130 ms, root keys `success,data`, 2 rows
- Personnel groups: `FACULTY`, `NON_TEACHING_FACULTY`
- Faculty detail: `GET /api/v1/admin/evaluation-scales/versions/ver-admin-2025-001`, HTTP 200, 3 areas
- Non-Teaching detail: `GET /api/v1/admin/evaluation-scales/versions/ver-ntp-2025-001`, HTTP 200, 2 areas

## Live MySQL reconciliation

| Sheet | Version | Status | Maximum | Passing | Areas | Categories | Subcategories | Options |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| `scale-admin-001` / `ADMINISTRATORS_RANKING_SCALE` | `ver-admin-2025-001` / 1.0.0 | approved | 160 | 120 | 3 | 12 | 14 | 52 |
| `scale-ntp-001` / `NON_TEACHING_PERSONNEL_RANKING_SCALE` | `ver-ntp-2025-001` / 1.0.0 | approved | 150 | 75 | 2 | 8 | 9 | 14 |

Both rows contain their official-source title metadata. No period references, evaluation results, seed data, or unrelated migrations were changed during this repair.

## Browser verification status

The local API and Vite application were started successfully. Authenticated live API requests were verified as recorded above. The in-app browser controller could not initialize because its runtime reported `failed to write kernel assets: The system cannot find the path specified (os error 3)`. The same environment failure prevented loading its recovery documentation. Therefore no browser screenshot or console capture is claimed in this report; visual browser verification remains blocked by the browser-control environment, not by an observed application error.
