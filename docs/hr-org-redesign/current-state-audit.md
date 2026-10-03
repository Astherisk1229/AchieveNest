# Organizational Structure redesign audit

## Active route and data

- `/hr/organizational-structure` renders `HROrganizationalStructurePage.jsx`.
- The page uses `GET /api/v1/hr/organizational-structure`, which returns active Colleges, legacy administrative-unit rows exposed as `departments`, current Dean assignments, Dean history, and personnel placements.
- Dean assignment and reassignment continue through their existing canonical services and modals.
- Personnel detail uses `PersonnelDetailDrawer.jsx` and remains mounted over the current organizational workspace.

## Replaced interaction model

The former page automatically selected the first entity and permanently rendered an entity list beside a large detail pane. It also searched organizations, personnel, IDs, and positions from one global field. This caused competing scroll regions and blurred directory browsing with personnel management.

The active page now has two explicit levels:

1. An organization directory with Colleges and Offices & Units tabs and organization-only search.
2. A dedicated organization workspace. Colleges receive Overview and Personnel tabs; Offices & Units receive Personnel only and never display Dean controls.

Personnel search and classification filters now live inside the selected workspace. Closing personnel details leaves the selected organization, workspace tab, filters, query, and underlying page position intact.

## Terminology compatibility

The database and API retain `administrative_units` and the response key `departments` for compatibility. The rendered HR terminology is Offices & Units. No database entity was renamed.
