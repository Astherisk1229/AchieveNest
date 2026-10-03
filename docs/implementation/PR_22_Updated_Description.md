# PR #22 — Reconcile the authoritative WAMP/MySQL baseline into `main`

## Purpose

This PR reconciles the verified AchieveNest implementation onto one WAMP/MySQL baseline before CHU-01 Phase 2. It preserves valid React + CodeIgniter + MySQL work and removes obsolete active Supabase/PostgreSQL tooling and generated dependency/runtime artifacts.

## What is included

- local CodeIgniter authentication, authorization, evidence storage, and MySQL migrations;
- student, personnel, HR, Dean, and OSAD workflows;
- award evaluation and personnel-evaluation implementation through the documented plans;
- regression suites and implementation evidence;
- repository cleanup that removes tracked dependency caches, obsolete Supabase development scripts, and runtime backup artifacts;
- PR repair commits for React Hooks lint compliance and checkout-safe K4 validation.

## Why the diff is large

The original 4,076-path diff is predominantly 2,273 documentation/evidence paths plus 1,074 deletions from a previously tracked development dependency tree—approximately 82% combined. The remaining paths are the accumulated implementation and MySQL migration baseline, recorded across coherent phase commits.

## Verification

- [x] clean `npm ci`
- [x] frontend lint (zero blocking errors)
- [x] deterministic frontend regression: 165 files / 2,093 tests
- [x] K4 clean-checkout suite: 50/50
- [x] production frontend build
- [x] Composer validation/install
- [x] backend PHPUnit: 113 tests / 941 assertions
- [x] CodeIgniter route-table load
- [x] canonical MySQL replay: 63 tables
- [x] focused workflow/security gates
- [ ] provision or formally separate the live WAMP/MySQL integration suite in CI
- [x] remove all high npm advisories with non-breaking lockfile updates
- [ ] separately disposition two moderate Vitest development advisories requiring a major upgrade
- [ ] obtain one independent write-access approval
- [ ] rerun all required GitHub checks on the final head

## Merge policy

Do not merge until every unchecked item above is closed. Do not bypass the approval requirement. Once green and approved, merge with a merge commit to preserve the reconciliation boundary and phase history.

Detailed evidence: `docs/implementation/PR_22_Reconciliation_and_Merge_Audit_Report.md`.
