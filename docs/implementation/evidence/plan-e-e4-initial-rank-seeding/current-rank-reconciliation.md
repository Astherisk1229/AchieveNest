# Phase E4 Evidence: Current Rank Reconciliation & Safety Principles

## Reconciliation Matrix

| Current Rank State | Qualification State | Action Taken | Current Rank Status | Reason Code | Requires HR Review |
|---|---|---|---|---|---|
| **Missing (null/blank)** | Verified Doctoral | Propose base seed `PROFESSOR_I` | `missing` | `doctoral_initial_rank` | No |
| **Missing (null/blank)** | Verified Master's | Propose base seed `ASSISTANT_PROFESSOR` | `missing` | `masters_initial_rank` | No |
| **Missing (null/blank)** | Verified Licensure | Propose base seed `SENIOR_INSTRUCTOR` | `missing` | `licensed_professional_initial_rank` | No |
| **Missing (null/blank)** | Verified Baccalaureate | Propose base seed `ASSISTANT_INSTRUCTOR` | `missing` | `baccalaureate_initial_rank` | No |
| **Missing (null/blank)** | Unverified Qualification | No seed proposed | `missing` | `qualification_not_verified` | Yes |
| **Valid Canonical Rank** | Any Qualification | **Preserve existing rank unchanged** | `valid` | `current_rank_valid` | No |
| **Known Alias (e.g. 'Professor')** | Any Qualification | Map to canonical code and preserve | `valid` | `current_rank_valid` | No |
| **Unknown / Ambiguous Value** | Any Qualification | Flag for HR review without overwriting | `unknown` | `rank_reconciliation_required` | Yes |
| **Part-Time Faculty** | Any | Rejected (routed to Phase E3) | `ineligible` | `part_time_not_applicable` | No |
| **Non-Teaching Staff** | Any | Rejected (outside faculty scope) | `ineligible` | `non_teaching_not_applicable` | No |
