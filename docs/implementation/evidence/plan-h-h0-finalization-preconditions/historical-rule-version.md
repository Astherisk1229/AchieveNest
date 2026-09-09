# Historical Rule Version Verification

## Canonical Rule Version Invariants

1. **Rule Version Stability**:
   - The evaluation must maintain `rule_version === 'NDMU-PERSONNEL-RATING-V2'`.
   - Unsupported or missing rule versions trigger `rule_version_unavailable`.
2. **Historical Scale Preservation**:
   - The evaluation preserves its assigned scale (`ADMINISTRATORS_RANKING_SCALE` or `NON_TEACHING_PERSONNEL_RANKING_SCALE`).
