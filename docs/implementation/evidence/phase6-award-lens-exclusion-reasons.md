# Plan 05 Phase 6 — Award Lens Exclusion Reasons
## Explicit Rejection & Exclusion Code Reference

| Reason Code | Human-Readable Label | Applied Scenario |
|---|---|---|
| `REASON_NOT_VERIFIED` | Record Not Verified | Record is in `draft`, `submitted`, `under_review`, `revisions_requested`, or `rejected` state. |
| `REASON_WRONG_CATEGORY` | Incompatible Category | Record category does not match award family (e.g. Community Service submitted for Sports Award). |
| `REASON_TRAINING_NOT_POSITION` | Training Not Position | Seminar/Training -> Leadership Development submitted for Leadership Position scoring. |
| `REASON_TRAINING_NOT_COMPETITION`| Training Not Competition | Seminar/Training -> Sports Development submitted for Athletic Competition scoring. |
| `REASON_TRAINING_NOT_PERFORMANCE`| Training Not Performance | Seminar/Training -> Socio-Cultural Dev submitted for Performing Arts competition scoring. |
| `REASON_UNPUBLISHED_DRAFT` | Article Not Published | Campus Journalism record with `publication_status = 'draft'` submitted for published article criteria. |
| `REASON_INSUFFICIENT_TIER` | Scope Below Requirement | Institutional activity submitted for National / Regional only criteria. |
