# CHU-03 Phase 1 — Moderator Eligibility Rule Audit
## Identification and Classification of Eligibility Requirements

**Date:** 2026-09-10
**Repository:** `Astherisk1229/AchieveNest`
**Track:** CHU-03 — OSAD Functional Completion, Reports, and UI Finalization
**Subject:** Organization Moderator Eligibility Rules

---

## 1. Objective

This audit verifies all eligibility constraints governing which personnel accounts can be assigned as an **Organization Moderator** for recognized student organizations at Notre Dame of Marbel University (NDMU).

---

## 2. Rule Classification Matrix

| Rule ID | Rule Statement | Source Layer | Classification | Enforcement Mechanism |
|---|---|---|:---:|---|
| **RULE-MOD-01** | Target user must be an active Personnel account (`account_type` in `['personnel', 'hr_admin', 'osad_admin']`, `status = 'active'`). Student accounts are strictly rejected. | `OrganizationService.php`, `PersonnelRoleController.php` | **SUPPORTED** | Backend validation throws `422 INVALID_PERSONNEL_STATE` / `InvalidArgumentException`. |
| **RULE-MOD-02** | For College-scoped organizations (`scope = 'college'`), the assigned personnel must have an active affiliation to the matching college (`personnel_college_affiliations.is_active = 1`). | `OrganizationService.php`, `PersonnelRoleController.php` | **SUPPORTED** | SQL check against `personnel_college_affiliations` where `college_id = org.college_id`. |
| **RULE-MOD-03** | University-wide organizations (`scope = 'university'`) may select any active personnel across the institution regardless of college. | `OrganizationService.php` | **SUPPORTED** | Scope branch bypasses college affiliation check when `scope == 'university'`. |
| **RULE-MOD-04** | An organization may only have ONE active moderator at any given time. Prior active moderators are soft-deactivated with recorded tenure (`effective_until`). | `OrganizationService.php` | **SUPPORTED** | Atomic transaction deactivates existing `is_active = 1` before creating new assignment. |
| **RULE-MOD-05** | The assigning actor must be an authorized OSAD Administrator (`canManageOrganizations($actor)` returns `true`). | `OrganizationController.php`, `GovernancePolicy.php` | **SUPPORTED** | Enforced via `checkOSADAuthorization` returning `403 FORBIDDEN` on unauthorized access. |
| **RULE-MOD-06** | Assignments must survive session lifecycle, page refresh, and re-login, projecting the Organization Moderator workspace context dynamically. | `AuthenticatedActorService.php` | **SUPPORTED** | Dynamic role resolution from `organization_moderator_assignments`. |

---

## 3. Synthetic Demo Personas Validated

The following synthetic demonstration personas are confirmed eligible for assignment:
1. `faculty.permanent@ndmu.edu.ph` (`Prof. Marco Valdez` - College of Arts and Sciences / CEAC) $\rightarrow$ Eligible for University & College organizations.
2. `faculty.probationary@ndmu.edu.ph` (`Engr. Roberto Cruz` - College of Engineering / CEAC) $\rightarrow$ Eligible for University & College organizations.
3. `nonteaching.academic@ndmu.edu.ph` (`Prof. Grace Tan` - College of Business Administration) $\rightarrow$ Eligible for University & CBA organizations.
4. `nonteaching.nonacademic@ndmu.edu.ph` (`Dr. Fernando Alonzo` - University Administration) $\rightarrow$ Eligible for University-wide organizations.
