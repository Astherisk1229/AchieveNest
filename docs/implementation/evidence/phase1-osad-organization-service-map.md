# Plan 02 Phase 1 Evidence: Service Layer & Architecture Map

## Execution Timestamp
2026-09-01T11:43:30+08:00
Database: `achievenest_local`

---

## 1. Backend Service Layer: `OrganizationService.php`

- **Location**: `backend/app/Services/OrganizationService.php`
- **Responsibilities**:
  - `listOrganizations(?string $status, ?string $category, ?string $scope)`: Queries `organizations`, joins `colleges`, subqueries active moderator from `organization_moderator_assignments`, and joins affiliations from `organization_program_affiliations`.
  - `getOrganization(string $id)`: Fetches single organization with joined college, moderator, and program affiliation array.
  - `createOrganization(array $data, ?array $logoFile)`: Validates category, scope, and code uniqueness; inserts into `organizations` and `organization_program_affiliations` inside a transaction; saves logo to internal storage if provided.
  - `updateLogo(string $organizationId, array $logoFile)`: Validates and replaces logo file.
  - `deleteLogo(string $organizationId)`: Removes logo metadata and deletes stored asset.
  - `getLogoPath(string $organizationId)`: Resolves filesystem path and MIME type for logo streaming.
- **Service Gaps Identified**:
  - No `updateOrganization(string $id, array $data)` method.
  - No `updateProgramAffiliations(string $id, array $programIds)` method.
  - No dedicated `reassignModerator(string $orgId, string $newModeratorProfileId)` method in `OrganizationService`.

---

## 2. Frontend Service Layer: `organizationAdminService.js`

- **Location**: `frontend/src/services/organizationAdminService.js`
- **Methods**:
  - `fetchOrganizations(filters)` -> `GET /osad/organizations`
  - `fetchOrganization(id)` -> `GET /osad/organizations/{id}`
  - `createOrganization(payload)` -> `POST /osad/organizations`
  - `updateOrganizationLogo(id, file)` -> `POST /osad/organizations/{id}/logo`
  - `deleteOrganizationLogo(id)` -> `DELETE /osad/organizations/{id}/logo`
  - `getOrganizationLogoUrl(id)` -> returns `/api/v1/osad/organizations/{id}/logo`
- **Service Gaps Identified**:
  - No `updateOrganization` API client method.
  - No `updateOrganizationPrograms` API client method.
  - No `assignOrganizationModerator` / `reassignOrganizationModerator` API client method in `organizationAdminService.js`.
