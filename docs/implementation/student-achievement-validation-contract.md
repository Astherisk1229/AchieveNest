# AchieveNest — Student Achievement Entry & Dynamic Category-Based Structured Forms
## Validation Contract & Error Handling Specification

---

### 1. Taxonomy & Key Validation Rules

1. **Category Validation**: `category_id` must match an active row in `portfolio_categories`.
2. **Subcategory Validation**: `subcategory_id` must match a row in `portfolio_subcategories` where `category_id = payload.category_id`.
   - Incompatible pair -> HTTP 422 `INVALID_TAXONOMY_COMBINATION`.
3. **Structured Metadata Schema Validation**:
   - Must contain `"schema_version": "1.0"`.
   - Top-level keys must strictly belong to the subcategory's schema definition.
   - Unknown keys -> HTTP 422 `INVALID_STRUCTURED_METADATA` (`structured_metadata.<unknown_key>`).
   - Injected award/scoring keys (`award_id`, `score`, `points`, `rubric`) -> HTTP 422 `INVALID_STRUCTURED_METADATA`.
4. **Controlled Vocabulary Validation**:
   - Value must be an exact match in the controlled set dictionary (e.g. `placement IN ('champion', 'first_runner_up', ...)`).
5. **Draft vs Submit Validation**:
   - `submit_now: false` (Draft): Incomplete required fields are permitted; provided values must still be valid.
   - `submit_now: true` (Submit): Enforces 100% completeness for required shared fields, category, subcategory, structured schema fields, and evidence.

---

### 2. Error Response Envelope

```json
{
  "error": {
    "code": "INVALID_STRUCTURED_METADATA",
    "message": "Structured metadata validation failed.",
    "errors": {
      "structured_metadata.placement": [
        "The placement field must be one of: champion, first_runner_up, second_runner_up, finalist, participant."
      ]
    }
  }
}
```
