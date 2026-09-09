# Checksum & Artifact Manifest — Plan I Phase I1 Secure Upload Pipeline

## Evidence Files in `docs/implementation/evidence/plan-i-i1-secure-upload-pipeline/`

1. `environment.md` — Environment specifications and runtime parameters.
2. `upload-flow.md` — Sequence diagram of the canonical secure upload flow.
3. `ownership-validation.md` — Server-derived ownership verification and cross-owner denial.
4. `extension-allowlist.md` — Allowed extensions matrix (PDF, JPG, JPEG, PNG).
5. `mime-validation.md` — Dual verification and server-side finfo MIME validation.
6. `size-validation.md` — Exact boundary enforcement for 10 MiB limit.
7. `filename-sanitization.md` — Sanitization against path traversal and special characters.
8. `storage-key-generation.md` — Non-guessable UUID storage path architecture.
9. `protected-storage-verification.md` — Storage isolation outside public webroot.
10. `sha256-integrity.md` — SHA-256 cryptographic hash computation on storage.
11. `evidence-metadata-persistence.md` — Authoritative database schema attributes.
12. `atomicity-storage-failure.md` — Storage failure without database record creation.
13. `atomicity-database-failure.md` — Transaction rollback and physical file deletion.
14. `linkage-failure-cleanup.md` — Prevention of unlinked / orphan evidence rows.
15. `retry-idempotency.md` — Safe retry without partial state or lock collisions.
16. `api-response-security.md` — Elimination of absolute filesystem path leakage.
17. `filename-only-proof-elimination.md` — Enforcement of real persisted bytes.
18. `malware-scanner-status.md` — Truthful documentation of deferred scanner status.
19. `i0-risk-mapping.md` — Traceability and scope mapping to Phase I0 risks.
20. `focused-test-output.txt` — Output of focused Phase I1 test suite.
21. `full-suite-output.txt` — Output of master test suite (141 files / 1247 tests passed).
22. `full-suite-result.json` — Structured JSON result of full test run.
23. `checksum-manifest.md` — This artifact manifest.
