# Migration Cases Freeze — Plan K Phase K0

## Migration & Legacy Reconciliation Invariants

1. **Legacy Third Group Reconciliation**:
   - Legacy records imported with `personnel_group = 'non_teaching_personnel'` map to the final 2-group model (`non_teaching_faculty`) only when accompanied by official unit/office assignment data.
2. **Ambiguous Legacy Records**:
   - Legacy records lacking definitive institutional placement remain in an unresolved migration status requiring explicit HR reconciliation.
3. **Legacy Unmatched Ranks**:
   - Legacy ranks (e.g. `Master Teacher II`) not present in Plan E 26-rank catalog display an amber `(Legacy Unmatched)` flag in edit modal and remain preserved until HR explicitly reconciles them to a canonical rank code.
4. **No Guessed Non-Teaching Rank Mappings**:
   - Non-Teaching Faculty in Non-Academic units are never synthetically assigned academic teaching ranks during migration.
