# Phase 7 production readiness

> **Closed 2026-10-04.** The controlled production promotion and final
> authenticated acceptance tests completed successfully. The production
> acceptance evidence is recorded in `RAILWAY_DEPLOYMENT.md`. The inventory
> and unchecked preparation state below are retained as the historical
> pre-promotion snapshot, not the current production status.

This checklist prepares the production promotion without performing it. No
production database, volume, variable, domain, migration, or deployment may be
created or changed until an operator explicitly authorizes the promotion
window.

## Accepted baseline

- Staging acceptance commit: `690d2bbf25ec95fc6a0ee63f4ad09a30f9010a5b`.
- Public staging API:
  `https://achievenest-staging-staging.up.railway.app/api/v1`.
- Phase 4 migration replays, Phase 5 health verification, and Phase 6 API smoke
  tests are recorded in `RAILWAY_DEPLOYMENT.md`.
- The eventual production candidate must be the reviewed merge commit that
  contains this checklist and its frontend deployment guard. Record that full
  commit SHA before promotion.

## Historical read-only production inventory (before promotion, 2026-10-04)

Railway project `d83e61ca-5879-40a2-83f4-0d2f66268bee` was inspected without
changing it. The production environment is deliberately **NO-GO**:

| Gate | Current production state | Required state |
| --- | --- | --- |
| Backend commit | `841f0c00c2851080cf8cc36134ab6d2346c31bf7` | Exact reviewed Phase 7 candidate |
| MySQL | No production service instance | Dedicated production MySQL 8.4 with persistent storage |
| Backend storage | No `/app/writable` volume | Mounted volume plus verified off-platform backup/restore |
| Runtime variables | Railway system variables only | Complete application variables from `.env.railway.example` |
| Healthcheck | Not configured | `/api/v1/health`, 300-second timeout |
| Start command | Not configured | Runbook command that prepares writable paths and ClamAV |
| Public backend domain | None | Generate only after private health succeeds |
| Frontend | Permanent production origin/API mapping not accepted | Exact HTTPS origin and production API URL |

The production service must remain on its existing commit while this table is
NO-GO. Do not use the old running service as evidence that the current release
is production-ready.

## Preparation actions

- [x] Record the accepted staging commit and public API endpoint.
- [x] Confirm the repository starts Phase 7 from a clean `main` worktree.
- [x] Inventory production Railway services without reading or printing secret
  values.
- [x] Add a frontend prebuild guard that requires an explicit absolute HTTPS
  production API URL and rejects local or staging endpoints.
- [x] Choose and record the permanent HTTPS frontend production origin:
  `https://achieve-nest-sand.vercel.app` (the primary production alias on the
  Vercel `achievenest/achieve-nest` project).
- [ ] Choose and record the permanent HTTPS backend production domain.
- [ ] In Vercel Production, set `VITE_API_BASE_URL` to the final backend URL
  ending in `/api/v1`. Do not put server secrets in `VITE_*` variables.
- [x] In a Vercel Preview or other permanent staging frontend, set
  `VITE_API_BASE_URL=https://achievenest-staging-staging.up.railway.app/api/v1`.
- [x] Add that exact staging frontend origin to staging CORS and repeat the
  browser login/read/write/upload/logout smoke flow.
- [ ] Confirm Railway production automatic deployments are disabled before the
  preparation PR is merged.
- [ ] Record the full reviewed production candidate and rollback commit SHAs.
- [ ] Schedule an owner and maintenance window for the separately authorized
  production promotion.

## Frontend staging acceptance (2026-10-04)

- Vercel project: `achievenest/achieve-nest`
  (`prj_dMeyWBt1lKnntzdP1BnQ15Qgr2fj`).
- Stable protected preview origin:
  `https://achieve-nest-git-codex-phase7-production-pre-8d1c2f-achievenest.vercel.app`.
- Accepted preview deployment: `dpl_13hcgt4rDntjewrsbPMc6FRNUiPC`.
- The branch-scoped Preview variable points to the public staging API. The
  compiled preview asset contains that absolute API URL and does not contain
  the relative `/api/v1` fallback.
- Staging backend deployment `e2017e9e-e199-49b4-bc55-2198890acbd0` completed
  successfully after setting the exact preview origin as the sole allowed
  origin. A preview-origin preflight returns HTTP 204 and the matching
  `Access-Control-Allow-Origin` value. A different origin receives the sole
  configured preview-origin value, so browsers reject it because it does not
  match the requesting origin.
- Headless Chrome on the protected preview passed UI login, authenticated
  `/auth/me`, an authorized draft write through the supported portfolio API,
  JPEG upload, ClamAV scan (`clean`), evidence metadata and download, exact
  SHA-256/229,721-byte verification, evidence deletion, logout, login-page
  return, and HTTP 401 rejection of the revoked token.
- The disposable portfolio row, uploaded physical file, local-auth session,
  and temporary student fixture were removed and verified absent. The
  temporary Railway SSH key and Vercel automation-bypass secret were revoked;
  the Vercel project reports an empty `protectionBypass` object.

This acceptance does not set the Vercel Production API variable, choose a
production backend domain, or authorize a Railway production deployment.

Run the frontend guard locally with a non-secret candidate URL:

```powershell
$env:ACHIEVENEST_REQUIRE_PRODUCTION_ENV='true'
$env:VITE_API_BASE_URL='https://YOUR_PRODUCTION_BACKEND_DOMAIN/api/v1'
npm run build
```

## Promotion actions requiring separate authorization

These actions are intentionally not part of preparation:

1. Provision a dedicated production MySQL service and persistent database
   volume.
2. Mount a separate backend volume at `/app/writable` and establish encrypted
   off-platform backup storage.
3. Generate a unique production JWT secret and configure the exact issuer,
   audience, CORS origin, database references, runtime binaries, healthcheck,
   and start command.
4. Deploy the exact reviewed candidate privately and verify PHP limits,
   ClamAV signatures, MySQL connectivity, and `/api/v1/health`.
5. Create and verify pre-migration backup artifacts. Restore them into an
   isolated disposable target before changing production data.
6. Apply only the approved `Phase17Canonical` and `Phase2` migration namespaces
   with the temporary production migration authorization variables, then remove
   those variables.
7. Generate the backend domain, set `app_baseURL`, and run health and critical
   smoke tests from the permanent frontend origin.
8. Enable automatic deployment only after acceptance is recorded.

## Stop and rollback rules

Stop the release before public cutover if any healthcheck, database connection,
migration ledger, schema sentinel, ClamAV scan, CORS preflight, authentication,
authorized write, upload, or persistence check fails. Preserve logs and do not
retry migrations blindly.

For application-only failure with a compatible schema, redeploy the recorded
rollback commit. For migration or data-integrity failure, stop application
writes and restore the verified database and writable artifacts according to
the Railway runbook. A code rollback is not a database rollback.

## Historical go/no-go decision

Promotion is **NO-GO** until every unchecked preparation action has evidence,
the production infrastructure gates are configured during an explicitly
authorized window, and the exact candidate passes all required checks. Preparing
or merging documentation does not authorize production deployment.

That authorization and acceptance were subsequently completed on 2026-10-04;
see the production acceptance record in `RAILWAY_DEPLOYMENT.md`. Production
automatic deployment remains disabled, and future releases continue to use the
staging-first, exact-commit manual promotion workflow.
