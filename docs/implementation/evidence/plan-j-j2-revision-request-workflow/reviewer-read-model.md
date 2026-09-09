# Phase J2 Evidence: Reviewer Read Model

## Reviewer View Model
- Contains all feedback fields from the Personnel model, plus governance context:
  - `personnel_profile_id`: Faculty/Personnel ID.
  - `evaluator_profile_id`: Assigned reviewer ID.
  - `academic_year`: Current evaluation cycle.
  - `submission_type`: Evaluation category.
  - `is_locked_for_review`: Indicates portfolio is currently in revision by candidate.
