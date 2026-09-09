# OSAD Awards & Scoring Criteria — Phase C Award Configuration Schema Report

> **Executive Scope:** Additive schema evolution, versioning infrastructure, criterion component hierarchy, rule-authority provenance, lifecycle immutability, deterministic backfills, and verification evidence for **Phase C: Award Catalog, Award Cycle & Criteria Version Model**.

---

## 1. Executive Summary

Phase C translates the frozen Phase B governance contract into an additive, fully backward-compatible database schema for AchieveNest.
1. **Preserved Masters & Cycles**: Preserves all 15 active `award_definitions`, all 40 `award_criteria`, and active `award_cycles` without data loss or breaking changes.
2. **Scoring Model Versioning**: Implements `award_scoring_model_versions` to support immutable published scoring models (v1.0), version numbers, cycle linkages, and candidate threshold ownership.
3. **Rule Authority & Provenance**: Adds explicit `authority_status` (`OFFICIAL` vs `SYSTEM_OPERATIONALIZATION`) across award definitions and criteria, with 13 official awards and 2 operationalized models (`LOYALTY_AWARD`, `RESEARCH_AND_INNOVATION`).
4. **Criterion Component Hierarchy**: Implements `award_criterion_components` for subcomponent scoring breakdowns and computable flags.
5. **Deterministic Migration & Parity**: Created CodeIgniter migration `2026-08-30-000030_AddAwardConfigurationAndAuthorityMetadata.php` and MySQL Defense migration `000014_award_configuration_and_authority_metadata.sql`. Verified 100% parity via fresh replay from zero (`14/14 migrations PASS`).
6. **Zero Scoring Disruption**: Verified that `AwardEvaluationService.php` continues evaluating students compatibly without regression.

---

## 2. Authoritative Repository Freeze State (C1)

```text
Branch:                  audit/project-architecture-linkage
HEAD SHA:                ea987bf32c208cc99ebe1a60b989c0c09ca83e98
Latest Commit:           ea987bf docs(audit): close osad refinement regression and replay
Remote Origin:          https://github.com/Astherisk1229/AchieveNest.git (fetch & push)
Working Tree:            Clean baseline with Phase C migrations & test suite
```

---

## 3. Pre-Migration WAMP Backup & Disposable Clone (C2–C3)

```text
Backup Path:             backend/database/mysql-defense/achievenest_local_pre_osad_awards_phase_c_backup.sql
Backup Engine:           mysqldump (MySQL 8.4.7)
Backup Status:           Verified, non-empty, successfully restored to disposable clone
Disposable Clone DB:     achievenest_awards_phase_c_test
Validation:              All 57 tables, 15 awards, 40 criteria restored and verified
```

---

## 4. Current $\rightarrow$ Target Schema Mapping Matrix (C5)

| Current Table / Column | Target Structural Concept | Action | Rationale |
|---|---|---|---|
| `award_definitions` | Permanent Award Master | **EXTEND** | Added `authority_status` and `active_scoring_version` |
| `award_criteria` | Versioned Award Criterion | **EXTEND** | Added `scoring_model_version_id`, `authority_status`, `source_rubric_reference`, `is_published` |
| `award_cycles` | Award Evaluation Cycle | **PRESERVE** | Retained active AY 2025-2026 cycle |
| `award_scoring_model_versions` | Versioned Scoring Model Entity | **NEW TABLE** | Stores immutable published criteria versions, candidate thresholds, and eligibility |
| `award_criterion_components` | Criterion Subcomponent Hierarchy | **NEW TABLE** | Enables granular component points under criteria |

---

## 5. Physical Schema Changes

### 5.1 `award_definitions` Modifications
- `authority_status`: `VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL'`
- `active_scoring_version`: `VARCHAR(20) NOT NULL DEFAULT '1.0'`

### 5.2 `award_criteria` Modifications
- `scoring_model_version_id`: `CHAR(36) NULL` (FK $\rightarrow$ `award_scoring_model_versions.id`)
- `authority_status`: `VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL'`
- `source_rubric_reference`: `VARCHAR(255) NULL`
- `is_published`: `TINYINT(1) NOT NULL DEFAULT 1`

