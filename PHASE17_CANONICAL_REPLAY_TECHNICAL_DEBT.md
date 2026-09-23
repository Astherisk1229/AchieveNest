# Phase17Canonical Replay Technical Debt

## Status

Phase17Canonical zero-state replay is currently incomplete.

**Classification:** DEFERRED / TECHNICAL DEBT

## Latest known blocker

`2026-09-16-000004_BridgeCreateRankPlacementDomain.php`

Missing prerequisite: `faculty_rank_catalog`

## Decision

Unrelated ranking/evaluation canonical reconstruction defects are deferred from the Google Auth implementation track. The replay problem is not solved by this decision.

## Google Auth dependency boundary

- `profiles`
- `roles`
- `profile_roles`
- `local_auth_credentials`
- `local_auth_sessions`
- `audit_logs`
- `external_auth_identities`

## Rule

Future ranking, evaluation, faculty, award, or annual-review replay failures do not block Google Auth unless they directly prevent the authentication identity schema from functioning.
