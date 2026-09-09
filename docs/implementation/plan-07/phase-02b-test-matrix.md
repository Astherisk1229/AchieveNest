# AchieveNest Plan 07 — Phase 2B Evidence
# Test Matrix & Verification Results

---

## 1. Backend Unit Tests (`AccountLifecycleResolverTest.php`)

| Test Method | Scenario | Assertions | Result |
| :--- | :--- | :---: | :---: |
| `testActiveWithMustChangePasswordDerivesPendingFirstLogin` | Canonical `1` / `true` $\rightarrow$ `pending_first_login` | 7 | **PASS** |
| `testActiveWithMustChangePasswordOneDerivesPendingFirstLogin` | Numeric `1` $\rightarrow$ `pending_first_login` | 4 | **PASS** |
| `testActiveWithMustChangePasswordFalseDerivesActive` | Canonical `0` / `false` $\rightarrow$ `active` | 7 | **PASS** |
| `testMissingCredentialFailsClosedAsUnknownAndMissing` | `mustChangePassword = null` $\rightarrow$ `unknown` / `missing` | 7 | **PASS** |
| `testExplicitMissingIntegritySignal` | Explicit `missing` signal $\rightarrow$ `unknown` / `missing` | 5 | **PASS** |
| `testInvalidCredentialValueFailsClosed` | Unsupported string $\rightarrow$ `unknown` / `invalid` | 7 | **PASS** |
| `testDuplicateCredentialSignalFailsClosed` | Duplicate signal $\rightarrow$ `unknown` / `duplicate` | 5 | **PASS** |
| `testSuspendedPrecedenceOverMustChangePassword` | `suspended` overrides credentials | 5 | **PASS** |
| `testArchivedPrecedenceOverMustChangePassword` | `archived` overrides credentials | 5 | **PASS** |
| `testDisabledPrecedenceOverMustChangePassword` | `disabled` overrides credentials | 5 | **PASS** |
| `testLockedPrecedence` | `locked` overrides credentials | 5 | **PASS** |
| `testUnsupportedStatusFailsClosedAsUnknown` | Invalid status fails closed | 5 | **PASS** |
| `testNullStatusFailsClosedAsUnknown` | Null status fails closed | 7 | **PASS** |

---

## 2. Integration & Integrity Suites

| Suite / Test | Validated Behavior | Result |
| :--- | :--- | :---: |
| **Migration `000055` UP / DOWN Test** | Drop column and tested rollback backfill | **PASS** |
| **Live Contract Test (8-step)** | Complete lifecycle provisioning, login, change-password, reset | **PASS** |
| **Missing Credential Live Test** | Orphan student listed as `unknown`/`missing`, login fails 401 | **PASS** |
| **Frontend Vitest Suite** | 66 test files, 386 tests | **PASS (386/386)** |
