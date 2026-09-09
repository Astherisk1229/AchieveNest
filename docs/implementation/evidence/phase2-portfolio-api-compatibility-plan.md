# Plan 05 Phase 2 — API Compatibility Plan
## Backward Compatibility and Projection Strategy

### 1. Canonical Endpoint Strategy
- **Endpoint**: `GET /api/v1/portfolio`
- **Session Scoping**:
  - If authenticated actor is a `student`: Returns the student's own canonical portfolio records. `student_profile_id` parameter is ignored or prohibited. `osad_evaluation` extension is omitted.
  - If authenticated actor is `osad_staff`, `program_coordinator`, or `dean`:
    - Allows `?student_profile_id={uuid}` to inspect the student's master portfolio.
    - Allows optional `?award_id={uuid}` to attach the `osad_evaluation` extension overlay.

### 2. Frontend Migration Strategy
- In Phase 3 and Phase 4, `OSADStudentAccountsPage.jsx` and `StudentPortfolioPage.jsx` will be wired to consume the canonical DTO directly.
- Existing frontend response properties (`records`, `categories`, `evidence`) remain intact in the top-level envelope.
