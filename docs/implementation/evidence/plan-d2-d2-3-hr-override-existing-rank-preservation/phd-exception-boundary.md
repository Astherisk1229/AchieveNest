# Phase D2-3: PhD Exception Boundary

## Scope Boundary
Plan E defines a verified exception where a faculty member holding `Assistant Professor I` who obtains a Doctoral degree (PhD/EdD) may jump directly to `Professor I` via the formal institutional evaluation/promotion workflow.

### Phase D2-3 Invariants
- This jump is **NOT** triggered automatically inside the HR master-data modal merely because PhD is entered.
- When an `Assistant Professor I` record has its qualification updated to PhD:
  - The advisory indicator may display: `Suggested from qualification: Professor I`.
  - The official current rank dropdown **REMAINS** `Assistant Professor I`.
  - The formal rank transition remains governed by the authorized Plan E/H promotion track.
