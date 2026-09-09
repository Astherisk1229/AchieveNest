# Boundary Value Tests & Mathematical Correctness Verification

## 1. Unit Increments (Ph.D. / MA)
- `0 units` -> `0.0 pts`
- `1 unit` -> `0.0 pts` (Incomplete 3-unit group)
- `2 units` -> `0.0 pts` (Incomplete 3-unit group)
- `3 units` -> `2.0 pts` (Ph.D.) / `1.0 pt` (MA)
- `5 units` -> `2.0 pts` (Ph.D.) / `1.0 pt` (MA)
- `6 units` -> `4.0 pts` (Ph.D.) / `2.0 pts` (MA)
- `15 units` -> `10.0 pts` (Ph.D. exact cap)
- `18 units` -> `12.0 raw -> 10.0 capped` (Ph.D. cap enforced)
- `30 units` -> `10.0 pts` (MA exact cap)

## 2. Service Years (C.3 / B.3)
- `0 years` -> `0.0 pts`
- `1 year` -> `0.0 pts`
- `2 years` -> `1.0 pt`
- `3 years` -> `1.0 pt`
- `4 years` -> `2.0 pts`
- `14 years` -> `7.0 pts`
- `20 years` -> `10.0 pts` (Exact cap)
- `25 years` -> `12.0 raw -> 10.0 capped`

## 3. Per-Occurrence Invitations (Non-Teaching B.4)
- `0 invitations` -> `0.0 pts`
- `1 invitation` -> `5.0 pts`
- `4 invitations` -> `20.0 pts`
- `6 invitations` -> `30.0 pts` (Exact cap)
- `8 invitations` -> `40.0 raw -> 30.0 capped`

## 4. Evaluator Accepted Score Range
- `accepted = 0.0` -> Valid (Explicit zero)
- `accepted = null` -> Valid (Awaiting evaluator)
- `accepted = max` -> Valid (Full score)
- `accepted > max` -> Rejected (HTTP 422)
- `accepted < 0.0` -> Rejected (HTTP 422)
