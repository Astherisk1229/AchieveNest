# Phase J2 Evidence: Structured Deficiency Reason & Requested Evidence

## Deficiency Reason
- Categorizes or articulates the deficiency in submitted materials (e.g., Incomplete documentation, Unverified CPD points, Missing Dean endorsement).
- Persisted in structured JSON and event metadata (`metadata.reason`).

## Requested Evidence
- Details the specific additional or corrected proofs required from Personnel.
- Enforced to avoid AI/OCR guesswork: reviewers explicitly specify what document types or certifications are missing.
- Persisted in `evaluator_remarks` and passed via `metadata.required_corrections` in canonical events.
