# Plan 05 Phase 2 — OSAD Evaluation Extension Contract
## Structure and Behavior of the Administrative Evaluation Extension

```json
{
  "osad_evaluation": {
    "award_id": "77a88123-9912-4211-8e99-441122334455",
    "award_code": "AWARD_ATHLETE_OF_THE_YEAR",
    "award_name": "Athlete of the Year (Sports)",
    "is_relevant_to_selected_award": true,
    "matched_criteria": [
      {
        "criterion_id": "crit-sports-01",
        "criterion_code": "REGIONAL_CHAMPIONSHIP",
        "criterion_name": "Regional Tournament Championship",
        "points_assigned": 30.0,
        "mapping_reason": "Verified regional championship placement in basketball."
      }
    ],
    "verification_event_history": [
      {
        "event_id": "evt-1234",
        "action": "verified",
        "actor_name": "Dr. Carlos Mendez",
        "actor_role": "sports_coordinator",
        "occurred_at": "2026-02-22 14:15:00",
        "remarks": "Official PRISAA certificate verified against varsity roster."
      }
    ],
    "scoring_traceability": {
      "raw_value_used": "champion",
      "event_level_used": "regional",
      "evidence_verified": true,
      "deduplication_key": "sports_regional_champion:9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    },
    "deliberation_notes": [
      {
        "author": "OSAD Committee Chair",
        "note": "Candidate holds varsity captaincy and pristine disciplinary standing.",
        "created_at": "2026-02-25 11:00:00"
      }
    ]
  }
}
```

### Extension Invariants
1. **Non-Destructive**: Never mutates or overrides `record_id`, `category`, `subcategory`, `title`, or `structured_details`.
2. **Award Lens Decoupling**: Selecting another award updates `osad_evaluation` exclusively without affecting canonical record content.
3. **Strictly Omitted in Student Views**: Blocked at server serialization boundary for `student` role sessions.
