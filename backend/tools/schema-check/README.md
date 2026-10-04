# Schema check (wiring remediation)

Static check that backend query-builder code only references tables and columns that exist in a
schema built **only from the repo's official migration chain**.

```
# 1. Replay the official chain (Phase17Canonical baseline + Phase2 namespace) into a disposable
#    MySQL database and export the schema. Needs php, backend/vendor, and a MySQL 8 server.
./replay_official.sh replay_schema.json

# 2. Check the code against it, tolerating the recorded baseline (exit 1 on any NEW gap)
python3 schema_check.py --schema replay_schema.json --app ../../app --baseline known-gaps.json --strict
```

When a fix removes a gap, delete it from `known-gaps.json`; `--strict` fails on stale entries.

## What the migration chain is
`php spark verify:phase17m-fresh-replay` runs the `Phase17Canonical` namespace (canonical MySQL
baseline SQL plus PHP migrations) and then `Phase2` (to 2026-10-03). The separate
`database/mysql-defense/migrations` package is a different, smaller chain and does not build the
tables the app needs.

## Drift found and closed
The 2026-09-26 runtime dump had objects that no migration created, and the app uses them
(`personnel_evaluation_roots`, `personnel_achievement_usage`, `personnel_qualifications`,
`personnel_evaluations.version_number` / `evaluation_root_id` / area scores / return fields,
`personnel_evaluation_items` scoring columns, `dean_assignments.ended_*`,
`student_award_evaluations.candidate_*`, and others), plus `notifications.idempotency_key`, which
existed nowhere. Migration `Phase2/.../2026-10-04-000028_ReconcileRuntimeSchemaDrift.php` adds them
idempotently. After it, a fresh replay has 169 tables and the check reports 12 findings.

## The 12 remaining findings (baseline)
- `personnel_qualification_reviews` (8 insert keys, `HRPersonnelController::recordQualification`):
  needs a product decision, wire it or remove it. Not a one-line fix.
- `personnel_accomplishment_evidence.evidence_id`, `personnel_accomplishments.primary_evidence_id`:
  `PersonnelEvidenceVersioningService::replaceWorkingEvidence`, which has no callers (dead).
- `personnel_accomplishments.duplicate_hash`, `user_profiles`: guarded by `fieldExists` /
  `tableExists`; false positives.

## Limits
Heuristic regex analysis. It does not see dynamic or raw SQL, multi-table joins, or builder chains
split across statements. The replay used MySQL 8.0; the project targets 8.4.7.
`replay_schema.json` is generated.