### 5.3 `award_scoring_model_versions` Table (NEW)
```sql
CREATE TABLE IF NOT EXISTS `award_scoring_model_versions` (
    `id` CHAR(36) NOT NULL,
    `award_definition_id` CHAR(36) NOT NULL,
    `award_cycle_id` CHAR(36) NULL,
    `version_number` VARCHAR(20) NOT NULL DEFAULT '1.0',
    `version_label` VARCHAR(100) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'published',
    `candidate_threshold_percent` DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    `graduating_only` TINYINT(1) NOT NULL DEFAULT 1,
    `gender_requirement` VARCHAR(20) NULL,
    `authority_status` VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL',
    `published_at` DATETIME(6) NULL,
    `published_by` CHAR(36) NULL,
    `retired_at` DATETIME(6) NULL,
    `retired_by` CHAR(36) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    KEY `idx_asmv_award` (`award_definition_id`),
    KEY `idx_asmv_cycle` (`award_cycle_id`),
    KEY `idx_asmv_status` (`status`),
    CONSTRAINT `fk_asmv_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_asmv_cycle` FOREIGN KEY (`award_cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.4 `award_criterion_components` Table (NEW)
```sql
CREATE TABLE IF NOT EXISTS `award_criterion_components` (
    `id` CHAR(36) NOT NULL,
    `criterion_id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `max_points` DECIMAL(10,2) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 1,
    `is_computable` TINYINT(1) NOT NULL DEFAULT 1,
    `authority_status` VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    KEY `idx_acc_criterion` (`criterion_id`),
    CONSTRAINT `fk_acc_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `award_criteria` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 6. Deterministic Backfill Validation

1. **Award Definitions Authority**:
   - `LOYALTY_AWARD`, `RESEARCH_AND_INNOVATION` $\rightarrow$ `SYSTEM_OPERATIONALIZATION` (2 rows).
   - Remaining 13 awards $\rightarrow$ `OFFICIAL` (13 rows).
2. **Criteria Authority**:
   - `CRIT_LOYAL_*` (3) and `CRIT_RES_*` (3) $\rightarrow$ `SYSTEM_OPERATIONALIZATION` (6 rows).
   - Remaining criteria $\rightarrow$ `OFFICIAL` (34 rows).
3. **Scoring Model Versions**:
   - Seeded 15 published v1.0 scoring model versions linked to active cycle `d0000000-0000-0000-0008-000000000001` (`candidate_threshold_percent = 80.00`, `graduating_only = 1`).
4. **Criteria Version Linkage**:
   - All 40 criteria in `award_criteria` mapped to their active `scoring_model_version_id` (0 unlinked criteria).

---

## 7. Phase C Verification Results (`spark verify:awards-phase-c`)

```text
========================================================================
AchieveNest — Phase C Award Catalog, Cycle & Version Verification
========================================================================
  CHK-001      15 Active Award Masters preserved                     [PASS]
  CHK-002      40 Award Criteria preserved                           [PASS]
  CHK-003      Active Award Cycle preserved                          [PASS]
  VER-001      15 Published Scoring Model Versions exist (v1.0)      [PASS]
  VER-002      All 40 criteria linked to active version              [PASS]
  AUTH-001     Award definitions authority status mapped correctly (13 Official, 2 SysOp) [PASS]
  AUTH-002     Criteria authority status mapped correctly (34 Official, 6 SysOp) [PASS]
  THR-001      Candidate threshold preserved at 80.00% across all versions [PASS]
  GRAD-001     graduating_only = 1 preserved across all active versions [PASS]
  COMP-001     award_criterion_components table exists and is accessible [PASS]
  SRV-001      AwardEvaluationService executes evaluation compatibly [PASS]
  INV-001      0 orphaned scoring model versions                     [PASS]
  INV-002      0 orphaned criteria without active scoring model version [PASS]
========================================================================
Phase C Verification Summary: 13 Passed, 0 Failed
========================================================================
```

---

## 8. Fresh Replay Parity & Full Regression Evidence

- **MySQL Defense Replay**: Applied all 14 migrations from zero (`000001` $\rightarrow$ `000014`) into `achievenest_awards_phase_c_mysql_replay` with **100% exit code 0**.
- **Phase G Academic Structure Closure Suite**: `24 / 24 PASSED`.
- **Master Backend Regression Suite**: `8 / 8 Suites PASSED` (`Phase 15 PASSED`).
- **Frontend Vitest Suite**: `38 / 38 Test Files, 236 / 236 Tests PASSED`.
- **Frontend Quality**: `0 lint errors`, production build completed in `3.02s`.

---

## 9. Rollback Plan

Should rollback be required:
1. Re-run migration `down()` or apply drop script to remove `award_criterion_components` and `award_scoring_model_versions`, and drop added columns.
2. Alternatively, restore from verified snapshot `achievenest_local_pre_osad_awards_phase_c_backup.sql`.

---

## 10. Final Phase C Gate Status

```text
PHASE C: PASS — VERSIONED AWARD CONFIGURATION READY
```
