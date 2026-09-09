# Plan 06 Phase 4 — OSAD Overflow Action Candidates
## Row Action Density & Overflow Menu Optimization

| Page Component | Visible Inline Row Actions | Overflow / Kebab Actions | Action Density Status | Critical Actions Preserved |
|---|---:|---:|---|:---:|
| `OSADStudentAccountsPage` | 2 (`View Portfolio`, `Reset Password`) | 0 | **OPTIMAL** (<= 2 actions per row) | **PASS** |
| `OSADAcademicProgramsPage` | 1 (`Manage Coordinator`) | 0 | **OPTIMAL** | **PASS** |
| `OSADStudentOrganizationsPage` | 1 (`Assign Moderator`) | 0 | **OPTIMAL** | **PASS** |
| `OSADPasswordResetRequestsPage` | 2 (`Approve`, `Reject`) | 0 | **OPTIMAL** (Triage pair) | **PASS** |
| `OSADAwardCandidateReviewPage` | 1 (`Review Dossier / Score`) | 0 | **OPTIMAL** | **PASS** |
| `OSADCertificateTemplatesPage` | 2 (`Edit`, `Preview`) | 0 | **OPTIMAL** | **PASS** |

- **Tables with Crowded Row Actions (> 3 actions)**: **0 (Zero)**.
- **Critical Action Visibility Loss**: **0 (Zero)**.
