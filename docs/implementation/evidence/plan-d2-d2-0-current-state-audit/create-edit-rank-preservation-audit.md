# Create vs Edit Rank Preservation Audit — Plan D2 Phase D2-0

### Test & Scenario Verification
**Scenario Tested**:
1. An existing employee has `qualification_summary = "Master of Arts in Education"` and official current rank `current_rank_title = "Associate Professor II"`.
2. HR opens `EditMasterDataModal.jsx`.
3. HR modifies `qualification_summary` to `"Doctor of Philosophy in Educational Management"`.
4. Observation: Does `current_rank_title` change automatically?

### Code & Behavioral Audit Findings:
1. **Frontend State Handling**:
   - `EditMasterDataModal.jsx` initializes `formData.current_rank_title` directly from `personnel.current_rank_title`.
   - The qualification change handler updates only `formData.qualification_summary`.
   - `formData.current_rank_title` is **NOT** automatically mutated, reset, or overwritten by the form.
2. **Backend Mutation Handling**:
   - `TargetHRPersonnelController::updateMasterData` updates `current_rank_title` strictly to the string explicitly provided in the request payload.
3. **Plan E Reconciliation Invariant**:
   - `FacultyInitialRankService.php` / `reconcileCurrentRank` enforces that existing valid official ranks win over advisory qualification baselines (`existing_rank_preserved`).
4. **Conclusion**:
   - Existing official rank preservation is structurally respected; automated silent rank overwrite is NOT present.
