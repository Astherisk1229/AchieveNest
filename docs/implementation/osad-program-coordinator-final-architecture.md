# AchieveNest — Academic Program & Program Coordinator Coverage
## Final Architecture Specification

---

### 1. Architectural Philosophy

The AchieveNest institutional governance model establishes a strict, unambiguous separation between **Institutional Master Data** and **Personnel Coverage Relationships**:

1. **Academic Programs (`academic_programs`)**:
   - Institutional curriculum entities representing degree programs offered under colleges.
   - Master data includes Program Code (acronym), Degree Title, Degree Level, Status, and Parent College ID.
   - Independent existence: Programs are created, edited, and maintained without requiring any coordinator assignment. Programs may permanently or temporarily remain in an `Unassigned` coverage state.

2. **Program Coordinator Assignments (`program_coordinator_assignments`)**:
   - Temporal, relational coverage records mapping active personnel profiles to academic programs.
   - Cardinality: **One coordinator may cover multiple programs (1:N)**, but **each program may have at most one active coordinator (N:1)**.
   - History Preservation: Reassignments and removals execute soft-deactivation (`is_active = 0`, `effective_until = CURRENT_DATE`), retaining permanent historical tenure for institutional audit and accreditation reporting.

---

### 2. Final Data Ownership Matrix

| Business Fact | Authoritative Source | Consumer | Invariant / Enforcement |
|---|---|---|---|
| Program Master Data | `academic_programs` | OSAD UI & APIs | Independent of coordinator; unique code per college |
| Program College Scope | `academic_programs.college_id` | OSAD Hierarchy | Foreign key -> `colleges.id` |
| Coordinator Identity | `profiles` + `personnel_profiles` | Coverage UI / Backend | Status must be `active` |
| HR Program Affiliation | `personnel_program_affiliations` | Eligibility Filter | HR-designated eligibility boundary |
| Active Program Coverage | `program_coordinator_assignments` | `CollegeService` | `uq_active_program_coordinator` constraint |
| Coverage Tenure History | `program_coordinator_assignments` | Audit / Reports | `effective_from`, `effective_until`, `is_active` |
| OSAD Authorization | `GovernancePolicy` | Controllers / APIs | Server-side role check (`osad_admin`) |
| UI State Display | Derived API Response | React Frontend | Derived strictly from live backend responses |

---

### 3. Database Schema & Relational Integrity

```text
       +-----------------------------------+
       |             colleges              |
       |  PK id                            |
       |     code, name, status...         |
       +-----------------+-----------------+
                         | 1
                         |
                         | 0..*
       +-----------------v-----------------+
       |         academic_programs         |
       |  PK id                            |
       |  FK college_id -> colleges.id     |
       |     code, name, degree_level...   |
       +-----------------+-----------------+
                         | 1
                         |
                         | 0..*
+------------------------v-------------------------+         +-------------------------+
|         program_coordinator_assignments          |         |        profiles         |
|  PK id                                           | 0..*   1|  PK id                  |
|  FK academic_program_id -> academic_programs.id  +---------+     full_name, email...   |
|  FK personnel_profile_id -> profiles.id          |         +------------+------------+
|     effective_from (DATE)                        |                      | 1
|     effective_until (DATE NULL)                  |                      |
|     is_active (TINYINT 1)                        |                      | 0..*
|     assigned_by, assigned_at                     |         +------------v------------+
|  VIRTUAL active_guard                            |         | personnel_program_      |
|  UNIQUE KEY uq_active_program_coordinator        |         | affiliations            |
+--------------------------------------------------+         +-------------------------+
```

---

### 4. Canonical Backend Architecture

- **Authoritative Service**: `App\Services\CollegeService`
- **Authoritative Controller**: `App\Controllers\Api\CollegeController`
- **Route Namespace**: `/api/v1/osad/`
- **Authorization Guard**: `App\Libraries\GovernancePolicy::canManageAcademicStructure($user)`
- **Concurrency & Transaction Safety**: All batch mutations execute inside explicit database transactions (`$db->transStart()` / `$db->transComplete()`).

---

### 5. Summary of Key Invariants

1. **No Redundant Fields**: `academic_programs` contains zero coordinator fields.
2. **Zero Hard-Deletes**: Coverage removals and reassignments use soft deactivation only.
3. **Database Guard**: Active coordinator uniqueness is enforced by generated virtual column `active_guard` and unique index `uq_active_program_coordinator`.
4. **Zero Frontend Source of Truth**: All UI badges and counts derive dynamically from backend state.
