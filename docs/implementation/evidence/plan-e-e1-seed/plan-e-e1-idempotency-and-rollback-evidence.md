# Plan E Phase E1 — Idempotency, Integrity & Rollback Evidence

## 1. Migration Execution Summary

- **Migration**: `2026-09-08-000064_CreateFacultyRankCatalog.php`
- **Table Created**: `faculty_rank_catalog`
- **Initial Execution Output**:
  ```text
  Active Full-time ranks seeded: 26
  ```
- **Idempotent Repeat Execution Output**:
  ```text
  Idempotent repeat run active count: 26
  ```
  *(Zero duplicate records created; zero unwanted mutations)*.

---

## 2. Integrity & Mismatch Detection Verification

The migration enforces transactional verification when a record with the same `(catalog_type, rank_code)` already exists:
- If attributes (`display_label`, `qualification_tier_code`, `qualification_source_label`, `display_order`) match the frozen E0 specification, the row is preserved untouched.
- If an intentional pre-existing mismatch is encountered, the migration throws `RuntimeException`:
  ```text
  Integrity error: Pre-existing faculty rank mismatch for rank_code [X]. Expected 'Y', found 'Z'.
  ```

---

## 3. Rollback Behavior

- `down()` method strictly deletes rows where `catalog_type = 'full_time_academic_rank'` AND `seed_version = '2026.1'`, ensuring surgical removal of this seed version only without cascading data loss.

---

## 4. Zero-Mutation Verification on Other Subsystems

| Subsystem / Table | Target of Plan E1 | Mutation Result |
| --- | --- | --- |
| `personnel_profiles` | `current_rank_title`, `position_title` | **0 rows modified** |
| `personnel_evaluation_roots` | Plan C evaluation roots | **0 rows created / modified** |
| `personnel_evaluations` | Plan C submission versions | **0 rows created / modified** |
| `personnel_evaluation_items` | Plan C portfolio snapshots | **0 rows created / modified** |
| `personnel_annual_reviews` | Plan D Annual Review records | **0 rows created / modified** |
| `personnel_accomplishments` | Plan A source achievements | **0 rows created / modified** |
