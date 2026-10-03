# J1 Freeze Input Specification

## Frozen Foundations for Plan J Phase J1
1. **Canonical Statuses**: `submitted`, `in_evaluation`, `returned_for_revision`, `ready_for_finalization`, `completed`.
2. **Evaluation Results**: `Passed`, `Retained`.
3. **Promotion Decisions**: `Approved`, `Not Approved`.
4. **Key Invariant**: Zero conflation between Evaluation Result and Promotion Decision.
5. **Whole-Portfolio Semantics**: Revisions return and resubmit the entire portfolio container under an evaluation root.
6. **Actor & Lineage Metadata**: Every event must record `evaluation_id`, `version_number`, `actor_profile_id`, `actor_role`, `event_type`, `payload`, and `created_at`.
7. **Unresolved Isolation**: Post-deletion audit retention policy remains isolated behind a single decision point without premature cascade logic.
