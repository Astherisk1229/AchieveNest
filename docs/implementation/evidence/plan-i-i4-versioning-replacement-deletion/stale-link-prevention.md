# Stale-Link Prevention & Post-Deletion Access Denial

## 1. Post-Deletion Access Behavior
Following owner-authorized complete deletion:
1. Direct preview requests (`GET /api/v1/evidence/personnel/{id}/preview`) fail with HTTP 404 / `evidence_deleted` / `evidence_not_found`.
2. Direct download requests (`GET /api/v1/evidence/personnel/{id}/download`) fail identically.
3. No fallback to filename search or legacy routes is permitted.
4. Physical file bytes are completely unlinked from server disk.

## 2. Test Verification
- Test 4.1: `denies preview access to deleted evidence across all roles` (PASSED)
- Test 4.2: `denies download access to deleted evidence across all roles` (PASSED)
