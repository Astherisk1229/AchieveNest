# AchieveNest — Student Achievement Entry & Dynamic Category-Based Structured Forms
## Plan 04 Phase 7 — Backend Persistence Contract Implementation Report

---

### 1. Executive Summary

Plan 04 Phase 7 has audited, verified, and hardened the **Backend Persistence Contract** for Student Achievement / Portfolio Record entry in AchieveNest.

**Key Outcomes of Phase 7:**
1. **Canonical Persistence Endpoint (`POST /api/v1/portfolio`)**: Authoritatively persists shared root columns (`title`, `organizer_or_body`, `start_date`, `end_date`, `occurrence_date`, `description`) alongside sanitized `structured_metadata` JSON.
2. **Strict Foreign Key & Taxonomy Integrity**: Category and Subcategory UUIDs are verified against `portfolio_categories` and `portfolio_subcategories`. Incompatible pairs are rejected with 0 database persistence.
3. **Transactional Safety & Rollback**: All record creation, evidence linkages, and audit events occur within database transactions (`transStart` / `transComplete`), guaranteeing zero partial writes or orphan child records.
4. **Draft vs Submit Persistence**:
   - Drafts (`submit_now: false`) persist with `status = 'draft'` and `submitted_at = null`, safely excluded from the verification queue.
   - Submissions (`submit_now: true`) persist with `status = 'submitted'` and an accurate `submitted_at` timestamp, queuing the item for Program Coordinator verification.
5. **Zero Free-Text Award Mapping Dependency**: `AwardEvidenceMappingService` directly consumes sanitized structured metadata (`placement`, `event_level`, `position_level`, `publication_status`), eliminating text parsing for new records.
6. **Audit & Test Certification**: All 10 Phase 7 backend audit checks passed (`10 / 10`); all 52 frontend test files (301 / 301 tests) passed with zero regressions.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)
- **Phase Status**: IMPLEMENTATION & VERIFICATION COMPLETE

---

### 3. Phase 6 Handoff

Phase 6 delivered the complete client-side dynamic form with Category -> Subcategory -> Structured Details progression. Phase 7 formalizes the database transactions, schema serialization, and verification workflow integration.

---

### 4. Request Contract

Canonical endpoint: `POST /api/v1/portfolio`
Payload structure:
```json
{
  "title": "12th Regional Research Symposium",
  "organizer_or_body": "NDMU CITE",
  "start_date": "2026-04-05",
  "end_date": "2026-04-06",
  "description": "Oral presenter for undergrad research.",
  "category_id": "802de57b-54d7-4d38-9433-052ca9636380",
  "subcategory_id": "40000005-0001-0000-0000-000000000001",
  "structured_metadata": {
    "schema_version": "1.0",
    "event_level": "regional",
    "training_type": "leadership_dev",
    "academic_year": "2025-2026",
    "semester": "1st_semester"
  },
  "evidence": [ ... ],
  "submit_now": true
}
```

---

### 5. Shared Field Persistence

Shared fields persist directly to root columns on `student_portfolio_records`:
- `title` -> `student_portfolio_records.title`
- `organizer_or_body` -> `student_portfolio_records.organizer_or_body`
- `start_date` -> `student_portfolio_records.start_date` / `occurrence_date`
- `end_date` -> `student_portfolio_records.end_date`
- `description` -> `student_portfolio_records.description`

---

### 6. Taxonomy Persistence

Persisted as stable foreign key UUIDs (`category_id`, `subcategory_id`). Category names are joined at read-time, preventing naming drift.

---

### 7. Structured Metadata Persistence

Persisted in `student_portfolio_records.structured_metadata` as clean JSON.

---

### 8. JSON Encoding

Encoded via native `json_encode($sanitizedMetadata)`. Single-encoded and decoded cleanly into associative arrays.

---

### 9. schema_version

All newly saved records explicitly include `"schema_version": "1.0"`.

---

### 10. Unknown-Key Safety

Unrecognized top-level keys and forbidden award injection keys (`award_id`, `score`, `points`, `rubric`) are rejected prior to database insert. Persisted injected keys = 0.

---

### 11. Draft Persistence

Saves with `status = 'draft'`, `submitted_at = null`. Permits missing submit-required fields while validating provided controlled values.

---

### 12. Submit Persistence

Saves with `status = 'submitted'`, `submitted_at = date('Y-m-d H:i:s')`, enforcing 100% required field completeness.

---

### 13. Status Transitions

Supports lifecycle transitions: `draft` -> `submitted` -> `under_review` -> `verified` | `revisions_requested` | `rejected`.

---

### 14. Evidence Persistence

Evidence records insert into `student_portfolio_evidence` linked via `portfolio_record_id`.

---

### 15. Transaction Boundaries

Encapsulated within `db->transStart()` and `db->transComplete()`. Any failure automatically rolls back all database operations.

---

### 16. Rollback / Compensation

Verified by `AuditPlan04Phase7` check 7. Physical files uploaded to disk have compensation cleanup handlers (`deletePhysicalFile`).

---

### 17. Authorization / Ownership

`student_profile_id` is derived from authenticated session actor profile ID. Students cannot mutate records owned by other students.

---

### 18. Audit / History

State transitions log an event in `student_portfolio_verification_events`.

---

### 19. API Response Contract

Returns HTTP 201 Created with JSON envelope:
```json
{
  "data": {
    "message": "Portfolio record created successfully.",
    "id": "<uuid>",
    "status": "submitted"
  }
}
```

---

### 20. Error Contract

Validation errors return HTTP 422 with structured field error keys:
```json
{
  "error": {
    "code": "INVALID_STRUCTURED_METADATA",
    "message": "Structured metadata validation failed.",
    "errors": {
      "structured_metadata.event_level": [ ... ]
    }
  }
}
```

---

### 21. Legacy Compatibility

Existing records lacking JSON keys continue to support read-only fallback rendering without forcing bulk database migrations.

---

### 22. AwardEvidenceMappingService Contract

`AwardEvidenceMappingService` inspects `structured_metadata` JSON directly for scoring.

---

### 23. No-Text Interpretation

New records require **0 free-text parsing** for award evaluation.

---

### 24. Verification Queue Integration

Coordinator verification queue (`GET /api/v1/program-coordinator/verification-queue`) queries records with `status IN ('submitted', 'revisions_requested', 'under_review')`. Draft records are excluded.

---

### 25. Database Integrity

- Category & Subcategory FK integrity: PASS (0 Orphans).
- Taxonomy Pair compatibility: PASS (0 Incompatibilities).
- Metadata JSON validity: PASS (0 Malformed).

---

### 26. Backend Tests

- `php spark audit:plan04-phase7`: **10 / 10 Checks Passed**.
- `php spark audit:plan04-phase5`: **10 / 10 Checks Passed**.

---

### 27. Frontend Regression

- Full Vitest suite: **52 test files passed, 301 / 301 tests passed**.

---

### 28. Taxonomy Regression

- 9 Primary Categories & 57 Subcategories intact.

---

### 29. Award Exposure Regression

- Student award selectors: **0**.
- Student scoring fields: **0**.

---

### 30. Phase 8 Handoff

Phase 7 certifies backend persistence, transactional integrity, and verification queue boundaries. Phase 8 will execute comprehensive end-to-end **Award-Mapping Safety Tests**.

---

### 31. Exit Decision

All criteria have been met with zero defects and zero regressions.

**PLAN 04 PHASE 7 DECISION: GO FOR PHASE 8 — AWARD-MAPPING SAFETY TESTS.**
