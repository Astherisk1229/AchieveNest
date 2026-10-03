# Evidence Review & Authorization Verification

## Evidence Inspection & Protection

The evaluator workspace surfaces submitted proof files for inspection by authorized reviewers.

### 1. Authorized Evidence Retrieval
- Reviewer fetches valid evidence reference:
  - `id`: `ev_101`
  - `file_name`: `phd_diploma_verified.pdf`
  - `file_type`: `application/pdf`
  - `url`: `/storage/evidence/phd_diploma_verified.pdf`
  - `status`: `available`
- Result: **Successfully retrieved and previewable**.

### 2. Unauthorized Evidence Access Defense
- An unrelated Dean or unassigned actor attempting to call evidence inspection for another college/candidate is **blocked with 403 Forbidden**.
- Direct URL / API tampering is intercepted by reviewer access validation.
