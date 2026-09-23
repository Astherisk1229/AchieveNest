# Filename-Only, Mock & Local Implementation Search

## Search Findings & Classification
1. **Frontend Evaluator Workspace Preview URLs**:
   - In `PersonnelEvaluatorWorkspaceService.js`, `preview_url` was formatted as `/api/v1/evidence/preview/${fileName}`.
   - *Classification*: Active architectural gap (Risk RISK-I0-01). Reviewer preview must resolve via evidence ID or authenticated proxy rather than plain filename.
2. **Mock Evidence Fixtures in Unit Tests**:
   - Found in legacy test suites (`sampleAdminSnapshot`, `sampleNonTeachingSnapshot` using static mock filenames like `PhD_Diploma_Ana_Reyes.pdf`).
   - *Classification*: Test-only fixture (acceptable in unit testing, but production requires real DB evidence ID resolution).
3. **Local Storage / Base64 Evidence as Durable Proof**:
   - No base64/data URI proof strings are persisted into the database as permanent evidence.
   - Real binary files are persisted in `writable/uploads/evidence/` with SHA256 hashes recorded in the database.
