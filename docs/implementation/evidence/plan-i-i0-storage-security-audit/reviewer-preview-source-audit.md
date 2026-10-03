# Reviewer Preview Source Audit

## Findings
1. **Reviewer Workspace Integration (`PersonnelEvaluatorWorkspaceService.js`)**:
   - Parses submitted snapshot items.
   - Sets `evidence_reference.status` to `PREVIEW_READY` when proof is attached.
   - Sets `evidence_reference.status` to `EVIDENCE_UNAVAILABLE` when proof is missing, with a non-blocking controlled warning.
2. **Current Endpoint Usage**:
   - Legacy preview generation formatted URLs as `/api/v1/evidence/preview/${fileName}`.
   - The authoritative backend route is `/api/v1/evidence/personnel/{id}/download`.
   - Hardening is scheduled for Phase I3 to ensure all previews use authenticated evidence ID resolution.
