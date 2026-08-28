# Phase 8 Authorization Matrix

## 1. Overview

This matrix documents the centralized CodeIgniter application-layer authorization rules for AchieveNest in local-defense mode, reproducing the security guarantees of PostgreSQL Row-Level Security (RLS) against the local MySQL 8.4.7 database (`achievenest_local`).

---

## 2. Authorization Matrix by Module and Endpoint

| Module | Endpoint | HTTP Method | Resource / Action | Allowed Actor | Required Scope / Condition | Ownership Rule | Denial HTTP | Policy Method | Test ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth/me` | `GET` | Read identity & scopes | Authenticated User | Valid local session | Current user | 401 | `requireAuthenticatedActor` | AUTHZ-001 |
| **Auth** | `/api/v1/auth/change-password` | `POST` | Change own password | Authenticated User | Valid local session | `profile.id = actor.id` | 401 | `isOwner` | AUTHZ-P01 |
| **Student Portfolio** | `/api/v1/portfolio` | `GET` | List portfolio records | Student, Program Coordinator, Dean, OSAD | Student: own records; Coordinator: active program; Dean: college; OSAD: all | `student_profile_id = actor.id` for student | 401/403 | `StudentPortfolioPolicy::scopeListQuery` | AUTHZ-002, AUTHZ-P01 |
| **Student Portfolio** | `/api/v1/portfolio/{id}` | `GET` | View single portfolio record | Student Owner, Coordinator, Dean, OSAD | Coordinator: student's program; Dean: student's college | `record.student_profile_id = actor.id` | 403/404 | `StudentPortfolioPolicy::canView` | AUTHZ-002, AUTHZ-P01 |
| **Student Portfolio** | `/api/v1/portfolio` | `POST` | Create portfolio draft | Student | Active student account | `student_profile_id = actor.id` | 403 | `StudentPortfolioPolicy::canCreate` | AUTHZ-P02 |
| **Student Portfolio** | `/api/v1/portfolio/{id}` | `PUT` / `PATCH` | Edit portfolio draft | Student Owner | Status in `draft`, `revisions_requested` | `record.student_profile_id = actor.id` | 403 | `StudentPortfolioPolicy::canEdit` | AUTHZ-003, AUTHZ-P02 |
| **Student Portfolio** | `/api/v1/portfolio/{id}/submit` | `POST` | Submit for verification | Student Owner | Status in `draft`, `revisions_requested` | `record.student_profile_id = actor.id` | 403 | `StudentPortfolioPolicy::canSubmit` | AUTHZ-P02 |
| **Student Portfolio** | `/api/v1/portfolio/{id}` | `DELETE` | Delete draft record | Student Owner | Status is `draft` only | `record.student_profile_id = actor.id` | 403 | `StudentPortfolioPolicy::canDelete` | AUTHZ-003 |
| **Verification Queue** | `/api/v1/verification-queue` | `GET` | List queue items | Program Coordinator, OSAD | Coordinator: active program scope; OSAD: all | Coordinator cannot be student owner | 403 | `StudentPortfolioPolicy::scopeVerificationQuery` | AUTHZ-P03, AUTHZ-006 |
| **Verification Queue** | `/api/v1/verification-queue/{id}/decide` | `POST` | Approve/Reject/Request Revisions | Program Coordinator | Active assignment matching student's program | **NO self-verification** (`actor.id != record.student_profile_id`) | 403 | `StudentPortfolioPolicy::canVerify` | AUTHZ-004, AUTHZ-006, AUTHZ-007, AUTHZ-P03 |
| **Evidence** | `/api/v1/portfolio/{id}/evidence` | `POST` | Upload evidence metadata | Student Owner | Status in `draft`, `revisions_requested` | `record.student_profile_id = actor.id` | 403 | `EvidencePolicy::canUploadStudentEvidence` | AUTHZ-P02, AUTHZ-018 |
| **Evidence** | `/api/v1/portfolio/{id}/evidence/{evidenceId}` | `GET` | View evidence metadata | Student Owner, Coordinator, Dean, OSAD | Scoped to authorized reviewer | Scoped by portfolio access | 403 | `EvidencePolicy::canReadStudentEvidence` | AUTHZ-P10, AUTHZ-018 |
| **Evidence** | `/api/v1/portfolio/{id}/evidence/{evidenceId}` | `DELETE` | Remove evidence | Student Owner | Status in `draft`, `revisions_requested` | Scoped by portfolio access | 403 | `EvidencePolicy::canDeleteStudentEvidence` | AUTHZ-003 |
| **Personnel** | `/api/v1/personnel` | `GET` | Directory list | Personnel, HR, Dean | Dean: college-scoped; HR: university | University/College scope | 403 | `PersonnelPolicy::scopeDirectoryQuery` | AUTHZ-P04, AUTHZ-008 |
| **Personnel** | `/api/v1/personnel/{id}` | `GET` | View personnel profile | Owner, HR, Dean | Dean: college-scoped | `profile.id = actor.id` for self | 403 | `PersonnelPolicy::canViewProfile` | AUTHZ-P04, AUTHZ-009 |
| **Personnel Accomplishments** | `/api/v1/personnel-accomplishments` | `GET` | List accomplishments | Personnel Owner, HR, Dean | Personnel: self; Dean: college; HR: all | `personnel_profile_id = actor.id` | 403 | `PersonnelPolicy::scopeAccomplishmentQuery` | AUTHZ-P09 |
| **Personnel Accomplishments** | `/api/v1/personnel-accomplishments` | `POST` | Create accomplishment | Personnel | Active personnel account | `personnel_profile_id = actor.id` | 403 | `PersonnelPolicy::canCreateAccomplishment` | AUTHZ-P09 |
| **HR Evaluation** | `/api/v1/hr/evaluations` | `GET` | List evaluation cycles/records | HR Staff, Dean (read-only college check) | HR: university; Dean: college | None (admin/governance scope) | 403 | `PersonnelPolicy::canEvaluatePersonnel` | AUTHZ-P04, AUTHZ-013, AUTHZ-014 |
| **HR Evaluation** | `/api/v1/hr/evaluations/finalize` | `POST` | Finalize ranking / evaluations | HR Staff | `hr_staff` role | OSAD & Student forbidden | 403 | `GovernancePolicy::canManageHREvaluation` | AUTHZ-013, AUTHZ-014, AUTHZ-P04 |
| **Governance** | `/api/v1/personnel-roles/dean` | `POST` | Assign Dean | HR Staff | Active `hr_staff` role | OSAD forbidden | 403 | `GovernancePolicy::canAssignDean` | AUTHZ-012, AUTHZ-P04 |
| **Governance** | `/api/v1/personnel-roles/coordinator` | `POST` | Assign Coordinator | OSAD Staff | Active `osad_staff` role | HR forbidden | 403 | `GovernancePolicy::canAssignCoordinator` | AUTHZ-012, AUTHZ-P05 |
| **Governance** | `/api/v1/personnel-roles/moderator` | `POST` | Assign Moderator | OSAD Staff | Active `osad_staff` role | HR forbidden | 403 | `GovernancePolicy::canAssignModerator` | AUTHZ-012, AUTHZ-P05 |
| **Password Reset** | `/api/v1/password-reset-requests` | `GET` | List reset requests | OSAD (students), HR (personnel) | Office-segregated listing | Strict boundary | 403 | `GovernancePolicy::canManagePasswordReset` | AUTHZ-012, AUTHZ-013 |
| **Password Reset** | `/api/v1/password-reset-requests/{id}/reset` | `POST` | Execute reset | OSAD (students), HR (personnel) | Strict office boundary | Student -> OSAD; Personnel -> HR | 403 | `GovernancePolicy::canManagePasswordReset` | AUTHZ-012, AUTHZ-013 |
| **Provisioning** | `/api/v1/provisioning/manual-student` | `POST` | Manual student create | OSAD Staff | `osad_staff` role | HR forbidden | 403 | `GovernancePolicy::canProvisionStudent` | AUTHZ-012, AUTHZ-P05 |
| **Provisioning** | `/api/v1/provisioning/manual-personnel` | `POST` | Manual personnel create | HR Staff | `hr_staff` role | OSAD forbidden | 403 | `GovernancePolicy::canProvisionPersonnel` | AUTHZ-013, AUTHZ-P04 |
| **Awards** | `/api/v1/awards/evaluate` | `POST` | Run award evaluation cycle | OSAD Staff | `osad_staff` role | HR & Dean forbidden | 403 | `AwardPolicy::canRunAwardEvaluation` | AUTHZ-012, AUTHZ-P05 |
| **Awards** | `/api/v1/awards/nominate` | `POST` | Dean Award Nomination | Active College Dean | Active `dean` assignment | Cross-College nomination permitted | 403 | `AwardPolicy::canNominateStudent` | AUTHZ-P07, AUTHZ-008 |
