# Canonical Unresolved Rule Register (Post-Reconciliation)

| ID | Unresolved Rule | Why Still Unresolved | Source | Affects System Closure? |
|---|---|---|---|---|
| **UNRES-01** | **`UNRESOLVED — AUDIT RETENTION AFTER COMPLETE OWNER DELETION`** | Observed append-only audit trail logging is documented without establishing a final institutional governance retention policy. | `Plan K0 / Plan K4 / Plan K5` | No (Explicitly allowed to remain unresolved) |
| **UNRES-02** | **`POSITION / JOB TITLE SOURCE — UNRESOLVED`** | Descriptive position/job title strings are non-authoritative and do not govern classification or routing. | `Plan K0 / Plan D2` | No (Explicitly allowed to remain unresolved) |
| **UNRES-03** | **`NO GUESSED ACADEMIC-RANK RULE — NON-TEACHING FACULTY + NON-ACADEMIC`** | Non-teaching personnel in non-academic units carry current_rank = null and are evaluated under administrative scales without academic rank assignment. | `Plan K0 / Plan K2 / Plan K3` | No (Explicitly allowed to remain unresolved) |
| **UNRES-04** | **`ANNUAL REVIEW / SUBJECT-TO-EVALUATION EXACT ALGORITHM`** | Full-Time faculty eligibility is governed by subject_to_evaluation = true without hardcoding unconfirmed annual review algorithms. | `Plan K0 / Plan D3` | No (Explicitly allowed to remain unresolved) |
| **UNRES-05** | **`EVALUATION CYCLE AUTOMATED ROLLOVER SCHEDULE`** | Automated recurring evaluation cycle rollover schedules remain undefined by institutional policy; cycles are managed via explicit administration. | `Plan K0 Section 12` | No (Explicitly allowed to remain unresolved) |
