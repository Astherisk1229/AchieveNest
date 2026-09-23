# Evidence Access Regression Verification

## Authorized Evidence Inspection

1. **Authorized Review**:
   - Reviewer can preview valid proof attachments (`preview_url: /api/v1/evidence/preview/...`).
2. **Missing Evidence Degradation**:
   - Unattached or missing evidence safely presents an `evidence_unavailable` warning banner without throwing unhandled exceptions or falsifying point values.
3. **Cross-Scope Protection**:
   - Unauthorized reviewers cannot access evidence endpoints for other colleges or records.
