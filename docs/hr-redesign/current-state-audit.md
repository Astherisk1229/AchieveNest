# HR redesign current-state audit

## Active surfaces

- `/hr/organizational-structure` renders `HROrganizationalStructurePage.jsx` and opens `PersonnelDetailDrawer.jsx` directly. The selected College, local filters, search text, active tab, and page scroll remain in the mounted page while the drawer is open.
- Personnel registration uses `TargetProvisioningController::manualPersonnel()` through `POST /api/v1/provisioning/manual-personnel`.
- Personnel edits use `TargetHRPersonnelController::updateMasterData()` through `PUT /api/v1/hr/personnel/{id}/master-data`.
- The Personnel Directory renders `PersonnelDirectoryTable.jsx` and `PersonnelActionsMenu.jsx`.

## Findings and implemented corrections

- Job title and rank were combined in both organizational and directory tables. They are now separate columns.
- The Directory action `Manage Roles` mixed unrelated responsibilities. It is replaced by `View Assignments`; Dean assignment remains in Organizational Structure.
- Organizational personnel actions used the technical label `Inspect`. They now use `View Details`.
- The old detail UI was a small modal with a `View Full Record` detour to Personnel Directory. It is now a full-height contextual panel with Overview, Portfolio, Assignments, and Evaluation Summary tabs. Only `Open Full Evaluation Record` routes away.
- The existing College leadership implementation recognizes Dean only and already contains assign, reassign, and history flows. Department Secretary is not rendered as leadership.
- Department Secretary was an unrestricted free-text job title. Creation and edit now share an authoritative transactional occupancy service.

## Remaining data limitations

- The directory payload currently exposes portfolio/evaluation summary fields, not a dedicated per-tab contextual API. The panel therefore renders overview immediately and reads supported summary fields without triggering full-page refetches.
- Job titles are not normalized in a catalog table, so the only approved restricted title is centrally declared by the occupancy service rather than distributed through controllers.
