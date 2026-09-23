# Audit Timeline & Lineage Reconstruction Evidence

### Reconstruction Capabilities
1. **Normal Lifecycle**:
   - `portfolio_submitted` -> `reviewer_assigned` -> `review_started` -> `score_decision_recorded` -> `evaluation_result_recorded` (`Passed`) -> `promotion_decision_recorded` (`Approved`) -> `approved_rank_applied` -> `evaluation_finalized`.
2. **Revision Lineage**:
   - V1 submitted -> V1 returned for revision -> V2 resubmitted -> V2 returned -> V3 resubmitted -> V3 finalized.
   - Preserves complete version lineages (`version_lineages[1]`, `version_lineages[2]`, `version_lineages[3]`) without rewriting prior history.
