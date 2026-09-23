# Edit Personnel Rank Preservation Audit — Plan D2 Phase D2-1

## Invariants
1. Existing valid saved ranks in personnel records are loaded and pre-selected upon opening `EditMasterDataModal.jsx`.
2. Updating unrelated fields (e.g. qualifications summary, position title, reason) does not mutate or clear the official current rank.
3. If an existing profile contains a legacy rank string not present in the new catalog, it is displayed with `(Saved / Legacy Record)` tag rather than being destroyed or silently coerced.
