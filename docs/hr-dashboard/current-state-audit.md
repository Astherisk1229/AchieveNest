# HR Dashboard current-state audit

## Active route

`/hr/dashboard` renders `HRDashboardPage.jsx` directly through `App.jsx`.

## Previous behavior

The page used the unscoped `useHR()` hook. Opening the dashboard fetched the personnel directory, dashboard aggregation, all password-reset data, and 50 audit entries, while also initializing legacy client-side accomplishment models. The rendered overview repeated evaluation counts across Operational Overview, Current Workload, Pending HR Actions, and evaluation cards. It also embedded legacy HR modules behind query-string tabs and exposed a global Dean-assignment modal.

## Implemented query ownership

- Dashboard summary: `GET /api/v1/hr/dashboard`.
- Evaluation cycle: existing current personnel evaluation-period endpoint.
- Recent activity: `GET /api/v1/hr/audit?per_page=5`.

These requests load independently. Existing section content remains visible during background refresh. The dashboard endpoint now also returns active Personnel, College, Office/Unit, and College-without-Dean counts so the page does not fetch the full Personnel Directory or Organizational Structure payload.

## Routing confirmation

- Review Queue → `/hr/evaluation-submissions`
- View Colleges / View Organization → `/hr/organizational-structure`
- View Personnel → `/hr/personnel-directory`
- View Audit Trail → `/hr/audit-trail`
- Manage Setup → `/hr/personnel-evaluation-setup`

Dean assignment is no longer present on the dashboard and remains owned by Organizational Structure.
