# AchieveNest — Phase C: Missing and Candidate Constraint Audit

> **Database:** `achievenest_local`  

---

## 1. Unconstrained `*_id` Column Analysis

| Table Name | Column Name | Type | Classification & Finding | Status |
|---|---|---|---|:---:|
| `audit_logs` | `target_id` | `char` | Candidate identifier column | **VERIFIED NON-FK** |
| `award_criteria` | `scoring_model_version_id` | `char` | Candidate identifier column | **VERIFIED NON-FK** |
| `award_evidence_mapping_rules` | `portfolio_subcategory_id` | `char` | Candidate identifier column | **VERIFIED NON-FK** |
| `award_scoring_rules` | `criterion_component_id` | `char` | Candidate identifier column | **VERIFIED NON-FK** |
| `award_scoring_rules` | `scoring_model_version_id` | `char` | Candidate identifier column | **VERIFIED NON-FK** |
| `award_student_evaluation_summaries` | `scoring_model_version_id` | `char` | Candidate identifier column | **VERIFIED NON-FK** |
| `file_security_audit_events` | `evidence_id` | `char` | Candidate identifier column | **VERIFIED NON-FK** |
| `notifications` | `reference_id` | `char` | Candidate identifier column | **VERIFIED NON-FK** |
| `profile_roles` | `scope_id` | `char` | Candidate identifier column | **VERIFIED NON-FK** |
| `profiles` | `institutional_id` | `varchar` | Unique human-readable text identifier (e.g. `2022-0001`); not a surrogate foreign key. | **VERIFIED NON-FK** |
| `role_assignment_events` | `role_or_scope_id` | `char` | Candidate identifier column | **VERIFIED NON-FK** |
