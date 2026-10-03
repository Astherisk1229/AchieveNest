# Plan E Phase E5 Evidence: Personnel Rank Data Reconciliation

## Personnel Rank & Title Reconciliation Audit

1. **Full-Time Faculty Profiles**:
   - Profiles with canonical E1 ranks (`current_rank_valid`): Preserved without alteration.
   - Profiles with missing ranks: Initial base rank deterministically proposed based on verified educational attainment and licensure.
2. **Part-Time Faculty Profiles**:
   - Profiles mapped to 4 canonical E3 titles (`PT_PROFESSORIAL_LECTURER`, `PT_ASSISTANT_PROFESSORIAL_LECTURER`, `PT_SENIOR_LECTURER`, `PT_LECTURER`).
   - Zero Part-Time profiles assigned Full-Time rank codes or progression metadata.
3. **Anomalous / Unresolved Records**:
   - Any unknown/ambiguous legacy rank string is flagged with `requires_reconciliation` for HR review without automated destructive overwrite.
   - Unverified qualifications return `qualification_not_verified` with a `null` proposed rank.
