# Plan 05 Phase 1 — OSAD Portfolio Review View Audit
## Baseline State of the OSAD Portfolio Review Experience

### 1. Entry Points
- **Student Accounts Page**: `OSADStudentAccountsPage.jsx` ("View Portfolio" action button per student).
- **Award Evaluation Workspace**: `OSADStudentAwardReviewWorkspace.jsx` and `OSADAwardCandidateReviewPage.jsx`.

### 2. Discovered Discrepancies & Opportunities
- In `OSADStudentAccountsPage.jsx`, the "View Portfolio" modal previously utilized a mock helper `getStudentPortfolios(viewingStudent.full_name)` with fallback hardcoded items instead of fetching `/api/v1/portfolio?student_profile_id=<id>`.
- In `OSADStudentAwardReviewWorkspace.jsx`, the review engine evaluates verified records against award rubrics via `/api/v1/osad/awards/{awardId}/students/{studentId}/review`.

### 3. Target Alignment Contract
- OSAD Portfolio Inspector must query the canonical `GET /api/v1/portfolio?student_profile_id=<id>` endpoint.
- Displays the exact same 9 categories, 57 subcategories, and structured metadata attributes as the student view, enriched with OSAD-only verification history, evidence inspections, and award relevance mappings.
