# Non-Academic Department Source Validation

## Verification Summary

1. **Authoritative Master-Data Binding**: Non-Academic Department options load from persisted institutional administrative units via `personnelMasterDataService.getDepartments()` and `GET /api/v1/administrative-units`.
2. **Standard UI Label**: The provisioning and edit modal displays the clear, standard label **`Department`** for all non-academic placements.
3. **Persisted Identity**: The stable `administrative_unit_id` UUID is stored into `personnel_administrative_unit_affiliations`.
4. **No Client Fallback Authority**: Authoritative options come from backend master data; client-side lists serve strictly as deterministic offline fallbacks adhering to the frozen institutional seed.
5. **Server Validation**: Invalid `administrative_unit_id` values are rejected by the backend validator.

## Test Proof
- `PersonnelMasterDataDropdownsD2Phase1.test.jsx` (Tests 18–21) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Tests 5, 31, 36) — PASSED
