# Checksum & Artifact Manifest — Plan I Phase I0 Storage & Security Audit

## Evidence Files in `docs/implementation/evidence/plan-i-i0-storage-security-audit/`

1. `environment.md` — Environment specifications and runtime modes.
2. `storage-provider-audit.md` — Storage provider and directory structure analysis.
3. `storage-configuration-audit.md` — Config sources, environment variables, and credential exposure checks.
4. `bucket-privacy-audit.md` — Privacy classification and signed/authenticated streaming audit.
5. `upload-endpoint-inventory.md` — Complete inventory of production upload and evidence endpoints.
6. `plan-a-upload-trace.md` — End-to-end trace from modal to storage and DB.
7. `filename-mock-local-audit.md` — Identification of filename-only URLs and mock test fixtures.
8. `database-evidence-reference-audit.md` — Schema and table inventory referencing evidence.
9. `accepted-document-types.md` — Allowed and prohibited document extensions and MIME types.
10. `mime-extension-size-audit.md` — Dual-layer (client + server finfo) MIME and size validation audit.
11. `filename-handling-audit.md` — Original filename preservation vs UUID physical storage key generation.
12. `upload-atomicity-audit.md` — Storage vs DB rollback cleanup behavior.
13. `access-mechanism-audit.md` — Authenticated streaming endpoint and security headers.
14. `personnel-access-audit.md` — Personnel own-evidence authorization.
15. `dean-access-audit.md` — College Dean academic review scope and cross-college rejection.
16. `hr-access-audit.md` — HR review authority and oversight scope.
17. `snapshot-evidence-audit.md` — Plan C submitted snapshot references and immutability.
18. `replacement-behavior-audit.md` — Working draft evidence replacement vs locked snapshot.
19. `ocr-source-audit.md` — OCR binary stream extraction and zero-fabrication guarantees.
20. `reviewer-preview-source-audit.md` — Reviewer workspace evidence preview handling and gaps.
21. `integrity-metadata-audit.md` — SHA-256 cryptographic hash and size metadata audit.
22. `duplicate-behavior-audit.md` — File collision prevention and duplicate content hash analysis.
23. `deletion-workflow-audit.md` — Owner-authorized deletion and HR-on-behalf audit.
24. `orphan-stale-link-audit.md` — Orphan scenarios and stale URL response behavior.
25. `security-risk-register.md` — Comprehensive security risk register (RISK-I0-01 to RISK-I0-05).
26. `i1-authoritative-rule-freeze.md` — Authoritative upload rules frozen for Phase I1.
27. `focused-test-output.txt` — 24 focused audit tests passed.
28. `full-suite-output.txt` — Full suite run output (140 files / 1214 tests passed).
29. `full-suite-result.json` — Structured test run JSON.
30. `checksum-manifest.md` — This artifact manifest.
