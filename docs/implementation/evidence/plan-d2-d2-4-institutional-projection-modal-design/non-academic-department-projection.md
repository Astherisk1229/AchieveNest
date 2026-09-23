# Non-Academic Department Projection — Plan D2 Phase D2-4

## Canonical Rule
For Non-Academic Personnel (`personnel_group: 'non_teaching_faculty'`, `organizational_side: 'non_academic'`), the evaluation summary's `Department` display field projects the selected Department/office name (e.g., *University Library*, *Human Resource Management Office*).

## Implementation Details
- `resolveEvaluationDepartmentLabel(record)` resolves `administrative_unit_name` / `department_name`.
- Persisted relationship utilizes canonical `administrative_unit_id`.
- College relationship (`college_id`) remains null/unassigned.
- Verified in Test 3 and Test 6 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx).
