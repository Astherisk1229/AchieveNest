# AchieveNest Plan 07 — Phase 6 Evidence
# Session Revocation & Rotation Contract

---

## 1. Session Revocation & Token Rotation Lifecycle

1. **Pre-Change Session Invalidation**:
   `LocalTokenService::revokeAllSessionsForProfile($profileId, 'password_change')` marks all existing sessions in `local_auth_sessions` as revoked.
2. **Fresh Token Generation**:
   `LocalTokenService::issueToken($profileId, false, $ip, $userAgent)` creates a fresh, active session in `local_auth_sessions` after revocation.
3. **Old Token Rejection**:
   Attempting to use the old temporary token against `/auth/me` or any endpoint results in HTTP `401 INVALID_ACCESS_TOKEN`.
4. **Client Storage Replacement**:
   `authService.submitPasswordChange()` stores the fresh token, updates the active user snapshot, and rehydrates session via `getAuthUser()`.
