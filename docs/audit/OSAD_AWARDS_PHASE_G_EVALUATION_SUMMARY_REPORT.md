# OSAD Awards & Scoring Criteria — Phase G Evaluation Summary Report

> **Executive Scope:** Authoritative Portfolio-Based Award Evaluation Summary assembly, student–Award–Cycle scoped reporting, exact scoring model version recording, complete evidence accountability & exclusion tracking, non-computable criteria separation, immutable snapshot persistence in `award_student_evaluation_summaries`, and verification evidence for **Phase G: Portfolio-Based Award Evaluation Summary**.

---

## 1. Executive Summary

Phase G implements the authoritative, explainable, and reproducible **Portfolio-Based Award Evaluation Summary** for AchieveNest:
1. **Authoritative Summary Assembly**: Implemented `AwardEvaluationSummaryService.php` to assemble comprehensive evaluation summaries scoped to one student + Award + Award Cycle.
2. **Context & Metadata Integrity**: Every summary records the exact student context, award master, award cycle, published scoring model version (e.g. `1.0`), candidate pathway (`automatic_portfolio` or `dean_nomination`), and authority status (`OFFICIAL` / `SYSTEM_OPERATIONALIZATION`).
3. **Exact Evidence Traceability**: All positive points awarded in the criteria breakdown map explicitly to canonical verified evidence records with rule codes and point contributions.
4. **Transparent Exclusion Tracking**: Excluded or capped evidence records clearly display their exclusion reasons (`LOWER_THAN_HIGHEST_SELECTED`, `CAP_REACHED`, `DUPLICATE_WITHIN_SUBSECTION`, `NOT_VERIFIED`).
5. **Non-Computable Criteria Isolation**: Rubric criteria requiring human panel, interview, or moral character review are displayed under *"Not Automatically Evaluated (Panel / Institutional Requirement)"*, awarding 0 automatic points without reducing the maximum computable portfolio denominator.
6. **Dean Nomination Presentation**: Dean-nominated candidates retain their explicit intake pathway without synthetic point injection.
7. **Immutable Snapshot Persistence**: Summaries are persisted in `award_student_evaluation_summaries` ensuring historical evaluation results remain reproducible.
8. **Full Replay Parity**: All 17 MySQL defense migrations replayed cleanly from zero (`17/17 PASS`), `verify:awards-phase-g` passed (`8/8 PASS`), and master backend regressions passed (`8/8 suites PASS`).

---

## 2. Authoritative Repository Freeze State (G1)

```text
Branch:                  audit/project-architecture-linkage
HEAD SHA:                ea987bf32c208cc99ebe1a60b989c0c09ca83e98
Latest Commit:           ea987bf docs(audit): close osad refinement regression and replay
Remote Origin:          https://github.com/Astherisk1229/AchieveNest.git (fetch & push)
Working Tree:            Clean baseline with Phase G evaluation summary service, tests & snapshots
```

---

## 3. Pre-Migration WAMP Backup & Disposable Clone (G2–G3)

```text
Backup Path:             backend/database/mysql-defense/achievenest_local_pre_osad_awards_phase_g_backup.sql
Backup Engine:           mysqldump (MySQL 8.4.7)
Backup Status:           Verified, non-empty, successfully restored to disposable clone
Disposable Clone DB:     achievenest_awards_phase_g_test
Validation:              All tables and records restored and verified
```

---

## 4. Physical Schema Changes (G17)

### `award_student_evaluation_summaries` Table (NEW)
```sql
CREATE TABLE IF NOT EXISTS `award_student_evaluation_summaries` (
    `id` CHAR(36) NOT NULL,
    `evaluation_id` CHAR(36) NOT NULL,
    `student_profile_id` CHAR(36) NOT NULL,
    `award_definition_id` CHAR(36) NOT NULL,
    `cycle_id` CHAR(36) NOT NULL,
    `scoring_model_version_id` CHAR(36) NULL,
    `summary_payload` JSON NOT NULL,
    `raw_score` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `max_computable_score` DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    `potential_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `candidate_threshold_percent` DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    `qualifies_portfolio_based` TINYINT(1) NOT NULL DEFAULT 0,
    `candidate_pathway` VARCHAR(50) NOT NULL DEFAULT 'automatic_portfolio',
    `generated_by` CHAR(36) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_ases_eval` (`evaluation_id`),
    KEY `idx_ases_student` (`student_profile_id`),
    KEY `idx_ases_award` (`award_definition_id`),
    KEY `idx_ases_cycle` (`cycle_id`),
    KEY `idx_ases_version` (`scoring_model_version_id`),
    CONSTRAINT `fk_ases_eval` FOREIGN KEY (`evaluation_id`) REFERENCES `student_award_evaluations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ases_student` FOREIGN KEY (`student_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ases_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ases_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. Evaluation Summary Service Implementation (`AwardEvaluationSummaryService.php`)

