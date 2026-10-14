# AchieveNest Objectives Implementation and Database-Persistence Audit Prompt

Copy the prompt below into the coding/auditing agent that has access to the complete AchieveNest repository, running frontend, backend, and local MySQL database.

---

## Prompt

You are the independent acceptance auditor for **AchieveNest**, a React/Vite frontend with a CodeIgniter 4 API and the MySQL database `achievenest_local`.

Your job is to determine, with executable evidence, whether the following objectives are **fully implemented end to end**:

1. A centralized web-based system manages student and personnel achievement records and digital portfolios.
2. The system implements student-achievement verification, event and attendance management, certificate management, and personnel-portfolio evaluation workflows.
3. The system generates printable digital portfolios consolidating verified achievements and relevant student/personnel accomplishment records.
4. The system provides criteria-based evaluation, scoring, and reports that support OSAD student recognition and HR personnel ranking/promotion.

### Non-negotiable audit rules

- Do not treat the existence of a page, button, route, component, service, migration, mock, fixture, seed, test, or documentation as proof that a requirement works.
- Trace every capability through: **UI -> frontend service -> HTTP API -> authorization/business rules -> database transaction -> committed MySQL rows -> read API -> UI after a hard reload**.
- If a user creates, edits, submits, verifies, approves, rejects, scores, issues, revokes, or finalizes something, the authoritative state must be committed to MySQL. React state, browser storage, hard-coded arrays, mock responses, toast messages, and visual-only updates do not count.
- Files may be stored outside MySQL, but their authoritative metadata, owner, checksum/path, security state, and relationship to the business record must be persisted in MySQL.
- A generated download may be produced on demand, but all information represented as authoritative in it must come from committed records. Any official immutable report/certificate snapshot claimed by the application must also have a database row.
- For every mutation, capture a before count/query, the HTTP request and response, the inserted/updated row, related audit/history rows, and the same state after a hard browser reload and a fresh login.
- Use a unique marker such as `DEFENSE-20261005-153000` in every test-created title/name. Never rely on pre-seeded data as proof of creation.
- Run negative tests: unauthenticated, wrong role, wrong owner/scope, invalid transition, invalid input, duplicate submission/check-in, and missing/unsafe evidence.
- Verify transactionality: a failed multi-table operation must not leave partial rows.
- Do not modify or delete the protected `achievenest_local` database merely to make tests pass. Use dedicated uniquely marked records and report cleanup separately. Use a disposable test database for destructive tests.
- Report **PASS** only when implementation, runtime behavior, persistence, reload, access control, and automated regression evidence all pass. Report **PARTIAL** for incomplete paths and **FAIL** for absent/broken paths. Do not infer PASS.

### Required repository inspection

Inspect the actual implementation and produce a traceability map for each objective. At minimum, verify the owning routes/controllers/services, frontend pages/services, migrations/current MySQL schema, storage behavior, and closest automated tests. Search for mock-only or local-only storage and flag any mutation that does not reach the API and MySQL.

Pay particular attention to these authoritative areas, while confirming their current names from the live schema:

- Student records: `student_portfolio_records`, `student_portfolio_evidence`, `student_portfolio_verification_events`
- Events/attendance: `events`, `attendance_sessions`, `attendance_records`
- Certificates: `certificate_template_families`, `certificate_template_versions`, `certificate_issuance_batches`, `issued_certificates`
- OSAD scoring: `award_definitions`, `award_criteria`, `award_scoring_rules`, `award_cycles`, `student_award_evaluations`, `student_award_criterion_scores`, `student_award_score_evidence`, `award_evaluation_summary_reports`
- Personnel: `personnel_accomplishments`, `personnel_accomplishment_evidence`, portfolio submission/version tables present in the current schema, `personnel_qualification_reviews`, `personnel_evaluations`, `personnel_evaluation_items`, `personnel_evaluation_events`, `personnel_evaluation_reports`, and official evaluation-document tables present in the current schema
- Cross-cutting proof: `audit_logs`, `notifications`, actor/role assignments, and protected-file metadata

### Mandatory defense test cases

Execute and document the following. Record test data, actor, expected result, actual HTTP status/payload, affected table/primary key, SQL proof, reload result, and PASS/FAIL.

