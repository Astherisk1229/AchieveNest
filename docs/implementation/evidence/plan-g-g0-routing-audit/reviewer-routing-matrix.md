# Personnel Evaluation Track — Plan G — Phase G0: Canonical Reviewer Routing Matrix

## Canonical Reviewer Routing Rules (Frozen Baseline)

| Personnel Classification / Context | Canonical Assigned Reviewer | Authoritative Scope Type | College Match Required | Scoring Authority |
| :--- | :--- | :--- | :--- | :--- |
| `Faculty + Academic` | **Dean** | `COLLEGE_ACADEMIC_SCOPE` | Yes (Active Assigned College) | **Plan F** |
| `Non-Teaching Faculty + Academic` | **Dean** | `COLLEGE_ACADEMIC_SCOPE` | Yes (Active Assigned College) | **Plan F** |
| `Non-Teaching Faculty + Non-Academic` | **HR Office (`hr_staff`)** | `UNIVERSITY_HR_SCOPE` | No | **Plan F** |
| `Dean` (Faculty + Academic) | **HR Office (`hr_staff`)** | `UNIVERSITY_HR_SCOPE` | No | **Plan F** |
| `VP for Academics` | **HR Office (`hr_staff`)** | `UNIVERSITY_HR_SCOPE` | No | **Plan F** |
| `VP for Administration` | **HR Office (`hr_staff`)** | `UNIVERSITY_HR_SCOPE` | No | **Plan F** |

---

## Explicit Exclusions & Fallback Governance

1. **Department Secretary Exclusion**: Department Secretary is strictly excluded from evaluator authority.
2. **Self-Evaluation Prohibition**: Personnel cannot evaluate their own portfolio or accept points for their own records.
3. **Scale Independence**: Evaluation scale code (`ADMINISTRATORS_RANKING_SCALE` or `NON_TEACHING_PERSONNEL_RANKING_SCALE`) does not determine reviewer identity; reviewer assignment is derived from authoritative personnel context.
4. **No Guessed Routing**: Unsupported or unconfirmed positions default to `reviewer_route_unresolved`.
