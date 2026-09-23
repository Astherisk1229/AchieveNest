# Personnel Model Compatibility Audit (Plan D / E / F1 Alignment)

### 1. Classification Model Status
- **Canonical Model:**
  - `personnel_group`: `faculty` | `non_teaching_faculty`
  - `organizational_side`: `academic` | `non_academic`
- **Audit Findings:**
  - `isAcademicPersonnel(personnel)` now prioritizes `organizational_side === 'academic'` while maintaining backwards-compatibility fallback for legacy `personnel_classification` and `personnel_category` if legacy records are parsed.
  - All occurrences of hardcoded `p.personnel_classification === 'academic'` in `PersonnelDirectoryTable.jsx` and `DeanAssignmentModal.jsx` have been upgraded to `isAcademicPersonnel(p)`.
  - `formatPersonnelClassification(personnel)` renders canonical `'Faculty • Academic'`, `'Non-Teaching Faculty • Academic'`, or `'Non-Teaching Faculty • Non-Academic'`.
  - Directory sorting by classification utilizes `formatPersonnelClassification(a)` and `formatPersonnelClassification(b)`.

### 2. Faculty Engagement & Employment Status (Plan D2 Alignment)
- `faculty_engagement`: `full_time_faculty` | `part_time_faculty`
- `employment_status`: `permanent` | `probationary`
- Verified that all HR components format and validate engagement and status according to Plan D2 rules.
