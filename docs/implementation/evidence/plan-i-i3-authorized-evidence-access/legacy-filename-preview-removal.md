# Legacy Filename Preview Removal

## 1. Removal of Insecure Filename Preview Route
- In Phase I0, RISK-I0-01 identified that reviewer preview was constructed using filename paths: `/api/v1/evidence/preview/${fileName}`.
- In Phase I3, all production preview endpoints and frontend services have been updated to use canonical ID-based paths:
  `/api/v1/evidence/personnel/${evidenceId}/preview`.
- The filename is no longer an authoritative retrieval key.

## 2. Test Verification
- Test 4.4: `verifies filename alone is never treated as authoritative retrieval key` (PASSED).
- Test 6.1: `generates canonical evidence-ID preview URL in evaluator workspace (RISK-I0-01 Closure)` (PASSED).
