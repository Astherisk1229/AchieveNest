# Plan 02 Phase 1 Evidence: Backend Route & Endpoint Map

## Execution Timestamp
2026-09-01T11:43:30+08:00
Database: `achievenest_local`

---

## 1. Organization Route Inventory

| Method | Route | Controller | Action | Purpose | Caller / Frontend Consumer | Classification |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/osad/organizations` | `OrganizationController` | `index` | Lists all organizations with filters & joined moderator/programs | `organizationAdminService.fetchOrganizations` | CANONICAL |
| `GET` | `/api/v1/osad/organizations/{id}` | `OrganizationController` | `show` | Gets single organization details | `organizationAdminService.fetchOrganization` | CANONICAL |
| `POST` | `/api/v1/osad/organizations` | `OrganizationController` | `create` | Creates organization & program affiliations | `organizationAdminService.createOrganization` | CANONICAL |
| `GET` | `/api/v1/osad/organizations/{id}/logo` | `OrganizationController` | `logo` | Streams organization logo asset | `organizationAdminService.getOrganizationLogoUrl` | CANONICAL |
| `POST` | `/api/v1/osad/organizations/{id}/logo` | `OrganizationController` | `updateLogo` | Uploads/replaces organization logo | `organizationAdminService.updateOrganizationLogo` | CANONICAL |
| `DELETE` | `/api/v1/osad/organizations/{id}/logo` | `OrganizationController` | `deleteLogo` | Removes organization logo asset & DB metadata | `organizationAdminService.deleteOrganizationLogo` | CANONICAL |
| `GET` | `/api/v1/personnel/roles` | `PersonnelRoleController` | `index` | Lists active specialized role assignments | Legacy/General Admin | COMPATIBILITY |
| `POST` | `/api/v1/personnel/{id}/roles` | `PersonnelRoleController` | `assign` | Assigns specialized role (Dean, Coord, Moderator) | `PersonnelRoleController` | CANONICAL ROLE ENDPOINT |
| `DELETE` | `/api/v1/personnel/{id}/roles/{assignmentId}` | `PersonnelRoleController` | `revoke` | Soft-deactivates specialized role assignment | `PersonnelRoleController` | CANONICAL ROLE ENDPOINT |

---

## 2. Missing Backend Endpoints Identified
- `PUT /api/v1/osad/organizations/{id}`: MISSING (No route or controller method for editing organization master data).
- `PUT /api/v1/osad/organizations/{id}/programs`: MISSING (No dedicated endpoint to update academic program scope affiliations post-creation).
- `POST /api/v1/osad/organizations/{id}/reassign-moderator`: MISSING (No scoped organization endpoint for moderator assignment/reassignment; currently delegated to general `PersonnelRoleController`).
