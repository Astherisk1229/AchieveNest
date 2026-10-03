# Academic College Projection — Plan D2 Phase D2-4

## Canonical Rule
For Academic Faculty (`personnel_group: 'faculty'`, `organizational_side: 'academic'`), the evaluation summary's `Department` display field strictly projects the selected College display name (e.g., *College of Engineering and Technology*).

## Implementation Details
- Implemented in `resolveEvaluationDepartmentLabel(record)` in [personnelPlacement.js](<REPO_ROOT>/frontend/src/utils/personnelPlacement.js).
- Persisted relationship utilizes canonical `college_id`.
- Proven in Test 1 & Test 5 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](<REPO_ROOT>/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx).
