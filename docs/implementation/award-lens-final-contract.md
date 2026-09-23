# AchieveNest — Student Portfolio & OSAD Portfolio Review Format Alignment
## Plan 05 — Award-Specific Lens Final Contract

---

### 1. Invariant Properties of the Award Lens

1. **Non-Destructive Projection**: Switching between institutional awards attaches or recalculates the `osad_evaluation` overlay without modifying canonical record fields.
   - Canonical Field Mutations on Award Switch: **0 (Zero)**.
   - Record Identity Changes: **0 (Zero)**.
   - Category / Subcategory Mutations: **0 (Zero)**.
2. **Verified-Only Gating**: Unverified records (`draft`, `submitted`, `under_review`, `revisions_requested`, `rejected`) are strictly excluded from scoreable award evidence.
3. **Journalism Publication Safety**: Draft or unpublished articles remain excluded from published scoring criteria.
4. **Development Classification Safety**:
   - `Leadership Development` -> `Seminar / Training` (Excluded from Leadership Position scoring).
   - `Sports Development` -> `Seminar / Training` (Excluded from Athletic Competition scoring).
   - `Socio-Cultural / Performing Arts Development` -> `Seminar / Training` (Excluded from Performance Competition scoring).
5. **Multi-Award Support**: Single verified accomplishments can qualify across multiple award rubrics without database record cloning.
6. **Same-Subsection Deduplication**: Multiple matches within the same criteria subsection are resolved via composite key (`subsection_id:record_id`), preventing double-counting.
