# Reviewer Routing Matrix Freeze — Plan K Phase K0

## Canonical Routing Rules

| Personnel Context | Personnel Group | Organizational Side | Designation / Role | Evaluator / Reviewer | Scope Type |
|---|---|---|---|---|---|
| `FACULTY_ACADEMIC` | `faculty` | `academic` | null | **Dean** | `COLLEGE_ACADEMIC_SCOPE` (College Match Required) |
| `NON_TEACHING_FACULTY_ACADEMIC` | `non_teaching_faculty` | `academic` | null | **Dean** | `COLLEGE_ACADEMIC_SCOPE` (College Match Required) |
| `NON_TEACHING_FACULTY_NON_ACADEMIC` | `non_teaching_faculty` | `non_academic` | null | **HR Staff / Admin** | `UNIVERSITY_HR_SCOPE` |
| `DEAN_EVALUATION` | `faculty` | `academic` | `dean` | **HR Staff / Admin** | `UNIVERSITY_HR_SCOPE` |
| `VP_ACADEMICS` | `faculty` | `academic` | `vp_academics` | **HR Staff / Admin** | `UNIVERSITY_HR_SCOPE` |
| `VP_ADMINISTRATION` | `non_teaching_faculty` | `non_academic` | `vp_administration` | **HR Staff / Admin** | `UNIVERSITY_HR_SCOPE` |

## Strict Routing Boundaries
1. **Department Secretary Exclusion**: Department Secretaries have clerical/monitoring scope only; they are strictly denied evaluator authority.
2. **Cross-College Protection**: Deans cannot review candidates from other colleges.
3. **Self-Review Denial**: Evaluators cannot score their own evaluation portfolios.
4. **Unresolved Combinations**: Return explicit routing errors instead of silent fallback.
