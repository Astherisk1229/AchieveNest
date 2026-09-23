# Plan 05 Phase 1 — Student Portfolio View Audit
## Baseline State of the Student-Facing Portfolio Experience

### 1. Entry Point & Component Architecture
- **Primary Pages**: `StudentAchievementsPage.jsx` and `StudentPortfolioPage.jsx`.
- **Primary Form**: `AchievementSubmissionModal.jsx` (canonical form with 9-category & 57-subcategory dynamic renderer).
- **Service Layer**: `portfolioService.js` calling `/api/v1/portfolio`.

### 2. Category & Record Presentation
- **Categories**: Rendered across the 9 authoritative categories.
- **Record Display**: Factual accomplishment cards showing Title, Organizer / Body, Occurrence / Start-End Dates, Contextual Description, Structured Details, and Evidence Attachment counts.
- **Status Indicators**: Clean badges displaying `Draft`, `Submitted`, `Under Review`, `Revisions Requested`, `Verified`, `Rejected`.

### 3. Student Exposure & Permissions
- **Award Selectors**: **0 (Zero)**.
- **Scoring Fields / Rubrics**: **0 (Zero)**.
- **Permissions**: Student can view own records, create new records, edit own drafts / revisions-requested records, and submit drafts.
