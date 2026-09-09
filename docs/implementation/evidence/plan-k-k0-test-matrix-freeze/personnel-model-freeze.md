# Personnel Model Freeze — Plan K Phase K0

## Final Canonical Personnel Groups
1. `Faculty` (`faculty`)
2. `Non-Teaching Faculty` (`non_teaching_faculty`)

*Note*: The legacy third group `Non-Teaching Personnel` is formally deprecated and active solely for backward-compatible migration reconciliation.

## Final Canonical Organizational Sides
1. `Academic` (`academic`)
2. `Non-Academic` (`non_academic`)

## Valid Combinations
- `Faculty` + `Academic`
- `Non-Teaching Faculty` + `Academic`
- `Non-Teaching Faculty` + `Non-Academic`

## Unsupported Combination
- `Faculty` + `Non-Academic` (Strictly rejected with HTTP 422)

## Faculty Status vs. Employment Status Separation
- **Faculty Status (Engagement)**: `Full-time Faculty` (`full_time_faculty`), `Part-time Faculty` (`part_time_faculty`)
- **Employment Status**: `Permanent` (`permanent`), `Probationary` (`probationary`)
- These dimensions are completely decoupled: changing Employment Status never affects ranking catalog or faculty engagement.