| ID | Test | Required proof |
|---|---|---|
| AUTH-01 | Sign in as Student, OSAD, organization moderator/coordinator, Personnel, Dean/reviewer, and HR | Correct workspace and role boundaries; wrong-role calls return 403 and unauthenticated calls return 401 |
| STU-01 | Student creates and edits a uniquely marked achievement draft | Row exists in `student_portfolio_records`; edited values survive reload/login |
| STU-02 | Student uploads valid evidence and submits | Evidence metadata row is committed; protected file exists; clean/security state is enforced; record becomes submitted |
| STU-03 | Authorized verifier requests revision, student resubmits, verifier verifies | Status transitions and actor/timestamps are persisted; ordered rows exist in `student_portfolio_verification_events` |
| STU-04 | Unauthorized verifier and student attempt to self-verify | Request is rejected and database state/counts remain unchanged |
| EVT-01 | Authorized organizer creates/edits an event and adds an attendance session | `events` and `attendance_sessions` rows persist after reload |
| ATT-01 | Authorized scanner checks in a participant | Exactly one `attendance_records` row exists with server timestamp and authenticated scanner |
| ATT-02 | Repeat check-in and check-in outside valid state/window | Rejected; unique attendance row remains exactly one |
| CERT-01 | Create/version/validate/publish a certificate template through supported workflow | Template family/version changes are persisted; invalid publish is rejected |
| CERT-02 | Issue a certificate only to an eligible participant, verify its public code/PDF, then revoke or reissue | Batch and certificate rows persist; status/history and verification output agree after reload |
| PERS-01 | Personnel creates/edits an accomplishment and uploads evidence | Accomplishment and evidence metadata rows persist; ownership is enforced |
| PERS-02 | Personnel submits a portfolio; reviewer returns a deficiency; personnel resubmits | Submission/version, selected-item snapshot, deficiency, and lifecycle event rows persist in correct order |
| HR-01 | HR performs qualification review and creates an evaluation | Qualification and evaluation rows persist; unqualified personnel cannot incorrectly progress |
| HR-02 | Reviewer rates criteria/items and finalizes | Item scores, totals, status, actor, and event history persist; limits and required criteria are enforced server-side |
| SCORE-01 | Run OSAD evaluation for a student with verified and unverified achievements | Only verified eligible records contribute; criterion scores and evidence mappings persist; rerun is idempotent |
| SCORE-02 | Change/attempt invalid criteria or threshold data | Valid authorized change persists; invalid/unauthorized change is rejected without database mutation |
| PRINT-01 | Print/export a Student portfolio | Output contains identity and all applicable verified achievements, excludes unverified/rejected records, has usable A4 pagination, and matches fresh database-backed API data |
| PRINT-02 | Print/export a Personnel portfolio/evaluation summary | Output contains accomplishment evidence and finalized evaluation data, has usable A4 pagination, and matches the persisted snapshot/version |
| REPORT-01 | Generate OSAD candidate/evaluation report | Candidate decision, criterion breakdown, score/evidence lineage, and database snapshot agree |
| REPORT-02 | Generate HR ranking/promotion report | Criteria, item scores, total, qualification/pass result, rank/promotion context, and immutable report/document snapshot agree |
| CONS-01 | Hard reload, clear browser storage, and sign in again after every successful mutation | Data is reconstructed from API/MySQL, not retained only in the browser |
| TXN-01 | Force one safe validation failure in each multi-table workflow | No orphan or partial committed rows remain |

### Automated regression evidence

Run the nearest focused tests first, then the complete suites when the environment safely permits:

```powershell
Set-Location backend
composer test

Set-Location ..\frontend
npm test
npm run lint
npm run build
```

Explicitly include the closest available integration/feature tests for student achievement lifecycle and routing, event-attendance-certificate integration, attendance duplicates/state transitions, personnel portfolio submission, reviewer evaluation/revision, certificate lifecycle/PDF, OSAD scoring, and printable official summaries. State which tests use mocks, SQLite, fixtures, or MySQL; mock-only tests cannot prove MySQL persistence.

### Database proof requirement

After running the manual scenarios, execute the supplied read-only script:

`backend/database/mysql-defense/validation/defense_objectives_persistence_checks.sql`

Set its variables to the unique test marker and test-user emails first. Include the SQL output in the evidence report. Also show `SHOW CREATE TABLE` or `information_schema` evidence for relevant keys, foreign keys, unique constraints, and status constraints.

From the repository root in PowerShell, run:

```powershell
Get-Content -Raw ".\backend\database\mysql-defense\validation\defense_objectives_persistence_checks.sql" |
  & "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe" -u root --table achievenest_local
```

If the MySQL account requires a password, add `-p` and enter it at the prompt. Do not put the password in the command, script, screenshot, or report.

### Required final report format

1. Executive verdict: each objective marked PASS, PARTIAL, or FAIL.
2. Requirements traceability matrix: objective -> UI -> API -> service/policy -> MySQL tables -> automated/manual test -> verdict.
3. Test execution table with each mandatory test case, actual result, record IDs, and evidence paths/screenshots/logs.
4. Persistence ledger for every mutation: before state, request, response, committed rows, reload proof, and audit/history proof.
5. Security/RBAC and negative-test results.
6. Printable-output comparison against authoritative stored data.
7. Automated test commands, totals, failures, and environment.
8. Defects ranked Critical/High/Medium/Low, with exact file/route/table references and reproduction steps.
9. Explicit list of UI-only, mocked, hard-coded, local-storage-only, incomplete, or unverified behavior.
10. Final statement: **“Fully implemented” is allowed only if all four objectives and all critical mandatory tests pass with live MySQL proof.**

Do not implement fixes during the audit unless separately instructed. First produce an evidence-backed gap report.

---

## Panel execution note

For the clearest database proof, use a unique test marker in titles and names, record the returned UUIDs, then substitute those UUIDs/emails into the SQL script. A successful toast or visible new row is not sufficient until the row is found in MySQL and still appears after a hard reload.
