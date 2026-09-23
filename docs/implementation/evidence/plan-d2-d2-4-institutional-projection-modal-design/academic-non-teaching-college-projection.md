# Academic Non-Teaching College Projection — Plan D2 Phase D2-4

## Canonical Rule
For Non-Teaching Faculty on the Academic side (`personnel_group: 'non_teaching_faculty'`, `organizational_side: 'academic'`), the evaluation summary's `Department` display field projects the selected College name (e.g., *College of Arts and Sciences*).

## Implementation Details
- `resolveEvaluationDepartmentLabel(record)` checks `isAcademicPersonnel(record)` / `organizational_side === 'academic'`.
- Persisted relationship utilizes canonical `college_id`.
- Department/administrative office relationship (`administrative_unit_id`) remains null/unassigned.
- Verified in Test 2 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx).
