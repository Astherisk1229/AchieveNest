# AchieveNest — Student Achievement Entry & Dynamic Category-Based Structured Forms
## Plan 04 Phase 5 — Controlled Vocabulary & Validation Implementation Report

---

### 1. Executive Summary

Plan 04 Phase 5 has formalized and implemented the **Controlled Vocabulary & Validation Contract** across both frontend and backend for Student Achievement / Portfolio Record entry in AchieveNest.

**Key Outcomes of Phase 5:**
1. **Backend Validation Authority (`PortfolioStructuredMetadataValidator.php`)**: Enforces taxonomy compatibility, schema lookup, controlled vocabulary adherence, unknown-key rejection, and draft/submit validation on the server side.
2. **Zero Vocabulary & Schema Drift**: 17 / 17 controlled vocabularies and 57 / 57 subcategory schemas verified in 100% synchronization between frontend and backend.
3. **Strict Unknown-Key & Injection Defense**: Rejects any unlisted metadata keys and explicitly blocks award/scoring key injection (`award_id`, `score`, `points`, `rubric`).
4. **Draft vs Submit Behavior**: Permissive draft creation allows saving incomplete records while strictly validating provided values; submit mode enforces all schema-required fields.
5. **Locked Classification & Safety Invariants**:
   - `Leadership Development`, `Sports Development`, and `Socio-Cultural Development` enforced under `Seminar / Training`.
   - Incompatible taxonomy pairs strictly rejected with `INVALID_TAXONOMY_COMBINATION`.
   - Stale hidden values (e.g. `team_role` when switched to individual) automatically purged upon sanitization.
   - Campus Journalism `publication_status` explicitly distinguishes scorable published work from drafts.
6. **Audit & Test Certification**: 10 / 10 PHP backend audit checks passed; 6 / 6 frontend drift tests passed; 50 test files (290 / 290 tests) passed with zero regressions.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)
- **Phase Status**: IMPLEMENTATION & VERIFICATION COMPLETE

---

### 3. Phase 4 Handoff

Phase 4 implemented the client-side category-specific structured fields registry (`portfolioFormSchemaRegistry.js`) and dynamic renderer (`StructuredDetailsFields.jsx`). Phase 5 establishes the server-side validator and hardens vocabulary boundaries.

---

### 4. Validation Architecture

Validation operates as a dual-layer defense:
1. **Frontend UX Validation**: Guides students with real-time feedback, field constraints, and contextual help text.
2. **Backend Authoritative Validation**: `StudentPortfolioController` delegates to `PortfolioStructuredMetadataValidator` before any database transaction.

---

### 5. Controlled Vocabulary Ownership

Controlled vocabularies are synchronized between:
- Frontend: `frontend/src/config/portfolioFormSchemaRegistry.js` (`CONTROLLED_VOCABULARIES`)
- Backend: `backend/app/Services/PortfolioStructuredMetadataValidator.php` (`self::CONTROLLED_VOCABULARIES`)

---

### 6. Machine Value Rules

All controlled options use lowercase, snake_case identifiers (e.g. `first_runner_up`, `campus_ministry`, `lead_organizer`) to ensure language-neutral, typo-proof persistence.

---

### 7. Event Level

Standardized 5-tier controlled vocabulary:
`institutional`, `local`, `regional`, `national`, `international`.

---

### 8. Placement / Result

Controlled 5-tier podium ranks:
`champion`, `first_runner_up`, `second_runner_up`, `finalist`, `participant`.

---

### 9. Publication Type

Standardized Campus Journalism formats:
`news`, `literary`, `column`, `editorial`, `feature`.

---

### 10. Publication Status

Explicit circulation states:
`published`, `draft`.

---

### 11. Role Classes

Controlled leadership ranks (`position_level`), membership tiers (`membership_type`), contribution scopes (`contribution_level`), and byline roles (`authorship_role`).

---

### 12. Open Text vs Controlled Fields

Open text is permitted strictly for descriptive labels (e.g. `organization_name`, `position_title`, `publication_name`). Categorization and award scoring rely 100% on controlled fields.

---

### 13. Category Validation

`category_id` must be an active UUID in `portfolio_categories`.

