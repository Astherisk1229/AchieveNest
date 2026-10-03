# Plan D Phase D4 — Master Data Reconciliation & Model Verification

## 1. Authoritative Dimension Model Verification

The canonical Plan D classification and master-data models have been strictly enforced across database tables, application models, and domain services:

| Dimension | Allowed Values | Enforcement Mechanism | Status |
| --- | --- | --- | --- |
| **Personnel Group** | `faculty`, `non_teaching_faculty` | Database CHECK constraints (`chk_personnel_profiles_group`), API payload validation, and UI select controls. | **VERIFIED** |
| **Organizational Side** | `academic`, `non_academic` | Stored in a distinct column `organizational_side` with CHECK constraint (`chk_personnel_profiles_side`). | **VERIFIED** |
| **Valid Pairs** | 1. `faculty + academic`<br>2. `non_teaching_faculty + academic`<br>3. `non_teaching_faculty + non_academic` | Pair validator in backend profile model (`validateGroupSidePair`) & frontend schema validator (`validateClassificationPair`). The pair `faculty + non_academic` is strictly rejected with `422 UNPROCESSABLE ENTITY`. | **VERIFIED** |
| **Faculty Engagement** | `full_time_faculty`, `part_time_faculty` | Database column `faculty_engagement` (NULL for non-teaching personnel, mandatory for faculty). | **VERIFIED** |
| **Employment Status** | `permanent`, `probationary` | Database column `employment_status` with strict CHECK constraint (`chk_personnel_profiles_status`). | **VERIFIED** |
| **Official Assignment** | Structured Foreign Keys (`college_id`, `department_id`, `office_id`) | Normalized relational tables; free-text strings disallowed for administrative assignment. | **VERIFIED** |
| **Position & Rank/Title** | Separate fields `position_title` vs `rank_title` | Stored separately in `personnel_profiles` to prevent conflation between administrative appointments and academic ranks. | **VERIFIED** |
| **VP Office Isolation** | `vp_academics` vs `vp_administration` | Distinct unit hierarchy IDs in organizational structure preventing unit crossing. | **VERIFIED** |

---

## 2. Legacy Group Retirement & Quarantine Audit

- **Legacy Group Elimination**: The historical third group `non_teaching_personnel` (and ambiguous label `staff`) has been completely retired from all active selection menus, migration scripts, and validation schemas.
- **Zero-Guessing Policy**: No classification was derived from free-text titles or job descriptions.
- **Quarantine Outcome**: Any legacy record lacking unambiguous HR-approved assignment documentation was placed into the quarantine holding table `personnel_quarantined_records` for HR administrative verification.
- **Active Record Count**: All active non-quarantined personnel records resolve to exactly 1 of the 3 canonical Group + Side pairs.
