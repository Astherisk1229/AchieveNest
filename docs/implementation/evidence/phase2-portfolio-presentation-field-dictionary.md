# Plan 05 Phase 2 — Presentation Field Dictionary
## Field-Level Contract for Canonical Portfolio Presentation

| DTO Path | Data Type | Nullable? | Source | Viewer Availability | Description |
|---|---|---|---|---|---|
| `record_id` | String (UUID) | NO | `student_portfolio_records.id` | All Viewers | Stable canonical record identifier |
| `student_profile_id` | String (UUID) | NO | `student_portfolio_records.student_profile_id` | All Viewers | Student owner profile ID |
| `category.id` | String (UUID) | NO | `portfolio_categories.id` | All Viewers | Primary category UUID |
| `category.label` | String | NO | `portfolio_categories.name` | All Viewers | 1 of 9 Authoritative Category Labels |
| `category.order` | Integer | NO | Taxonomy Rank (1–9) | All Viewers | Canonical display sequence |
| `subcategory.id` | String (UUID) | NO | `portfolio_subcategories.id` | All Viewers | Subcategory UUID |
| `subcategory.label` | String | NO | `portfolio_subcategories.name` | All Viewers | 1 of 57 Subcategory Labels |
| `title` | String | NO | `student_portfolio_records.title` | All Viewers | Canonical accomplishment title |
| `organizer_or_body` | String | YES | `student_portfolio_records.organizer_or_body` | All Viewers | Issuing or conducting entity |
| `dates.start_date` | String (Date) | YES | `student_portfolio_records.start_date` | All Viewers | Start date |
| `dates.end_date` | String (Date) | YES | `student_portfolio_records.end_date` | All Viewers | End date |
| `dates.display_range`| String | NO | Computed range formatter | All Viewers | Normalized readable date range |
| `description` | String | YES | `student_portfolio_records.description` | All Viewers | Contextual narrative only |
| `schema_version` | String | NO | `"1.0"` | All Viewers | Schema contract version |
| `structured_details` | Array of Objects | NO | Schema Registry projection | All Viewers | Ordered human-readable metadata list |
| `evidence` | Array of Objects | NO | `student_portfolio_evidence` | All Viewers | Attached verification evidence files |
| `verification.status`| String | NO | `student_portfolio_records.status` | All Viewers | Semantic status (`draft`, `verified`, etc.) |
| `osad_evaluation` | Object | YES | `AwardEvidenceMappingService` | OSAD / Reviewers ONLY | Award relevance & criteria mapping overlay |
