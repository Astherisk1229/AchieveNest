# Plan 06 Phase 3 — OSAD Current vs Final Sequence Matrix
## Comparison of Initial Inventory vs Authoritative Final Sequence

| Initial Pos | Current Label | Route | Final Group | Final Pos | Changed Pos? | Sequence Rationale |
|---:|---|---|---|---:|:---:|---|
| 1 | `OSAD Dashboard` | `/osad/dashboard` | **Overview** | **1** | No | High-level system overview remains the initial landing anchor. |
| 2 | `Academic Structure` | `/osad/dashboard?tab=academic-structure` | **Setup** | **2** | No | Master academic structure prerequisite for coordinator coverage. |
| 3 | `Student Accounts` | `/osad/dashboard?tab=accounts` | **Setup** | **3** | No | Student roster & profile directory precedes portfolio evaluation. |
| 4 | `Student Organizations` | `/osad/dashboard?tab=organizations` | **Setup** | **4** | No | Institutional organization setup precedes student club activities. |
| 10 | `Password Resets` | `/osad/dashboard?tab=password-resets` | **Setup** | **5** | **YES** | Relocated from bottom (pos 10) into foundational student setup cluster. |
| 5 | `Awards & Scoring Criteria` | `/osad/dashboard?tab=awards` | **Evaluation** | **6** | No | Upstream rubrics configuration precedes candidate evaluation workspace. |
| 7 | `Award Candidate Review` | `/osad/dashboard?tab=candidate-review` | **Evaluation** | **7** | No | Core deliberation and candidate scoring workspace. |
| 6 | `Certificate Templates` | `/osad/dashboard?tab=certificate-templates` | **Credentials** | **8** | **YES** | Relocated to follow evaluation so it does not split criteria & review. |
| 8 | `Accreditation Reports` | `/osad/dashboard?tab=reports` | **Governance** | **9** | No | Downstream compliance matrices follow all operational workflows. |
| 9 | `OSAD Activity Log` | `/osad/dashboard?tab=audit` | **Governance** | **10** | No | Administrative audit trail positioned as final oversight anchor. |

- **Total Retained Items**: **10 / 10 (100%)**.
- **Route Changes**: **0 (Zero)**.
