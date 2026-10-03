# Plan 05 Phase 4 — Student Portfolio Record Card Contract
## Presentation Contract for Concise Student Accomplishment Cards

### 1. Card Data Binding
Each record card binds directly to the canonical `CanonicalPortfolioRecord`:
- **Header**: Canonical `title` (H3/H4) + `status` badge (Draft, Submitted, Under Review, Verified, Revisions Requested, Rejected).
- **Sub-header**: `category.label` -> `subcategory.label`.
- **Date Range**: Canonical `dates.display_range` (e.g. "Feb 14, 2026 – Feb 18, 2026").
- **Organizer**: `organizer_or_body` (if present).
- **Structured Summary**: Concise badge row showing primary structured attributes (`placement`, `event_level`, `position_level`, etc.) without parsing `description`.
- **Evidence Indicator**: Attached evidence badge (e.g. "1 File Attached").
- **Action Controls**:
  - `View Details`: Always present.
  - `Edit`: Visible when `status IN ('draft', 'revisions_requested')`.
  - `Delete`: Visible when `status IN ('draft', 'revisions_requested')`.
  - `Resubmit`: Visible when `status = 'revisions_requested'`.