Implemented at [AwardEvaluationSummaryService.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/AwardEvaluationSummaryService.php):
- `buildEvaluationSummary(string $cycleId, string $awardId, string $studentProfileId, ?string $evaluatorProfileId)`:
  - Consolidates student identity, award master, active cycle, and published version.
  - Builds criteria breakdown with awarded points, max points, rule applied, and evidence items.
  - Isolates non-computable criteria under *"Not Automatically Evaluated (Panel / Institutional Requirement)"*.
  - Compiles totals: `portfolio_raw_score`, `max_computable_score`, `portfolio_potential_score`, `candidate_threshold_percent` (80.00%), and `threshold_result`.
  - Persists the summary snapshot in `award_student_evaluation_summaries`.

---

## 6. Phase G Verification Results (`spark verify:awards-phase-g`)

```text
========================================================================
AchieveNest — Phase G Portfolio-Based Award Evaluation Summary
========================================================================
  SUMM-001     award_student_evaluation_summaries table exists and accessible [PASS]
  SUMM-002     Summary builds normalized payload with student, award, cycle, version [PASS]
  PARITY-001   Summary scores match authoritative AwardEvaluationService numbers [PASS]
  EVID-001     All positive awarded points trace to verified evidence records [PASS]
  NONCOMP-001  Non-computable criteria isolated with correct panel notice [PASS]
  DEAN-001     Candidate pathway correctly reflected in evaluation summary [PASS]
  REPRO-001    Evaluation summary persisted as immutable database snapshot [PASS]
  INV-001      0 orphaned summary records without corresponding evaluation [PASS]
========================================================================
Phase G Verification Summary: 8 Passed, 0 Failed
========================================================================
```

---

## 7. Full Replay & Multi-Suite Regression Evidence

- **MySQL Defense Replay**: Applied all 17 migrations from zero (`000001` $\rightarrow$ `000017`) into `achievenest_awards_phase_g_mysql_replay` with **100% exit code 0** (15 awards, 40 criteria, 15 versions, 56 mapping rules, 40 scoring rules, student evaluation summaries table).
- **Phase C Suite**: `spark verify:awards-phase-c` $\rightarrow$ **`13 / 13 PASSED`**.
- **Phase D Suite**: `spark verify:awards-phase-d` $\rightarrow$ **`9 / 9 PASSED`**.
- **Phase E Suite**: `spark verify:awards-phase-e` $\rightarrow$ **`8 / 8 PASSED`**.
- **Phase F Suite**: `spark verify:awards-phase-f` $\rightarrow$ **`9 / 9 PASSED`**.
- **Phase G Suite**: `spark verify:awards-phase-g` $\rightarrow$ **`8 / 8 PASSED`**.
- **Phase G Academic Structure Closure**: `spark verify:phase-g-closure` $\rightarrow$ **`24 / 24 PASSED`**.
- **Master Backend Regression**: `spark test:phase15-backend` $\rightarrow$ **`8 / 8 Suites PASSED`** (`46/46 Phase 14A`, `30/30 Phase 14B`).
- **Frontend Vitest Suite**: `npm test -- --run` $\rightarrow$ **`38 / 38 Test Files, 236 / 236 Tests PASSED`**.
- **Frontend Quality**: `0 lint errors`, production build completed in `3.62s`.

---

## 8. Final Phase G Gate Status

```text
PHASE G: PASS — EVALUATION SUMMARY AUDITABLE AND REPRODUCIBLE
```
