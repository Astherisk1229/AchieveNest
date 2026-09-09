# Personnel Evaluation Track — Plan G — Phase G0: Department Secretary Boundary Audit

## Department Secretary Boundary & Non-Evaluator Status

### 1. Confirmed Architectural Rule
> **Department Secretary is NOT an authorized evaluator.**

### 2. Audit Findings Across Subsystems
- **Scoring Controls**: Department Secretary has zero access to scoring buttons, rate sliders, or accepted-point inputs.
- **Reviewer Assignment**: Department Secretary cannot be selected or assigned as the official evaluator in `personnel_evaluations` or `dean_assignments`.
- **API Guard**: Any mutation requests from an actor possessing only the `department_secretary` role to evaluation rating, verification, or finalization endpoints must return HTTP 403.
- **Monitoring Only**: Department Secretaries may access department-level tracking summaries under separate administrative support modules (e.g. tracking who has submitted), but hold zero evaluator authority.
