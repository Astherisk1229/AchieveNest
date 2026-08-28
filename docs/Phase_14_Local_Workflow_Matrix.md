# Phase 14 Local Workflow Matrix

This document summarizes the authorization, evaluation, and operational boundaries of the remaining AchieveNest defense workflows running locally against MySQL 8.4.7 (`achievenest_local`).

| Workflow Area | Actor | Operation / Endpoint | Authorization Rule | Key Invariants | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Award Evaluation Engine** | OSAD Administrator | `POST /api/v1/osad/awards/{awardId}/evaluate` | `AwardPolicy::canRunAwardEvaluation` | Only verified portfolio records scored; idempotent | **PASS** |
| **Award Evaluation Read** | Student | `GET /api/v1/osad/awards/{awardId}/students/{id}/basis` | `AwardPolicy::canViewAwardEvaluation` | Student can view own result only; cross-student 403 | **PASS** |
| **Award Evaluation Read** | OSAD / Dean | `GET /api/v1/osad/awards/{awardId}/candidates` | `AwardPolicy::canViewAwardEvaluation` | Full candidate list with potential scores | **PASS** |
| **Candidate Threshold Update** | OSAD Administrator | `PATCH /api/v1/osad/awards/{awardId}/candidate-threshold` | `AwardPolicy::canRunAwardEvaluation` | Numeric 0..100; default 80.00% invariant | **PASS** |
| **Dean Award Nomination** | College Dean | `POST /api/v1/dean/nominations` | `AwardPolicy::canNominateStudent` | Cross-College allowed; creates NO fake score | **PASS** |
| **Personnel Accomplishments** | Academic Personnel | `POST /api/v1/personnel/accomplishments` | `PersonnelPortfolioPolicy` | Academic / Productivity / Service domains | **PASS** |
| **Personnel Evidence** | Academic Personnel | `POST /api/v1/evidence/personnel` | `EvidencePolicy` | Protected storage (`writable/uploads/evidence/personnel/`) | **PASS** |
| **HR Qualification Gateway** | HR Administrator | `POST /api/v1/hr/personnel/{id}/qualification-reviews` | `HRPersonnelPolicy` | Gatekeeper review required for ranking progression | **PASS** |
| **HR Evaluation Lifecycle** | HR Administrator | `POST /api/v1/hr/evaluations` | `HREvaluationPolicy` | Start -> Verify -> Rate -> Finalize state machine | **PASS** |
| **Administrator Ranking Scale** | HR Administrator | `POST /api/v1/hr/evaluations/{id}/items/{itemId}/rate` | `HREvaluationPolicy` | ProfDev (70) + Prod (50) + Service (40) = 160 Max | **PASS** |
| **Passing Rank Threshold** | HR Administrator | `POST /api/v1/hr/evaluations/{id}/finalize` | `HREvaluationPolicy` | Total >= 120.00 qualifies as 'pass' | **PASS** |
| **Dean Oversight** | College Dean | `GET /api/v1/hr/evaluations` | `HREvaluationPolicy` | Finalized evaluations in own College only; mutation 403 | **PASS** |
| **Dean Governance** | HR Administrator | `POST /api/v1/hr/personnel/{id}/dean-role` | `HRPersonnelPolicy` | HR exclusively assigns/revokes College Deans | **PASS** |
| **Coordinator Governance** | OSAD Administrator | `POST /api/v1/osad/coordinators` | `OSADPolicy` | OSAD exclusively assigns Program Coordinators | **PASS** |
| **Moderator Governance** | OSAD Administrator | `POST /api/v1/osad/moderators` | `OSADPolicy` | OSAD exclusively assigns Organization Moderators | **PASS** |
| **Password Reset Ownership** | OSAD & HR | `GET /api/v1/auth/password-reset-requests` | `LocalAuthPolicy` | Student -> OSAD staff; Personnel -> HR admin | **PASS** |
| **Account Lifecycle** | System Admin / HR | `POST /api/v1/auth/accounts/{id}/suspend` | `LocalAuthPolicy` | Suspended/archived users denied token issuance | **PASS** |
| **Mandatory Notifications** | Backend System | `notifications` table | System trigger | Institutional notifications non-suppressible | **PASS** |
| **System Audit Trail** | Backend System | `audit_logs` table | System audit logger | Append-only; authoritative actor IDs; no secrets | **PASS** |
