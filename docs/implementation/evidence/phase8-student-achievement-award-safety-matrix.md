# Plan 04 Phase 8 — Award Safety Matrix
## Classification Boundary and Anti-Override Rules

| Source Classification | Subcategory / Attributes | Forbidden Misclassification Target | Safety Mechanism | Status |
|---|---|---|---|---|
| `Seminar / Training` | `Leadership Development` | `Leadership Position` Award Evidence | Category-locked routing: must have category `Leadership Position` | **PASS** (Protected) |
| `Seminar / Training` | `Sports Development` | `Sports` Competition Result Evidence | Category-locked routing: must have category `Sports` and structured `placement` | **PASS** (Protected) |
| `Seminar / Training` | `Socio-Cultural / Arts Dev` | `Socio-Cultural` Competition Evidence | Category-locked routing: must have category `Socio-Cultural / Performing Arts` | **PASS** (Protected) |
| `Organization Membership` | Narrative mentions "Led", "President" | `Leadership Position` | Free-text narrative disregarded; only structured `position_level` under `Leadership Position` is eligible | **PASS** (Protected) |
| `Sports` | Description says "Champion", metadata says `participant` | Champion Tier Scoring | Structured metadata takes strict precedence over narrative | **PASS** (Protected) |
| `Campus Journalism` | Lifecycle = `verified`, `publication_status = 'draft'` | Scored Published Journalism Evidence | Publication-status filter excludes `draft` status regardless of record lifecycle | **PASS** (Protected) |
| Non-verified Lifecycle | `draft`, `submitted`, `under_review`, `revisions_requested` | Award Evidence Mapping | Verified-only gate strictly filters records by `status = 'verified'` | **PASS** (Protected) |
