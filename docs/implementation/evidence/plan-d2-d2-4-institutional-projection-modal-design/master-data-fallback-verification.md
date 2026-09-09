# Master-Data Fallback Verification — Plan D2 Phase D2-4

## Master-Data Binding Integrity (Section 29)
- `personnelMasterDataService.getDepartments()` loads authoritative units via `GET /api/v1/administrative-units`.
- Client fallbacks are restricted to development fixtures and never act as authoritative overrides when backend APIs fail.
- When institutional APIs fail or return 0 records, the modal displays controlled error/empty states rather than masking master-data defects.
- Proven in Test 35 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx).
