# Plan 06 Phase 6 — OSAD Entity Card Route Preservation
## Route and Permission Boundary Stability Across Clickable Cards

| Card Type | Trigger Event | Destination Target Component | Route / State | Permission Guard | Route Changed? |
|---|---|---|---|---|:---:|
| `Organization Card` | Body Click / Enter | `OSADOrganizationDetailsView` | `selectedOrganizationId = org.id` | `osad.academic_structure.manage` | **NO** |
| `Candidate Card` | Body Click / Enter | `AwardEvaluationSummaryModal` | Modal open with candidate prop | `osad.award_candidate.review` | **NO** |
| `Certificate Template Card`| Body Click / Enter | Template Preview Modal | Preview modal open with template | `osad.certificate_template.manage` | **NO** |

- **New Detail Routes Created**: **0 (Zero)**.
- **Permission Boundaries Bypassed**: **0 (Zero)**.
