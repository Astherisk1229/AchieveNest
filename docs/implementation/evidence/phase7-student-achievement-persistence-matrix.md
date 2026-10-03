# Plan 04 Phase 7 — Persistence Matrix
## API Request Key to Database Storage Column Mapping

| API Payload Field | Datatype | DB Table & Column | Nullable? | Validation & Transformation Rule |
|---|---|---|---|---|
| `id` | UUID string | `student_portfolio_records.id` | NO (PK) | Generated via RFC 4122 v4 UUID generator |
| `student_profile_id` | UUID string | `student_portfolio_records.student_profile_id` | NO (FK) | Derived authoritatively from authenticated session actor profile ID |
| `category_id` | UUID string | `student_portfolio_records.category_id` | NO (FK) | Must match an active row in `portfolio_categories` |
| `subcategory_id` | UUID string | `student_portfolio_records.subcategory_id` | YES (FK) | Must belong to `category_id` in `portfolio_subcategories` |
| `title` | String | `student_portfolio_records.title` | NO | Trimmed text; required on submit; min 3 chars |
| `organizer_or_body` | String | `student_portfolio_records.organizer_or_body` | YES | Trimmed text; issuing or conducting entity |
| `occurrence_date` | Date (YYYY-MM-DD) | `student_portfolio_records.occurrence_date` | YES | Single-day event date or start date |
| `start_date` | Date (YYYY-MM-DD) | `student_portfolio_records.start_date` | YES | Multi-day or single-day start boundary |
| `end_date` | Date (YYYY-MM-DD) | `student_portfolio_records.end_date` | YES | Validated to be `>= start_date` if provided |
| `description` | Text | `student_portfolio_records.description` | YES | Contextual narrative only; max 1000 chars |
| `structured_metadata` | JSON Object | `student_portfolio_records.structured_metadata` | NO | JSON-encoded sanitized dictionary with `"schema_version": "1.0"` |
| `status` | Enum string | `student_portfolio_records.status` | NO | `'draft'` if `submit_now: false`, `'submitted'` if `submit_now: true` |
| `submitted_at` | Datetime | `student_portfolio_records.submitted_at` | YES | Populated with current UTC/local timestamp when submitted |
| `created_at` / `updated_at`| Datetime | `student_portfolio_records.created_at` / `updated_at` | NO | System timestamp |
| `evidence` | Array of Objects | `student_portfolio_evidence` (Child Rows) | YES | Transactionally linked via `portfolio_record_id` |
