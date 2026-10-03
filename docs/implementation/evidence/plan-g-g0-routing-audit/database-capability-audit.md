# Personnel Evaluation Track — Plan G — Phase G0: Database Capability Audit

## Target-Schema Reviewer Tables & Columns Inventory

### 1. `personnel_evaluations`
- `id` (UUID / VARCHAR): Primary key
- `personnel_profile_id` (UUID / VARCHAR): Evaluated candidate profile reference
- `evaluator_profile_id` (UUID / VARCHAR): Assigned reviewer profile reference
- `evaluator_role` (VARCHAR): Assigned role (`dean`, `hr_staff`)
- `evaluator_college_id` (VARCHAR): College scope ID for Deans
- `evaluation_scale_code` (VARCHAR): Pinned scale (`ADMINISTRATORS_RANKING_SCALE`, `NON_TEACHING_PERSONNEL_RANKING_SCALE`)
- `rule_version` (VARCHAR): Frozen scoring rule version (`NDMU-PERSONNEL-RATING-V2`)
- `status` (VARCHAR): `submitted`, `in_evaluation`, `ready_for_finalization`, `returned_for_revision`, `completed`
- `final_result` (VARCHAR): `Passed`, `Retained`, or `null` while pending
- `final_accepted_total` (DECIMAL(6,2)): Official total score

### 2. `personnel_evaluation_items`
- `id` (UUID / VARCHAR): Item primary key
- `evaluation_id` (UUID / VARCHAR): Foreign key to evaluation
- `category_code` / `criterion_code` (VARCHAR): Criterion reference (e.g. `A.1`, `B.3`, `B.5`)
- `raw_points` (DECIMAL(5,2)): Deterministic calculated points
- `criterion_capped_points` (DECIMAL(5,2)): Subcategory capped points
- `accepted_points` (DECIMAL(5,2)): Official accepted points (nullable; null = awaiting review)
- `verification_status` (VARCHAR): `verified`, `ineligible`, `needs_revision`
- `evaluator_remarks` (TEXT): Evaluator comments and justifications

### 3. `dean_assignments` & `personnel_college_affiliations`
- Provides the authoritative linkage mapping a Dean to their authorized College scope and Personnel to their active College.
