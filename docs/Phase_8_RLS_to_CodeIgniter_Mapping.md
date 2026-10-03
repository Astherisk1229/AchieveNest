# Phase 8 RLS to CodeIgniter Authorization Mapping

## 1. Overview

This document provides the definitive equivalence mapping between historical/hosted PostgreSQL Row-Level Security (RLS) policies and the centralized CodeIgniter application-layer authorization services in the local-defense MySQL environment.

---

## 2. Equivalence Mapping Table

| Old PostgreSQL RLS / Function | Protected Table / Domain | Approved Security Outcome | New CodeIgniter Policy / Service | Scoped Query Equivalent | Positive Test | Negative Test | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `student_select_own_portfolio` | `student_portfolio_records` | Students see only their own portfolio records | `StudentPortfolioPolicy::canView` | `WHERE student_profile_id = ?` | `AUTHZ-P01` | `AUTHZ-002` | MAPPED |
| `student_insert_own_portfolio` | `student_portfolio_records` | Students can insert records only for their own profile ID | `StudentPortfolioPolicy::canCreate` | `student_profile_id` set to `$actor['profile']['id']` | `AUTHZ-P02` | `AUTHZ-015` | MAPPED |
| `student_update_own_draft` | `student_portfolio_records` | Students can edit records only while in `draft` or `revisions_requested` | `StudentPortfolioPolicy::canEdit` | `WHERE id = ? AND student_profile_id = ? AND status IN ('draft','revisions_requested')` | `AUTHZ-P02` | `AUTHZ-003` | MAPPED |
| `coordinator_select_program_portfolio` | `student_portfolio_records` | Program Coordinators see submitted records for students in their assigned active program | `StudentPortfolioPolicy::scopeListQuery` | `JOIN student_program_enrollments spe ... WHERE spe.academic_program_id IN (?)` | `AUTHZ-P03` | `AUTHZ-006` | MAPPED |
| `coordinator_verify_program_portfolio` | `student_portfolio_records`, `portfolio_verification_queue` | Active Program Coordinator can verify submitted records in assigned program (no self-verification) | `StudentPortfolioPolicy::canVerify` | Verified against `program_coordinator_assignments` with `actor.id != student_profile_id` | `AUTHZ-P03` | `AUTHZ-004`, `AUTHZ-006`, `AUTHZ-007` | MAPPED |
| `dean_select_college_portfolio` | `student_portfolio_records` | Deans view student portfolio records for students enrolled in programs under their college | `StudentPortfolioPolicy::scopeListQuery` | `JOIN academic_programs ap ... WHERE ap.college_id IN (?)` | `AUTHZ-P06` | `AUTHZ-009` | MAPPED |
| `osad_select_all_portfolio` | `student_portfolio_records` | OSAD Administrators view all submitted student portfolio records university-wide | `StudentPortfolioPolicy::scopeListQuery` | Full access without student/program scope filter | `AUTHZ-P05` | `AUTHZ-013` | MAPPED |
| `student_select_own_evidence` | `student_portfolio_evidence` | Evidence metadata only accessible to owner or authorized verifier | `EvidencePolicy::canReadStudentEvidence` | Scoped via parent portfolio record authorization | `AUTHZ-P10` | `AUTHZ-018` | MAPPED |
| `personnel_select_own_accomplishments` | `personnel_accomplishments` | Personnel see own accomplishments; HR sees university; Dean sees college | `PersonnelPolicy::scopeAccomplishmentQuery` | `WHERE personnel_profile_id = ?` or college/university scope | `AUTHZ-P09` | `AUTHZ-005` | MAPPED |
| `hr_manage_personnel` | `personnel_profiles`, `hr_evaluations` | HR staff manage qualification, evaluations, and rank assignments | `GovernancePolicy::canManageHREvaluation` | Restricted to `hr_staff` role | `AUTHZ-P04` | `AUTHZ-012`, `AUTHZ-014` | MAPPED |
| `osad_manage_governance` | `coordinator_assignments`, `moderator_assignments` | OSAD staff manage program coordinators and organization moderators | `GovernancePolicy::canAssignCoordinator`, `canAssignModerator` | Restricted to `osad_staff` role | `AUTHZ-P05` | `AUTHZ-012` | MAPPED |
| `hr_manage_dean_assignments` | `dean_assignments` | HR staff manage dean assignments | `GovernancePolicy::canAssignDean` | Restricted to `hr_staff` role | `AUTHZ-P04` | `AUTHZ-012` | MAPPED |
| `private.is_active_dean()` | Function across governance / awards | Enforces active assignment in `dean_assignments` table | `AuthorizationService::getDeanCollegeIds` | Active `is_active = 1` check on `dean_assignments` | `AUTHZ-P06`, `AUTHZ-P07` | `AUTHZ-008` | MAPPED |
| `private.is_active_program_coordinator()` | Function across verification | Enforces active assignment in `program_coordinator_assignments` table | `AuthorizationService::getCoordinatorProgramIds` | Active `is_active = 1` check on `program_coordinator_assignments` | `AUTHZ-P03` | `AUTHZ-007` | MAPPED |
| `dean_nominate_student_award` | `dean_award_nominations` | Active Dean can nominate any student across university for approved award | `AwardPolicy::canNominateStudent` | Cross-college nomination permitted for active Dean | `AUTHZ-P07` | `AUTHZ-008` | MAPPED |
| `osad_run_award_evaluation` | `student_award_evaluations` | OSAD staff run award scoring cycles | `AwardPolicy::canRunAwardEvaluation` | Restricted to `osad_staff` role | `AUTHZ-P05` | `AUTHZ-012` | MAPPED |
