# Institutional College Source Validation

## Verification Summary

1. **Authoritative Master-Data Binding**: College options load directly from the institutional College service (`personnelMasterDataService.getColleges()`) querying the `colleges` database table.
2. **Independence from Personnel Records**: The College dropdown is completely independent of the directory contents. An empty Personnel directory list does not result in an empty College dropdown.
3. **No HR-Owned Shadow Catalog**: There is no separate HR-maintained College list; the institutional College registry is the single source of truth.
4. **Stable Identifier**: Persistence stores the canonical `college_id` UUID into `personnel_college_affiliations`.
5. **Server Validation**: Invalid `college_id` values are rejected during provisioning and placement updates.

## Test Proof
- `PersonnelMasterDataDropdownsD2Phase1.test.jsx` (Tests 12–17) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Tests 3, 4, 30) — PASSED
