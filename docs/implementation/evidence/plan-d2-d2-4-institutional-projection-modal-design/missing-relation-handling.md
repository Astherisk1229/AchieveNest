# Missing-Relation Handling — Plan D2 Phase D2-4

## Controlled Placeholders
When institutional linkages are unassigned or cannot be resolved:
- Academic record missing College: returns `College unassigned` (never fabricates a College or defaults to generic "Department").
- Non-Academic record missing Department/Office: returns `Department unassigned` (never fabricates an office).
- Completely unassigned records return controlled fallback `Not assigned`.

## Verification
- Verified in Tests 8, 9, and 13 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx).
