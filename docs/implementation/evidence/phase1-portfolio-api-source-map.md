# Plan 05 Phase 1 — API Source Map
## Data Source Tracing for Student and OSAD Views

| View Context | Target Endpoint | Backend Controller | DB Entities Joined | Response Payload Shape |
|---|---|---|---|---|
| Student Portfolio | `GET /api/v1/portfolio` | `StudentPortfolioController::index` | `student_portfolio_records`, `portfolio_categories`, `portfolio_subcategories`, `student_portfolio_evidence` | `{ data: { records: [ ... ] } }` |
| Student Single Record | `GET /api/v1/portfolio/{id}` | `StudentPortfolioController::get` | `student_portfolio_records`, `portfolio_categories`, `portfolio_subcategories`, `student_portfolio_evidence`, `student_portfolio_verification_events` | `{ data: { record: { ... }, evidence: [ ... ], events: [ ... ] } }` |
| OSAD Student Portfolio Review | `GET /api/v1/portfolio?student_profile_id={id}` | `StudentPortfolioController::index` | Same canonical tables; scoped by `student_profile_id` parameter | `{ data: { records: [ ... ] } }` |
| OSAD Award Evaluation Review | `GET /api/v1/osad/awards/{awardId}/students/{studentId}/review` | `AwardEvaluationController::getStudentAwardReview` | `student_portfolio_records`, `awards`, `award_criteria`, `award_evaluations` | `{ data: { student, award, criteria, mapped_evidence, manual_panel_criteria, review_notes } }` |
