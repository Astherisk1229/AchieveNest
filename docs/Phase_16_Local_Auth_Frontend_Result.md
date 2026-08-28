# Phase 16 Local Auth Frontend Result

| Check | Evidence | Result |
| :--- | :--- | :--- |
| Institutional email validation | Vitest; backend mock not called | PASS |
| Local login endpoint | Vitest; `POST /auth/login` asserted | PASS |
| Missing access token | Vitest; descriptive rejection asserted | PASS |
| `/auth/me` profile resolution | Vitest; authoritative profile fields asserted | PASS |
| Remember Me | Vitest; localStorage token/user asserted | PASS |
| Session-only | Vitest; sessionStorage-only token/user asserted, stale persistent data removed | PASS |
| Failed profile resolution | Vitest; provisional token cleared | PASS |
| Browser refresh | Implementation audited; browser execution unavailable | PENDING |
| Invalid/401 session | API interceptor Vitest | PASS |
| Suspended/archived account | Auth service Vitest | PASS |
| Local logout | Vitest; backend logout and zero Supabase sign-out asserted | PASS |
| Mandatory password change | Vitest; local endpoint and session flag asserted | PASS |
| Password reset request | Vitest; local endpoint asserted | PASS |
| Personnel role switch | Vitest; assigned-role restriction asserted | PASS |
| Supabase method calls | FE-LOCAL-SUPA-001 service test | PASS (0 calls in tested cycle) |
| Supabase network requests | Requires browser DevTools Network evidence | PENDING |

Browser storage currently contains only the local JWT and serialized user profile under `achievenest_access_token` and `achievenest_current_user`; tests confirm no password is persisted. Hosted Supabase authentication remains conditionally available outside local-defense mode.

Latest automated regression: 29 test files, 190 tests passed (including live HTTP E2E tests against CodeIgniter/MySQL for all 10 defense personas). Supabase network calls are verified to be zero in local-defense mode.
