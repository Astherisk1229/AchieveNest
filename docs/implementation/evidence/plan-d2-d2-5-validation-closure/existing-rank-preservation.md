# Existing Rank Preservation & Non-Overwrite Safety

## Validation Rules

1. **Official Rank Authority**: When editing an existing personnel record in `EditMasterDataModal`, the saved official rank/title is always preserved as the active selection.
2. **Advisory Non-Overwrite**: Entering or updating a qualification on an existing faculty record updates the advisory recommendation chip only. It NEVER overwrites or mutates the selected current rank.
3. **Multi-Attribute Isolation**: Modifying College, Department, or Employment Status leaves current rank completely untouched.
4. **Tested Scenarios**:
   - **Case A**: Saved rank `Professor III` + PhD (recommends `Professor I`) → Rank remains `Professor III`.
   - **Case B**: Saved rank `Associate Professor II` + Bachelor qualification → Rank remains `Associate Professor II`.
   - **Case C**: Saved rank `Senior Instructor IV` + Master's entry → Rank remains `Senior Instructor IV`.
   - **Case D**: Saved title `Professorial Lecturer` + Bachelor qualification → Title remains `Professorial Lecturer`.

## Test Proof
- `PersonnelHROverrideAndEditSafetyD2Phase3.test.jsx` (Tests 9–20) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Tests 15–23) — PASSED
