# Plan 04 Phase 5 — Validation Matrix
## Validation Rules, Enforcement Points, and Error Behaviors

| Field / Concept | Type Classification | Frontend Enforcement | Backend Enforcement (`PortfolioStructuredMetadataValidator`) | Error Code / Behavior |
|---|---|---|---|---|
| `category_id` | UUID Entity Reference | Dynamic Dropdown | Database lookup against `portfolio_categories` | `INVALID_CATEGORY_ID` / `INVALID_CATEGORY` |
| `subcategory_id` | UUID Entity Reference | Dynamic Dropdown | Database verification that `subcategory.category_id == category_id` | `INVALID_SUBCATEGORY_ID` / `INVALID_TAXONOMY_COMBINATION` |
| `schema_version` | String ("1.0") | Automatic injection | Verified strictly equal to "1.0" on new writes | `structured_metadata.schema_version` |
| Unknown Keys | Arbitrary Top-Level Keys | Filtered by schema registry | Strict rejection of unlisted keys | `structured_metadata.<key>`: "Unknown metadata field" |
| Forbidden Keys | Award/Scoring Identifiers | Excluded from client code | Explicit rejection of `award_id`, `score`, `points`, `rubric` | `structured_metadata.<forbidden_key>` |
| `event_level` | Controlled Scalar | 5-tier select | Validated against 5-tier controlled array | `structured_metadata.event_level` |
| `placement` | Controlled Scalar | 5-tier select | Validated against 5-tier podium array | `structured_metadata.placement` |
| `publication_status` | Controlled Scalar | 2-tier select | Validated against `published` / `draft` | `structured_metadata.publication_status` |
| `hours_rendered` / `duration` | Non-negative Number | HTML5 type="number" | `is_numeric` and `>= 0` check | `structured_metadata.<field>`: "Must be valid non-negative number" |
| `leadership_role` | Boolean | Checkbox | Coerced to boolean scalar | Validated |
| `tenure_start` / `end` | Date (YYYY-MM-DD) | HTML5 type="date" | `DateTime::createFromFormat('Y-m-d')` verification | `structured_metadata.<field>`: "Must be valid date in YYYY-MM-DD" |
| Hidden Incompatible Values | Stale payload fields | Reset on change | Automatically purged from sanitized payload | Auto-Sanitized |
