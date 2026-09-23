# Phase J2 Evidence: Reviewer Authority & Scope Validation

## Plan G Routing & Reviewer Authority Rules
1. **Faculty + Academic Scope**: Assigned Dean of the matching academic college (`COLLEGE_ACADEMIC_SCOPE`).
2. **Non-Teaching Faculty + Academic Scope**: Assigned Dean of the matching college (`COLLEGE_ACADEMIC_SCOPE`).
3. **Non-Teaching Faculty + Non-Academic Scope**: HR Admin / HR Staff (`UNIVERSITY_HR_SCOPE`).
4. **Dean Evaluation**: Routes to HR.
5. **VP for Academics / Administration**: Routes to HR.

## Strict Denials & Exclusions
- **Cross-College Review Prohibited**: A Dean from College of Engineering cannot return or review a submission from College of Arts & Sciences (`cross_college_evaluation_prohibited`).
- **Department Secretary Strictly Excluded**: Role `department_secretary` cannot return a portfolio or submit evaluation reviews (`department_secretary_excluded`).
- **Self-Review Prohibited**: A personnel member cannot return or evaluate their own portfolio (`self_evaluation_prohibited`).
- **Personnel Role Rejection**: General personnel roles without reviewer assignments cannot author reviewer returns.