---

### 14. Subcategory Validation

`subcategory_id` must be an active UUID in `portfolio_subcategories`.

---

### 15. Category/Subcategory Compatibility

The server explicitly verifies that `portfolio_subcategories.category_id == request.category_id`. Mismatches are rejected with HTTP 422 `INVALID_TAXONOMY_COMBINATION`.

---

### 16. Schema Lookup Validation

The validator confirms that a valid schema definition exists for the requested category/subcategory pair.

---

### 17. Schema Version Validation

All new structured metadata writes must specify `"schema_version": "1.0"`.

---

### 18. Unknown Metadata Policy

Any top-level key in `structured_metadata` not declared in the approved schema is rejected.

---

### 19. Extensibility Strategy

Future schema expansions will be introduced via version increments (`1.1`, `2.0`) or registry updates, preventing arbitrary unstructured payload bloat.

---

### 20. Requiredness Validation

In submit mode (`submit_now: true`), all required schema fields (such as `academic_year` and `semester`) must be present and non-empty.

---

### 21. Conditional Validation

Fields with dependencies (e.g. `team_role` when `individual_team == 'team'`, `publication_date` when `publication_status == 'published'`) are validated only when their condition is satisfied.

---

### 22. Hidden-Value Payload Handling

If a client sends stale values for inactive conditional fields, the backend validator automatically purges them during sanitization.

---

### 23. Data Type Validation

Strings, numbers (non-negative), booleans, and ISO dates (`YYYY-MM-DD`) are strictly type-validated.

---

### 24. Draft Validation

Draft saving (`submit_now: false`) allows missing required fields to support work-in-progress, but rejects invalid controlled values, unknown keys, or malformed data types.

---

### 25. Submit Validation

Submissions (`submit_now: true`) require 100% completeness of shared core fields, category/subcategory selection, schema-required structured metadata, and evidence attachments.

---

### 26. Field-Level Error Contract

Errors are returned in a structured dictionary keyed by `structured_metadata.<field_key>`, allowing the UI to highlight specific inputs directly.

---

### 27. Legacy Compatibility

Existing legacy records in `student_portfolio_records` continue to support read-only fallback rendering without forcing bulk database migration.

---

### 28. Award-Mapping Compatibility

`AwardEvidenceMappingService` directly reads sanitized `structured_metadata` keys (`placement`, `event_level`, `position_level`, `publication_status`), eliminating free-text parsing for new records.

---

### 29. Journalism Safety

Records with `publication_status = 'draft'` are explicitly excluded from verified publication award scoring.

---

### 30. Leadership Safety

`Leadership Development` seminars cannot be submitted under or scored as `Leadership Position` offices.

---

### 31. Sports Safety

`Sports Development` clinics cannot be submitted under or scored as competitive `Sports` tournament placements.

---

### 32. Socio-Cultural Safety

`Socio-Cultural Development` workshops cannot be submitted under or scored as `Socio-Cultural / Performing Arts` competition achievements.

---

### 33. Vocabulary Drift Tests

Verified via `PortfolioValidationDrift.test.jsx` (6/6 PASS).

---

### 34. Schema Drift Tests

Verified 57 / 57 subcategory schemas match across frontend and database.

---

### 35. Automated Tests

- Backend: `php spark audit:plan04-phase5` (10/10 PASS).
- Frontend: `PortfolioValidationDrift.test.jsx` (6/6 PASS).
- Frontend: `StructuredDetailsFields.test.jsx` (7/7 PASS).
- Frontend: `SharedAchievementFields.test.jsx` (5/5 PASS).

---

### 36. Regression

- Full Vitest suite: **50 test files passed, 290 / 290 tests passed**.
- Student award selectors: **0**.
- Student scoring fields: **0**.

---

### 37. Phase 6 Handoff

Phase 5 completes the validation contract and server-side defense. Phase 6 will finalize the dynamic frontend renderer integration and modal workflow.

---

### 38. Exit Decision

All criteria have been met with zero defects and zero regressions.

**PLAN 04 PHASE 5 DECISION: GO FOR PHASE 6 — FRONTEND DYNAMIC RENDERER.**
