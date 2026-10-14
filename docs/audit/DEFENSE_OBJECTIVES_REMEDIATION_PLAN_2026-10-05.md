# AchieveNest Defense Objectives — Remediation and Re-Audit Plan

Date: 2026-10-05. Follows `DEFENSE_OBJECTIVES_AUDIT_REPORT_2026-10-05.md`.
Goal: reach live-MySQL PASS on all four objectives and every critical mandatory test, with evidence.
Rule for every phase: work on a disposable copy first; `achievenest_local` is changed only after a fresh backup and an explicit go-ahead.

## Phase 0 — Safe baseline (about 30 min)
1. Back up `achievenest_local` (use the existing Phase 18 backup runbook) and record the file path and checksum.
2. Restore that backup into `achievenest_phase2_restore_test` so the disposable DB mirrors the protected one.
3. Run `php spark migrate:status` against the disposable DB and list every pending migration (expect Phase2 000029 and 000030).
Exit: backup verified; pending-migration list recorded.

## Phase 1 — Fix D1: schema drift blocks events (Critical)
1. Apply pending migrations to the disposable DB; confirm `events.osad_template_id`, `password_reset_requests.rejection_reason` and the 000030 personnel profile columns exist.
2. Retest `POST /api/v1/events`: expect 201 and a committed `events` row.
3. Add a regression test that creates an event against MySQL, and a readiness check that fails when migrations are pending.
4. After sign-off, apply the same migrations to `achievenest_local`.
Exit: EVT-01 passes; no pending migrations in either DB.

## Phase 2 — Fix D2: complete the backend test run (High)
1. Mock or skip the ClamAV scanner test when ClamAV is unavailable; keep one explicit integration test that runs only when it is.
2. Run `composer test`, `npm test`, `npm run lint`, `npm run build`; record totals.
3. Classify each relevant test as mock, SQLite, fixture or MySQL, and add MySQL-backed tests for the gaps (student lifecycle, attendance duplicates, certificate lifecycle, scoring, personnel submission).
Exit: clean `composer test` and `npm run build`; classification table written.

## Phase 3 — Test data setup (D3)
1. In the disposable DB only, reset one personnel portfolio to editable, and create a marked student, organizer, scanner, reviewer and HR actor set if the demo accounts lack them.
2. Use marker `DEFENSE-<date>-<time>` in every title and name.
Exit: each role can sign in; a personnel portfolio is editable.

## Phase 4 — Run the mandatory tests, in dependency order
For each test record: actor, request, response, row IDs, SQL proof, hard reload plus cleared storage plus fresh login, and audit/history rows.
1. AUTH-01 with 401/403 negatives across all six roles.
2. STU-01 to STU-04 (draft, evidence upload and submit, revision, verify, self-verify rejection).
3. EVT-01, ATT-01, ATT-02 (event, session, check-in, duplicate, out-of-window).
4. CERT-01, CERT-02 (template version, validate, publish, issue to eligible only, verify code and PDF, revoke or reissue).
5. PERS-01, PERS-02, HR-01, HR-02 (accomplishment and evidence, submit, deficiency return, resubmit, qualification review, evaluation, finalize).
6. SCORE-01, SCORE-02 (verified-only contribution, idempotent rerun, invalid or unauthorized criteria change leaves no mutation).
7. PRINT-01, PRINT-02, REPORT-01, REPORT-02 (A4 output compared field by field with fresh API data and stored snapshots).
8. TXN-01: one forced validation failure per multi-table workflow, then orphan and partial-row queries.
9. CONS-01 after every mutation above.
Exit: every row of the test matrix has PASS, PARTIAL or FAIL with evidence; no UNVERIFIED left.

## Phase 5 — Close the proof-script and cleanup gaps
1. Extend `defense_objectives_persistence_checks.sql` to cover `award_definitions`, `award_criteria`, `award_scoring_rules`, `award_cycles` and the personnel portfolio submission and version tables; confirm names from the live schema first.
2. Re-run the script on the disposable DB with the real marker and UUIDs, and once read-only on `achievenest_local`.
3. Review `personnel/portfolio/purge` for role restriction and audit logging.
4. Fix the `?` character-set loss in seeded titles (check seed file encoding and the DB connection charset).
5. Quarantine or delete `HRController`, `CertificateIssuanceController`, `OSADController`/`useOSAD` and the legacy `AttendanceController` once confirmed unused; review `signatureVault` for official documents.
6. Report cleanup of marked test rows separately.
Exit: script covers all required tables; dead mock code removed or labeled test-only.

## Phase 6 — Final report
Regenerate the gap report in the required 10-section format. Mark "Fully implemented" only if all four objectives and all critical tests pass with live MySQL proof.

## Order, risk and decisions needed
- Order: 0, 1, 2 can run back to back; 3 and 4 depend on 1; 5 can run in parallel with 4.
- Main risks: migration 000030 may have its own drift; ClamAV availability on the defense machine; fixtures that are locked by workflow state.
- Decisions for you: (a) approve applying migrations to `achievenest_local` after the disposable run passes, (b) whether I may fix code defects found during the run or only report them, since the original prompt said not to fix during the audit.
