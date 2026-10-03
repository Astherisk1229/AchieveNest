# Plan 04 Phase 7 — Transaction Audit
## Atomicity, Rollback, and Compensation Behavior

### 1. Create Transaction Sequence
```text
1. Authorize Actor (Role = student, Session = active)
2. Validate Taxonomy Pair (Category & Subcategory)
3. Validate Structured Metadata & Controlled Vocabularies
4. Validate Submit Completeness (if submit_now = true)
5. DB Begin Transaction (transStart)
6. Insert student_portfolio_records
7. If submitted: Insert student_portfolio_verification_events (action = 'submitted')
8. Insert student_portfolio_evidence child rows
9. DB Commit (transComplete)
10. If failure: DB Rollback (transRollback) + Return HTTP 500
```

### 2. Evidence Physical File Compensation
- Files uploaded via `POST /api/v1/portfolio/{id}/evidence` are validated by `LocalEvidenceStorageService`.
- If database insertion of `student_portfolio_evidence` fails, `deletePhysicalFile` is immediately executed to ensure 0 orphaned physical files.

### 3. Verification Test Results
- Rollback Test: Forced transaction failure cleanly verified 0 partial database persistence.
- Orphan Rows Check: Child evidence records are bound via `portfolio_record_id` FK.
