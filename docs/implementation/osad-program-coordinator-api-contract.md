# AchieveNest — Academic Program & Program Coordinator Coverage
## Canonical API Contract Specification

---

### 1. Endpoint Catalog

All routes reside under the authoritative `/api/v1/osad/` namespace, protected by `auth` filter and `GovernancePolicy::canManageAcademicStructure`.

| Method | Endpoint | Controller Action | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/osad/academic-programs` | `CollegeController::listPrograms` | Lists all programs with joined coordinator name |
| `POST` | `/api/v1/osad/academic-programs` | `CollegeController::createProgram` | Creates academic program (master data only) |
| `PUT` | `/api/v1/osad/academic-programs/{id}` | `CollegeController::updateProgram` | Updates academic program master data |
| `GET` | `/api/v1/osad/colleges/{id}/coordinator-personnel` | `CollegeController::listCoordinatorPersonnel` | Lists eligible personnel under a college |
| `GET` | `/api/v1/osad/colleges/{id}/coordinator-personnel/{profileId}` | `CollegeController::getPersonnelCoordinatorContext` | Gets personnel eligibility & assignment context |
| `PUT` | `/api/v1/osad/colleges/{id}/coordinator-personnel/{profileId}` | `CollegeController::updatePersonnelCoordinatorAssignments` | Batch multi-program assignment update |
| `POST` | `/api/v1/osad/colleges/{id}/reassign-coordinator` | `CollegeController::reassignCoordinator` | Atomic coordinator reassignment |

---

### 2. Request & Response Payload Specifications

#### 2.1 `GET /api/v1/osad/academic-programs`
- **Query Params**: `college_id` (optional, string/uuid)
- **Response**:
```json
{
  "status": 200,
  "data": [
    {
      "id": "30000000-0000-0000-0000-000000000001",
      "college_id": "20000000-0000-0000-0000-000000000001",
      "college_code": "CET",
      "college_name": "College of Engineering and Technology",
      "acronym_badge_color": "#16834A",
      "code": "BSCS",
      "name": "Bachelor of Science in Computer Science",
      "degree_level": "undergraduate",
      "status": "active",
      "coordinator_name": "Cynthia Ramos"
    }
  ]
}
```

#### 2.2 `POST /api/v1/osad/academic-programs`
- **Request Body**:
```json
{
  "college_id": "20000000-0000-0000-0000-000000000001",
  "code": "BSCS",
  "name": "Bachelor of Science in Computer Science",
  "degree_level": "undergraduate"
}
```
- **Response**: `201 Created` with created program entity.

#### 2.3 `PUT /api/v1/osad/academic-programs/{id}`
- **Request Body**:
```json
{
  "code": "BSCS",
  "name": "Bachelor of Science in Computer Science",
  "degree_level": "undergraduate",
  "status": "active"
}
```
- **Response**: `200 OK` with updated program master data entity.

#### 2.4 `PUT /api/v1/osad/colleges/{id}/coordinator-personnel/{profileId}`
- **Request Body**:
```json
{
  "program_ids": [
    "30000000-0000-0000-0000-000000000001",
    "30000000-0000-0000-0000-000000000002"
  ]
}
```
- **Response**: `200 OK`
```json
{
  "status": 200,
  "data": {
    "message": "Program Coordinator assignments updated successfully.",
    "diff": {
      "kept": ["30000000-0000-0000-0000-000000000001"],
      "added": ["30000000-0000-0000-0000-000000000002"],
      "removed": []
    }
  }
}
```

#### 2.5 `POST /api/v1/osad/colleges/{id}/reassign-coordinator`
- **Request Body**:
```json
{
  "program_id": "30000000-0000-0000-0000-000000000001",
  "new_coordinator_profile_id": "10000000-0000-0000-0000-000000000008"
}
```
- **Response**: `200 OK`
```json
{
  "status": 200,
  "data": {
    "message": "Program Coordinator reassigned successfully.",
    "program_id": "30000000-0000-0000-0000-000000000001",
    "program_code": "BSCS",
    "previous_coordinator": "Cynthia Ramos",
    "new_coordinator": "Carlos Mendoza",
    "reassigned": true
  }
}
```

---

### 3. Legacy Route Disposition

- **Legacy Route**: `POST /api/v1/admin/personnel-roles/assign` (in `PersonnelRoleController`).
- **Disposition**: Deprecated compatibility path. All active OSAD frontend features strictly consume the canonical `/api/v1/osad/` routes above.
- **Frontend Deprecation Status**: 0 calls in active frontend codebase.
