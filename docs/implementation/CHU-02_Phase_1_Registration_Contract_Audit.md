# CHU-02 Phase 1A — Personnel Registration Schema & Contract Audit

## Document Purpose
This document audits the authoritative schema, API contracts, validations, and lifecycle operations supporting HR Single Personnel Registration and Batch XLSX Import under **CHU-02 Phase 1**.

---

## 1. Authoritative Schema & Field Matrix

| Field | DB Table & Column | API Field Name | Required? | Validation Rule | Source / Authority |
|---|---|---|---|---|---|
| **Institutional ID** | `profiles.institutional_id` | `institutional_id` | **Yes** | 1–50 ASCII chars, no control chars, unique | `TargetProvisioningController::manualPersonnel` |
| **Institutional Email** | `profiles.email` | `institutional_email` | **Yes** | `@ndmu.edu.ph` canonical domain, unique | `ValidationHelper::canonicalizeNdmuEmail` |
| **First Name** | `profiles.first_name` | `first_name` | **Yes** | Non-empty string, valid name format | `ValidationHelper::validateName` |
| **Middle Name** | `profiles.middle_name` | `middle_name` | No | Nullable string, valid name format | `ValidationHelper::validateName` |
| **Last Name** | `profiles.last_name` | `last_name` | **Yes** | Non-empty string, valid name format | `ValidationHelper::validateName` |
| **Suffix** | `profiles.suffix` / derived | `suffix` | No | Nullable string (e.g., Jr., III) | `ValidationHelper::validateName` |
| **Personnel Group / Type** | `personnel_profiles.personnel_group` | `personnel_group` | **Yes** | `faculty` \| `non_teaching_faculty` | CHU-01 Phase 2 Canonical Taxonomy |
| **Personnel Status** | `personnel_profiles.employment_status` | `employment_status` | **Yes** | `permanent` \| `probationary` (Strictly forbids `full_time`, `contractual`) | CHU-01 Phase 2 Canonical Taxonomy |
| **Faculty Engagement** | `personnel_profiles.faculty_engagement` | `faculty_engagement` | Optional (default: `full_time_faculty`) | `full_time_faculty` \| `part_time_faculty` | Plan D2 / CHU-01 |
| **Organizational Side** | `personnel_profiles.organizational_side` | `organizational_side` | **Yes** | `academic` \| `non_academic` | CHU-01 Phase 2 Canonical Taxonomy |
| **College Placement** | `personnel_profiles.college_id` & `personnel_college_affiliations` | `college_id` | Conditional (**Required** if `organizational_side=academic`) | Active UUID in `colleges` table | CHU-01 Phase 3 Reference Structure |
| **Academic Program Placement** | `personnel_program_affiliations` | `academic_program_ids` | Conditional (**Required** if `organizational_side=academic`) | Array of active UUIDs in `academic_programs` mapped to `college_id` | CHU-01 Phase 3 Reference Structure |
| **Administrative Unit Placement** | `personnel_profiles.administrative_unit_id` & `personnel_administrative_unit_affiliations` | `administrative_unit_id` | Conditional (**Required** if `organizational_side=non_academic`) | Active UUID in `administrative_units` table | CHU-01 Phase 3 Reference Structure |
| **Position / Designation** | `personnel_profiles.position_title` & `profiles.designation_title` | `position_title` / `designation` | No | Non-empty string (default: `Personnel`) | Schema Standard |
| **Initial Rank Title** | `personnel_profiles.current_rank_title` | `current_rank_title` | No | Catalog title matching engagement rules (no crossover) | Plan E / Plan K5 Catalog |
| **Qualification Summary** | `personnel_profiles.qualification_summary` | `qualification_summary` | No | String or null | Schema Standard |
| **Account State** | `profiles.status` & `local_auth_credentials.status` | `status` | System | `active` (with `must_change_password=1`) | Account Lifecycle Standard |

---

## 2. Structural & Relational Integrity Constraints
1. **No Mixed Placement Violations**:
   - When `organizational_side = 'academic'`, `college_id` and at least one `academic_program_id` are mandatory. `administrative_unit_id` must be null.
   - When `organizational_side = 'non_academic'`, `administrative_unit_id` is mandatory. `college_id` and `academic_program_ids` must be null.
2. **Catalog Crossover Prevention**:
   - Full-Time Faculty (`full_time_faculty`) cannot be assigned Part-Time titles (e.g. `Lecturer`, `Senior Lecturer`).
   - Part-Time Faculty (`part_time_faculty`) cannot be assigned Full-Time academic ranks (e.g. `Instructor I`, `Assistant Professor`).
3. **Canonical Classification Matrix**:
   - `faculty` + `academic` $\rightarrow$ Valid
   - `faculty` + `non_academic` $\rightarrow$ Valid
   - `non_teaching_faculty` + `academic` $\rightarrow$ Valid
   - `non_teaching_faculty` + `non_academic` $\rightarrow$ Valid
   - Any other value (e.g. `administrative_staff`, `contractual`) $\rightarrow$ Rejected with `INVALID_PERSONNEL_CLASSIFICATION`.

---

## 3. Atomic Transaction Strategy
Registration in `TargetProvisioningController::manualPersonnel` executes inside a database transaction (`$db->transStart()` ... `$db->transComplete()`):
1. Create `profiles` record.
2. Create `personnel_profiles` record with canonical group and status.
3. Create placement affiliations (`personnel_college_affiliations` & `personnel_program_affiliations` OR `personnel_administrative_unit_affiliations`).
4. Create `profile_roles` assignment (`role_key = 'personnel'`).
5. Create `local_auth_credentials` record (`must_change_password = 1`).
6. Record lifecycle events (`provisioned`, `activated`).
7. Record audit log entry (`ACCOUNT_PROVISIONING_SUCCEEDED`).

If any step fails or an identity conflict is encountered during transaction, the entire transaction is rolled back with `$db->transRollback()`, leaving **zero orphan records or half-created accounts**.
