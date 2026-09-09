# AchieveNest — Hostinger Migration Dependency Inventory

This file records only dependencies verified in the current repository. It is used to prevent blind or incomplete migration from Supabase/PostgreSQL to Hostinger PHP/MySQL.

## Verified frontend Supabase Auth dependencies

- `frontend/src/config/supabase.js`
  - creates the Supabase client
  - contains fallback Supabase URL/anon-key configuration on `main`
- `frontend/src/services/apiClient.js`
  - reads the Supabase session and injects the Supabase access token into API requests
- `frontend/src/services/authService.js`
  - `signInWithPassword()`
  - `signOut()`
  - relies on Supabase access token before resolving backend profile/roles
- `frontend/src/context/AuthContext.jsx`
  - restores Supabase sessions
  - listens for Supabase auth-state changes/token refresh/logout
- `frontend/src/pages/common/ResetPasswordPage.jsx`
  - reads Supabase recovery sessions/auth-state events
- `frontend/src/pages/common/AccountPage.jsx`
  - updates passwords through `supabase.auth.updateUser()`
- `frontend/package.json`
  - includes `@supabase/supabase-js`

## Verified backend Supabase Auth dependencies

- `backend/app/Services/SupabaseAuthService.php`
  - verifies Supabase bearer/access tokens
- `backend/app/Services/SupabaseAdminAuthService.php`
  - uses Supabase admin/server configuration
- `backend/app/Services/AuthenticatedActorService.php`
  - depends on `SupabaseAuthService`
- `backend/app/Controllers/Api/AuthController.php`
  - uses `SupabaseAuthService` for token verification
- `backend/app/Controllers/Api/EventController.php`
  - uses `SupabaseAuthService`
- `backend/app/Controllers/Api/AchievementController.php`
  - uses `SupabaseAuthService`
- `backend/app/Controllers/Api/VerificationQueueController.php`
  - uses `SupabaseAuthService`

This list is not declared complete until the remaining Phase A searches finish.

## Verified PostgreSQL database dependencies

- `backend/app/Config/Database.php`
  - `Postgre` driver
  - PostgreSQL database defaults
  - port 5432
- `backend/.env.example` on `main`
  - Supabase/PostgreSQL connection template
- `backend/app/Database/Migrations/2026-08-21-000001_CreateIdentityAndAcademicFoundation.php`
  - `CREATE EXTENSION pgcrypto`
  - PostgreSQL `uuid`
  - `gen_random_uuid()`
  - `timestamptz`
  - `public.*` schema qualification
  - foreign key to `auth.users(id)`
  - PostgreSQL regex/check expressions
  - `btrim()`
  - `NULLS NOT DISTINCT`
  - PL/pgSQL function/trigger
  - Supabase RLS
  - `anon` / `authenticated` database roles

## Verified storage result so far

A repository search for `supabase.storage` returned no result. This means no direct `supabase.storage` call was found by that exact search; it does **not** prove file storage is unused. Upload/file handling must still be audited separately.

## Migration rule

Do not delete Supabase code first. Replace each dependency with a tested PHP/MySQL equivalent, migrate its callers, run tests, and only then remove the old dependency.

## Immediate replacement order

1. MySQL-compatible identity schema foundation
2. Server-side password/JWT authentication service
3. `AuthenticatedActorService` token source
4. `/api/v1/auth/*` endpoints
5. API controllers currently validating Supabase tokens
6. frontend `apiClient.js`
7. frontend `authService.js`
8. frontend `AuthContext.jsx`
9. reset/change-password pages
10. remove Supabase client dependency only after no runtime imports remain
