# AchieveNest — OSAD Organization Creation & Management
## Final API Contract Document
**Authoritative HTTP Endpoints & Payload Specifications**

---

### 1. List Organizations

- **Method / Route**: `GET /api/v1/osad/organizations`
- **Controller Action**: `OrganizationController::index`
- **Auth**: OSAD Administrator
- **Query Parameters**:
  - `status`: `all` | `active` | `inactive` | `archived`
  - `category`: `all` | `<category_key>`
  - `scope`: `all` | `university` | `college` | `program`
- **Response**: `200 OK`
  ```json
  {
    "organizations": [
      {
        "id": "uuid",
        "code": "PSITS",
        "name": "Philippine Society of Information Technology Students",
        "category": "academic_college",
        "scope": "program",
        "college_id": "uuid",
        "college_code": "CS",
        "college_name": "College of Computer Studies",
        "status": "active",
        "moderator_name": "Dr. Juan Dela Cruz",
        "moderator_profile_id": "uuid",
        "program_ids": ["uuid-1", "uuid-2"],
        "configuration_status": "COMPLETE"
      }
    ]
  }
  ```

---

### 2. Create Organization

- **Method / Route**: `POST /api/v1/osad/organizations`
- **Controller Action**: `OrganizationController::create`
- **Auth**: OSAD Administrator
- **Payload**: JSON or `multipart/form-data`
  ```json
  {
    "name": "Computer Science Society",
    "code": "CSS",
    "category": "academic_college",
    "scope": "program",
    "college_id": "uuid",
    "program_ids": ["uuid-1"],
    "moderator_profile_id": "uuid"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "message": "Student organization created successfully.",
    "organization": { "id": "uuid", "..." : "..." },
    "program_scope": [...],
    "current_moderator": { ... },
    "configuration_status": "COMPLETE"
  }
  ```

---

### 3. Get Organization Details

- **Method / Route**: `GET /api/v1/osad/organizations/{id}`
- **Controller Action**: `OrganizationController::show`
- **Auth**: OSAD Administrator
- **Response**: `200 OK`
  ```json
  {
    "organization": {
      "id": "uuid",
      "code": "CSS",
      "name": "Computer Science Society",
      "programs": [
        { "id": "uuid", "code": "BSCS", "name": "BS in Computer Science" }
      ],
      "current_moderator": {
        "assignment_id": "uuid",
        "profile_id": "uuid",
        "full_name": "Prof. Alan Turing",
        "email": "alan.turing@ndmu.edu.ph",
        "effective_from": "2026-09-01"
      },
      "moderator_history": [
        {
          "assignment_id": "uuid",
          "profile_id": "uuid",
          "full_name": "Prof. Ada Lovelace",
          "effective_from": "2025-06-01",
          "effective_until": "2026-08-31",
          "is_active": 0
        }
      ]
    }
  }
  ```

---

### 4. Update Organization Master Data

- **Method / Route**: `PATCH /api/v1/osad/organizations/{id}`
- **Controller Action**: `OrganizationController::update`
- **Auth**: OSAD Administrator
- **Payload**:
  ```json
  {
    "name": "Updated Organization Name",
    "code": "UON",
    "category": "co_curricular",
    "scope": "university",
    "status": "active"
  }
  ```
- **Response**: `200 OK`

---

### 5. Add Program Scope

- **Method / Route**: `POST /api/v1/osad/organizations/{id}/programs`
- **Controller Action**: `OrganizationController::addPrograms`
- **Auth**: OSAD Administrator
- **Payload**:
  ```json
  {
    "program_ids": ["uuid-1", "uuid-2"]
  }
  ```
- **Response**: `200 OK`

---

### 6. Remove Program Scope

- **Method / Route**: `DELETE /api/v1/osad/organizations/{id}/programs/{programId}`
- **Controller Action**: `OrganizationController::removeProgram`
- **Auth**: OSAD Administrator
- **Response**: `200 OK`

---

### 7. Assign / Reassign Moderator

- **Method / Route**: `POST /api/v1/osad/organizations/{id}/moderator`
- **Controller Action**: `OrganizationController::assignModerator`
- **Auth**: OSAD Administrator
- **Payload**:
  ```json
  {
    "personnel_profile_id": "uuid"
  }
  ```
- **Response**: `200 OK`

---

### 8. Remove Moderator

- **Method / Route**: `DELETE /api/v1/osad/organizations/{id}/moderator`
- **Controller Action**: `OrganizationController::removeModerator`
- **Auth**: OSAD Administrator
- **Response**: `200 OK`

---

### 9. Logo Management

- **Fetch Logo**: `GET /api/v1/osad/organizations/{id}/logo` (200 OK / 404 Not Found, Stream)
- **Upload Logo**: `POST /api/v1/osad/organizations/{id}/logo` (`multipart/form-data` with `logo` file)
- **Delete Logo**: `DELETE /api/v1/osad/organizations/{id}/logo` (200 OK)
