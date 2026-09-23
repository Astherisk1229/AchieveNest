# AchieveNest — OSAD Organization Creation & Management
## Final Technical Architecture Document
**Authoritative Architecture & Data Ownership Specification**

---

### 1. Architectural Overview

The Student Organization architecture in AchieveNest provides authoritative, normalized, and transactional management of student organizations within the Office of Student Affairs & Services (OSAD).

The architecture separates organizational master data from dynamic relational associations (academic program scope) and historical governance tenures (organization moderator assignments).

```
┌─────────────────────────────────────────────────────────────┐
│                    OSAD Administration                      │
│   (OSADStudentOrganizationsPage / OSADOrganizationDetails)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 OrganizationController                      │
│            (Enforces GovernancePolicy::canManageOrganizations)│
└──────────────────────────────┬──────────────────────────────┘
                               │ Canonical Business Logic
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  OrganizationService                        │
│          (Atomic Transactions & Lifecycle Operations)       │
└──────────────┬───────────────────┬───────────────────┬──────┘
               │                   │                   │
               ▼                   ▼                   ▼
┌──────────────────────┐ ┌───────────────────┐ ┌──────────────────────┐
│    organizations     │ │organization_program│ │organization_moderator│
│    (Master Data)     │ │   _affiliations   │ │    _assignments      │
│                      │ │  (Program Scope)  │ │ (Active & History)   │
└──────────────────────┘ └───────────────────┘ └──────────────────────┘
```

---

### 2. Normalized Data Sources of Truth

| Domain Entity / Fact | Authoritative Source of Truth | Primary Keys / Constraints | Canonical Service |
|---|---|---|---|
| Organization Identity & Master Data | `organizations` | `id` (UUID PK), `code` (Unique), `name`, `scope`, `category`, `status`, `college_id` | `OrganizationService` |
| Academic Program Scope | `organization_program_affiliations` | `id` (UUID PK), `(organization_id, academic_program_id)` (Unique `uq_org_program`) | `OrganizationService` |
| Organization Moderator & History | `organization_moderator_assignments` | `id` (UUID PK), `uq_active_org_moderator` (via `active_org_moderator_guard`), `personnel_profile_id`, `effective_from`, `effective_until`, `is_active` | `OrganizationService` |
| Moderator Candidate Eligibility | `profiles` & `personnel_college_affiliations` | Active personnel / HR admin accounts with required college affiliation | `OrganizationService` |
| OSAD Governance Authority | `GovernancePolicy::canManageOrganizations` | Server-side actor resolution & policy enforcement | `OrganizationController` |

---

### 3. Entity Relationships & Cardinality

```text
       organizations (1)
         │
         ├── 0..* ── organization_program_affiliations (N) ── 1 ── academic_programs
         │
         └── 0..* ── organization_moderator_assignments (N) ── 1 ── profiles (personnel)
```

1. **Organization to Program Scope (N:M)**:
   - One organization can affiliate with zero, one, or multiple academic programs.
   - For `scope = 'program'`, at least one active degree program belonging to the parent college is required.
   - For `scope = 'university'` or `scope = 'college'`, explicit program scope is optional / unneeded.
2. **Organization to Moderator Assignment (1:N Historical, 1:1 Active)**:
   - An organization has at most **one** active moderator at any point in time, enforced by the virtual unique constraint `uq_active_org_moderator`.
   - One personnel member can moderate multiple student organizations simultaneously.
   - Reassignment soft-deactivates the prior tenure with `is_active = 0` and `effective_until = CURRENT_DATE`.
   - Historical records are permanently retained and queryable.

---

### 4. Transactional Boundaries & Rollback Safety

All multi-table mutations (creation, program batch addition, moderator assignment / replacement) execute within database transactions:

```php
$this->db->transBegin();
try {
    // 1. Insert organization master data
    // 2. Insert program affiliations (deduplicated)
    // 3. Insert active moderator assignment
    $this->db->transCommit();
} catch (Throwable $e) {
    $this->db->transRollback();
    throw $e;
}
```

If any program ID or personnel ID is invalid, the entire transaction rolls back immediately with **0 partial persistence**.

---

### 5. Security & Authorization Architecture

- Frontend controls provide intuitive UX, but security boundaries are strictly enforced server-side.
- Every mutation (`POST`, `PATCH`, `DELETE`) verifies `GovernancePolicy::canManageOrganizations($actor)`.
- Unauthorized requests return HTTP 403 Forbidden without mutating any database tables.
