# Reviewer Workspace Rewiring (RISK-I0-01 Closure)

## 1. Rewiring Details
In `PersonnelEvaluatorWorkspaceService.js` and `PersonnelEvaluatorWorkspaceService.php`:
- Item formatting now extracts `evidence_id` from submitted snapshot items.
- Sets `evidence_reference.evidence_id = evidenceId`.
- Sets `evidence_reference.preview_url = /api/v1/evidence/personnel/${evidenceId}/preview`.
- If evidence is absent, sets status to `evidence_unavailable` with a controlled advisory message.

## 2. Test Verification
- Test 6.1: `generates canonical evidence-ID preview URL in evaluator workspace (RISK-I0-01 Closure)` (PASSED).
- Test 6.2: `handles missing evidence cleanly without generating preview URL` (PASSED).
