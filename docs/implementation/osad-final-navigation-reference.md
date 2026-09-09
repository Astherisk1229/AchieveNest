# OSAD Navigation Reference — Authoritative Destination Table
## AchieveNest Plan 06: Final Navigation Reference

---

## 1. Authoritative 10-Destination Registry

| Seq # | Group Family | Navigation Label | Item ID | Canonical Path | Query Aliases | Required Permission |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `overview` | **OSAD Dashboard** | `osad-dashboard` | `/osad/dashboard` | `?tab=overview` | `osad.academic_structure.manage` |
| **2** | `setup` | **Academic Structure** | `osad-academic-structure` | `/osad/dashboard?tab=academic-structure` | `?tab=colleges`, `?tab=programs` | `osad.academic_structure.manage` |
| **3** | `setup` | **Student Accounts** | `osad-student-accounts` | `/osad/dashboard?tab=accounts` | `?tab=students`, `?tab=student-accounts` | `osad.academic_structure.manage` |
| **4** | `setup` | **Student Organizations** | `osad-student-organizations` | `/osad/dashboard?tab=organizations` | `?tab=orgs`, `?tab=student-organizations` | `osad.academic_structure.manage` |
| **5** | `setup` | **Password Resets** | `osad-password-resets` | `/osad/dashboard?tab=password-resets` | `?tab=resets` | `osad.academic_structure.manage` |
| **6** | `evaluation` | **Awards & Scoring Criteria** | `osad-award-categories` | `/osad/dashboard?tab=awards` | `?tab=criteria`, `?tab=award-categories` | `osad.award_candidate.review` |
| **7** | `evaluation` | **Award Candidate Review** | `osad-award-candidate-review` | `/osad/dashboard?tab=candidate-review` | `?tab=awardees`, `?tab=candidates` | `osad.award_candidate.review` |
| **8** | `credentials` | **Certificate Templates** | `osad-certificate-templates` | `/osad/dashboard?tab=certificate-templates` | `?tab=templates` | `osad.certificate_template.manage` |
| **9** | `governance` | **Accreditation Reports** | `osad-accreditation-reports` | `/osad/dashboard?tab=reports` | `?tab=accreditation`, `?tab=compliance` | `osad.academic_structure.manage` |
| **10**| `governance` | **OSAD Activity Log** | `osad-activity-log` | `/osad/dashboard?tab=audit` | `?tab=activity-log`, `?tab=logs` | `osad.academic_structure.manage` |

---

## 2. Canonical Ownership of Route Aliases

- `?tab=academic-structure`, `?tab=colleges`, `?tab=programs` -> Owned by `osad-academic-structure`.
- `?tab=accounts`, `?tab=students`, `?tab=student-accounts` -> Owned by `osad-student-accounts`.
- `?tab=organizations`, `?tab=orgs` -> Owned by `osad-student-organizations`.
- `?tab=password-resets`, `?tab=resets` -> Owned by `osad-password-resets`.
- `?tab=awards`, `?tab=criteria` -> Owned by `osad-award-categories`.
- `?tab=candidate-review`, `?tab=awardees`, `?tab=candidates` -> Owned by `osad-award-candidate-review`.
- `?tab=certificate-templates`, `?tab=templates` -> Owned by `osad-certificate-templates`.
- `?tab=reports`, `?tab=accreditation` -> Owned by `osad-accreditation-reports`.
- `?tab=audit`, `?tab=activity-log`, `?tab=logs` -> Owned by `osad-activity-log`.
- **Top-level redundant sidebar aliases**: **0** (All aliases resolve cleanly to their primary parent).
