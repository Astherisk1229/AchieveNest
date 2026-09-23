# Plan 06 Phase 6 — OSAD Entity Card Inventory
## Inventory of Card Collections & Navigation Eligibility

| Collection Page | Card Entity Type | Canonical Detail Route / Action | Interaction Classification | Eligibility & Rationale |
|---|---|---|---|---|
| `OSADStudentOrganizationsPage` | Recognized Student Organization | `OSADOrganizationDetailsView` (`onSelectOrganization(org.id)`) | **WHOLE-CARD NAVIGABLE** | **Eligible**: Direct representation of an organization record with dedicated detail management. |
| `OSADAcademicProgramsPage` | Degree Program Summary | `OSADCollegeDetailsView` / Program Modal | **NESTED-ACTION ONLY** | **Restricted**: Program actions (edit/manage) triggered via dedicated row/card buttons. |
| `OSADAwardCandidateReviewPage` | Award Candidate Standing | `AwardEvaluationSummaryModal` / Review Workspace | **WHOLE-CARD NAVIGABLE** | **Eligible**: Clicking candidate opens dossier evaluation summary. |
| `OSADAwardsAndCriteriaPage` | Award Category Definition | `AwardCriteriaModal` / Criteria Tab | **NESTED-ACTION ONLY** | Card acts as a configuration container for multiple subcategories. |
| `OSADCertificateTemplatesPage` | Certificate Template Record | Template Preview Modal (`onPreviewTemplate`) | **WHOLE-CARD NAVIGABLE** | **Eligible**: Clicking card body triggers template preview. |
| `OSADCommandCenterPage` | Metric / Statistical Summary | None (Passive Data) | **NON-NAVIGABLE** | Informational metric tiles; non-clickable to avoid misleading navigation. |

- **Total Card Types Audited**: **6 Types**.
- **Whole-Card Navigable**: **3 Types**.
- **Nested-Action Only**: **2 Types**.
- **Non-Navigable**: **1 Type**.
