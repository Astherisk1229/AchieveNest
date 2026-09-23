# Plan 06 Phase 1 — OSAD Sidebar Route Matrix
## Current Inventory of Rendered OSAD Sidebar Navigation Items

| Position | Item ID | Rendered Label | Icon | Path / Route | Query Tab | Destination Component |
|---:|---|---|---|---|---|---|
| 1 | `osad-dashboard` | OSAD Dashboard | `Home` | `/osad/dashboard` | `overview` | `OSADCommandCenterPage.jsx` |
| 2 | `osad-academic-structure` | Academic Structure | `Building2` | `/osad/dashboard?tab=academic-structure` | `academic-structure` | `OSADAcademicProgramsPage.jsx` |
| 3 | `osad-student-accounts` | Student Accounts | `Users` | `/osad/dashboard?tab=accounts` | `accounts` | `OSADStudentAccountsPage.jsx` |
| 4 | `osad-student-organizations` | Student Organizations | `Users` | `/osad/dashboard?tab=organizations` | `organizations` | `OSADStudentOrganizationsPage.jsx` |
| 5 | `osad-award-categories` | Awards & Scoring Criteria | `Award` | `/osad/dashboard?tab=awards` | `awards` | `OSADAwardsAndCriteriaPage.jsx` |
| 6 | `osad-certificate-templates` | Certificate Templates | `Sparkles` | `/osad/dashboard?tab=certificate-templates` | `certificate-templates` | `OSADCertificateTemplatesPage.jsx` |
| 7 | `osad-award-candidate-review` | Award Candidate Review | `Trophy` | `/osad/dashboard?tab=candidate-review` | `candidate-review` | `OSADAwardCandidateReviewPage.jsx` |
| 8 | `osad-accreditation-reports` | Accreditation Reports | `FileSpreadsheet` | `/osad/dashboard?tab=reports` | `reports` | `OSADAccreditationReportsPage.jsx` |
| 9 | `osad-activity-log` | OSAD Activity Log | `ShieldCheck` | `/osad/dashboard?tab=audit` | `audit` | `OSADSystemAuditLogsPage.jsx` |
| 10 | `osad-password-resets` | Password Resets | `KeyRound` | `/osad/dashboard?tab=password-resets` | `password-resets` | `OSADPasswordResetRequestsPage.jsx` |

- **Total Active OSAD Sidebar Items**: **10**.
- **Canonical Configuration Authority**: `frontend/src/config/navigationCatalog.js`.
