# Plan 06 Phase 2 — OSAD Navigation Alias Ownership
## Resolution of Deep-Link Query Aliases to Canonical Owners

| Query Parameter Alias | Canonical Destination Component | Owning Sidebar Item | Proposed Family | IA Decision |
|---|---|---|---|---|
| `?tab=academic-structure` | `OSADAcademicProgramsPage.jsx` | `Academic Structure` (`osad-academic-structure`) | **Student & Institutional Setup** | Canonical alias for academic structure and degree program administration. Retained as primary query route. |
| `?tab=awardees` | `OSADAwardCandidateReviewPage.jsx` | `Award Candidate Review` (`osad-award-candidate-review`) | **Portfolio & Evaluation** | Legacy deep link for award candidate confirmation. Normalized automatically to `candidate-review` in `OSADDashboardPage.jsx`. |

- **Top-Level Redundant Sidebar Items Created from Aliases**: **0 (Zero)**.
- **Canonical Destination Mapping**: **100% Deterministic**.
