# Plan 06 Phase 5 — OSAD Responsive Placement Matrix
## Behavior and Placement of Controls Across Desktop, Tablet, and Mobile

| Page / Component | Desktop Placement (>= 1280px) | Tablet Placement (768px – 1279px) | Mobile Placement (< 768px) | Preserves Hierarchy? |
|---|---|---|---|:---:|
| `OSADAcademicProgramsPage` | Header flex row (Title left, CTAs right) | Header wraps to 2 rows if needed | Full width stacked CTAs | **PASS** |
| `OSADStudentAccountsPage` | Filters flex row, table with action col | Filters stack 2x2, table scrollable | Filters stack full-width, compact table | **PASS** |
| `OSADStudentOrganizationsPage` | 3-column card grid | 2-column card grid | 1-column card stack | **PASS** |
| `OSADPasswordResetRequestsPage`| Action buttons inline in right column | Action buttons inline | Stacked action buttons in card/row | **PASS** |
| `OSADAwardCandidateReviewPage` | Filter toolbar + Candidate card grid | Filter toolbar wraps | Single candidate cards with full-width CTA | **PASS** |
| `OSADModals` (all dialogs) | Fixed width modal (`max-w-lg`) | Modal centered with padding | Full-width modal drawer (`w-full`) | **PASS** |

- **Unintended Horizontal Page Overflow**: **0 (Zero)**.
- **Critical Actions Hidden on Mobile**: **0 (Zero)**.
