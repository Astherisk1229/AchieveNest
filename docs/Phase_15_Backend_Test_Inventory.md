# Phase 15 Backend Test Inventory

This inventory documents and classifies every backend test file and Spark verification command across the AchieveNest repository.

| Test File / Command | Type | Technology Assumption | Local Equivalent | Run in Local Gate? | Reason / Classification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `tests/unit/HealthTest.php` | PHPUnit Unit | Pure PHP / Offline | N/A | YES | Basic PHP environment sanity. | `LOCAL-APPROVED` |
| `tests/Feature/HealthEndpointTest.php` | PHPUnit Feature | Local MySQL / CI4 | N/A | YES | Validates `/api/v1/health` endpoint against `achievenest_local`. | `LOCAL-APPROVED` |
| `tests/Feature/AuthMeEndpointTest.php` | PHPUnit Feature | Local MySQL / CI4 | N/A | YES | Validates `/api/v1/auth/me` local token resolution. | `LOCAL-APPROVED` |
| `tests/Feature/AchievementAndEventEndpointTest.php` | PHPUnit Feature | Local MySQL / CI4 | N/A | YES | Validates local Achievement & Event lookup endpoints. | `LOCAL-APPROVED` |
| `tests/Feature/PersonnelRoleEndpointTest.php` | PHPUnit Feature | Local MySQL / CI4 | N/A | YES | Validates personnel role resolution in local database. | `LOCAL-APPROVED` |
| `tests/Feature/ProvisioningAndLifecycleEndpointTest.php` | PHPUnit Feature | Local MySQL / CI4 | N/A | YES | Validates account provisioning and lifecycle status logic. | `LOCAL-APPROVED` |
| `tests/Feature/AdminAuthorizationAndIntegrityTest.php` | PHPUnit Feature | Local MySQL / CI4 | N/A | YES | Validates admin authorization rules on local MySQL. | `LOCAL-APPROVED` |
| `tests/Feature/Day1FoundationAndRoleTest.php` | PHPUnit Feature | Local MySQL / CI4 | N/A | YES | Validates Day 1 foundation roles and schema models. | `LOCAL-APPROVED` |
| `tests/Feature/Phase8Step2AuthE2ETest.php` | PHPUnit Feature | Hosted Supabase Auth | `test:phase7-auth`, `test:phase8-authz` | NO | Preserved historical Supabase Auth E2E test. | `HOSTED-PRESERVED` |
| `tests/Feature/Phase8Step3GovernanceE2ETest.php` | PHPUnit Feature | PostgreSQL PDO / Supabase | `test:phase8-authz`, `test:phase14-workflows` | NO | Preserved historical PostgreSQL/Supabase governance test. | `HOSTED-PRESERVED` |
| `tests/Feature/Phase8Step4PortfolioE2ETest.php` | PHPUnit Feature | PostgreSQL PDO / RLS / Storage | `test:phase13-step4` | NO | Preserved historical Step 4 PostgreSQL/Supabase test. | `HOSTED-PRESERVED` |
| `tests/Feature/PasswordResetRequestTest.php` | PHPUnit Feature | Mocked `SupabaseAdminAuthService` | `test:phase7-auth`, `test:phase14-workflows` | NO | Historical mock test targeting deprecated Supabase service. | `PORTED/REPLACED` |
| `tests/Feature/AwardThresholdActorBindingTest.php` | PHPUnit Feature | Deprecated Prototype Controller Reflection | `test:phase14-awards` | NO | Stale unit reflection replaced by authoritative award test suite. | `PORTED/REPLACED` |
| `app/Commands/VerifyPhase7Auth.php` | Spark CLI (`test:phase7-auth`) | Local MySQL 8.4.7 | N/A | YES | 27 assertions: Local Auth, passwords, sessions, JWTs. | `LOCAL-APPROVED` |
| `app/Commands/VerifyPhase8Authz.php` | Spark CLI (`test:phase8-authz`) | Local MySQL 8.4.7 | N/A | YES | 36 assertions: Centralized CI4 Authorization Matrix. | `LOCAL-APPROVED` |
| `app/Commands/VerifyPhase9Storage.php` | Spark CLI (`test:phase9-storage`) | Local Filesystem / MySQL | N/A | YES | 28 assertions: Protected file storage, validation, streaming. | `LOCAL-APPROVED` |
| `app/Commands/VerifyPhase11ReferenceData.php` | Spark CLI (`test:phase11-reference`) | Local MySQL 8.4.7 | N/A | YES | 24 assertions: Permanent reference seed integrity & SHA-256. | `LOCAL-APPROVED` |
| `app/Commands/VerifyPhase12Demo.php` | Spark CLI (`test:phase12-demo`) | Local MySQL 8.4.7 | N/A | YES | 36 assertions: Demo personas, synthetic scenarios, preflight. | `LOCAL-APPROVED` |
| `app/Commands/VerifyPhase13Step4Local.php` | Spark CLI (`test:phase13-step4`) | Local MySQL 8.4.7 | N/A | YES | 40 assertions: Step 4 Student Portfolio E2E on MySQL. | `LOCAL-APPROVED` |
| `app/Commands/VerifyPhase14Awards.php` | Spark CLI (`test:phase14-awards`) | Local MySQL 8.4.7 | N/A | YES | 46 assertions: Award evaluation engine & Dean nominations. | `LOCAL-APPROVED` |
| `app/Commands/VerifyPhase14Workflows.php` | Spark CLI (`test:phase14-workflows`) | Local MySQL 8.4.7 | N/A | YES | 30 assertions: HR ranking (70/50/40), governance, audit. | `LOCAL-APPROVED` |
| `app/Commands/VerifyPhase15BackendRegression.php` | Spark CLI (`test:phase15-backend`) | Local MySQL 8.4.7 | N/A | YES | Master backend regression orchestrator & gatekeeper. | `LOCAL-APPROVED` |

---

## Classification Summary
- **LOCAL-APPROVED Tests**: 17 files/suites (8 PHPUnit test files + 9 Spark CLI test suites)
- **HOSTED-PRESERVED Tests**: 3 files (`Phase8Step2AuthE2ETest.php`, `Phase8Step3GovernanceE2ETest.php`, `Phase8Step4PortfolioE2ETest.php`)
- **PORTED/REPLACED Tests**: 2 files (`PasswordResetRequestTest.php`, `AwardThresholdActorBindingTest.php`)
- **OBSOLETE-BLOCKERS**: 0 files
