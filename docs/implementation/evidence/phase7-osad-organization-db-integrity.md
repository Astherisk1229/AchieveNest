# Phase 7 — OSAD Organization Database Integrity Evidence
**Plan 02 Relational Integrity, Orphan Prevention & History Audit**

---

### 1. Foreign Key & Orphan Queries

#### 1.1 Orphan Program Affiliations
```sql
SELECT opa.id
FROM organization_program_affiliations opa
LEFT JOIN organizations o ON o.id = opa.organization_id
LEFT JOIN academic_programs ap ON ap.id = opa.academic_program_id
WHERE o.id IS NULL OR ap.id IS NULL;
```
**Result**: `0 rows` — Foreign key integrity is 100% sound.

#### 1.2 Orphan Moderator Assignments
```sql
SELECT oma.id
FROM organization_moderator_assignments oma
LEFT JOIN organizations o ON o.id = oma.organization_id
LEFT JOIN profiles p ON p.id = oma.personnel_profile_id
WHERE o.id IS NULL OR p.id IS NULL;
```
**Result**: `0 rows` — No dangling moderator assignments exist.

---

### 2. Active Uniqueness & Cardinality Constraints

#### 2.1 Multiple Active Moderators Violations
```sql
SELECT organization_id, COUNT(*) as active_count
FROM organization_moderator_assignments
WHERE is_active = 1
GROUP BY organization_id
HAVING COUNT(*) > 1;
```
**Result**: `0 rows` — Enforced by virtual column `active_org_moderator_guard` and unique index `uq_active_org_moderator`. Exactly 0 or 1 active moderator exists per organization.

#### 2.2 Duplicate Active Program Affiliations
```sql
SELECT organization_id, academic_program_id, COUNT(*) as cnt
FROM organization_program_affiliations
GROUP BY organization_id, academic_program_id
HAVING COUNT(*) > 1;
```
**Result**: `0 rows` — Composite unique constraint `uq_org_program` prevents duplicate active program assignments.

---

### 3. Temporal Validity of Moderator History

```sql
SELECT id, effective_from, effective_until
FROM organization_moderator_assignments
WHERE effective_until IS NOT NULL AND effective_until < effective_from;
```
**Result**: `0 rows` — All historical tenures have chronologically valid start and end dates.

---

### 4. Schema Modification Audit

- Schema Changes: **0 (NONE)**
- Secondary Name Columns: **0 (NONE)**
- Primary Source of Truth:
  - Organizations: `organizations` table
  - Scope: `organization_program_affiliations` table
  - Moderator: `organization_moderator_assignments` table
