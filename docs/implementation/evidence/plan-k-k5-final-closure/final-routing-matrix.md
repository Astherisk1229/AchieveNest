# Final Reviewer Routing Matrix

| Personnel Context | Authorized Reviewer | Reviewer Scope | Match Rule |
|---|---|---|---|
| Faculty + Academic | College Dean | `COLLEGE_ACADEMIC_SCOPE` | Requires matching `college_id` |
| Non-Teaching Faculty + Academic | College Dean | `COLLEGE_ACADEMIC_SCOPE` | Requires matching `college_id` |
| Non-Teaching Faculty + Non-Academic | HR Admin (`hr_staff`) | `UNIVERSITY_HR_SCOPE` | University-wide scope |
| College Dean (Self/Peer) | HR Admin (`hr_staff`) | `UNIVERSITY_HR_SCOPE` | University-wide scope |
| Vice President (Academics / Admin) | HR Admin (`hr_staff`) | `UNIVERSITY_HR_SCOPE` | University-wide scope |

### Negative Routing Rules
- Department Secretary is strictly excluded from reviewer roles.
- Cross-college Dean access is denied.
- Evaluator self-evaluation is denied.
- Unresolved classification context has zero silent fallback to HR.
