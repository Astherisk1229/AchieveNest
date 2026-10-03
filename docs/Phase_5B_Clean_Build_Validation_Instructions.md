# AchieveNest — Phase 5B Clean-Build Validation Instructions

> **Purpose:** Execute deterministic clean-build validation and replay for the MySQL 8.4.7 defense migration package against `achievenest_local`.
>
> **Target branch:** `defense/wamp-local`
>
> **Local database:** `achievenest_local`
>
> **Database engine:** MySQL 8.4.7

---

## 1. Sequence of Execution

1. Preserve Phase 5A reviewed package in Git (`defense/wamp-local`).
2. Verify `achievenest_local` is empty.
3. Record runtime MySQL environment.
4. Execute first clean build `000001`–`000010`.
5. Run comprehensive schema, index, constraint, and permanent reference data validation.
6. Verify required exclusions (No Department, No Dept Secretary, No Graduate School, No Supabase internal structures, No evidence BLOBs).
7. Save first-build evidence in `docs/Phase_5B_First_Clean_Build_Result.md`.
8. Recreate `achievenest_local` from zero (`DROP DATABASE` / `CREATE DATABASE`).
9. Execute second clean replay `000001`–`000010`.
10. Rerun validation queries and confirm identical deterministic output.
11. Save final `docs/Phase_5B_Result.md`.
