# Identity Preservation — Plan D2 Phase D2-4

## Core Invariant
Although both Academic and Non-Academic evaluations present an institutional field labeled `Department` in downstream evaluation summaries and rating sheets, their underlying database relationships remain distinct and uncollapsed:
- Academic: `college_id = <UUID/INT>`, `administrative_unit_id = null`
- Non-Academic: `administrative_unit_id = <UUID>`, `college_id = null`

## Integrity Verification
- College identities are never stored in `administrative_unit_id` fields.
- Administrative Unit identities are never stored in `college_id` fields.
- Validated across [personnelPlacement.js](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/utils/personnelPlacement.js) and proven in Test 7 & Test 41 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx).
