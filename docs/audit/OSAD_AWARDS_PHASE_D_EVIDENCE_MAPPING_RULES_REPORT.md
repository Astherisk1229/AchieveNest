# OSAD Awards & Scoring Criteria — Phase D Evidence Mapping Rules Report

> **Executive Scope:** Additive schema implementation, explicit evidence-to-criterion mapping rules, hard verification gate, single-criterion deduplication, cross-award evidence reuse, and regression evidence for **Phase D: Evidence Mapping & Duplicate-Safe Rule Matching**.

---

## 1. Executive Summary

Phase D bridges verified student portfolio records and versioned Award Criterion / Criterion Component structures:
1. **Explicit Mapping Engine**: Implemented `award_evidence_mapping_rules` and `award_evidence_mapping_conditions` to decouple portfolio categories from hardcoded controller logic into versioned, auditable mapping rules.
2. **Deterministic Backfills**: Backfilled 56 active evidence mapping rules across all 40 criteria in the published v1.0 scoring model versions.
3. **Hard Verification Gate**: Enforces server-side evaluation where only records with `status = 'verified'` can qualify for scoring. Unverified, draft, or pending records are rejected.
4. **Single-Criterion Deduplication**: Prevents duplicate counting of the same canonical evidence ID (`portfolio_record_id`) within the same criterion subsection, even if multiple rules match.
5. **Cross-Award Evidence Reuse**: Transparently allows a verified portfolio record to contribute to multiple awards if eligible under their respective versioned criteria.
6. **Zero Scoring Disruption**: Verified that `AwardEvaluationService.php` continues producing valid evaluations compatibly.
7. **Complete Fresh Replay**: All 15 MySQL defense migrations replayed cleanly from zero (`15/15 PASS`) with 100% schema parity.

---

## 2. Authoritative Repository Freeze State (D1)

```text
Branch:                  audit/project-architecture-linkage
HEAD SHA:                ea987bf32c208cc99ebe1a60b989c0c09ca83e98
Latest Commit:           ea987bf docs(audit): close osad refinement regression and replay
Remote Origin:          https://github.com/Astherisk1229/AchieveNest.git (fetch & push)
Working Tree:            Clean baseline with Phase D migrations & test suite
```

---

## 3. Pre-Migration WAMP Backup & Disposable Clone (D2–D3)

```text
Backup Path:             backend/database/mysql-defense/achievenest_local_pre_osad_awards_phase_d_backup.sql
Backup Engine:           mysqldump (MySQL 8.4.7)
Backup Status:           Verified, non-empty, successfully restored to disposable clone
Disposable Clone DB:     achievenest_awards_phase_d_test
Validation:              All tables and records restored and verified
```

---

## 4. Canonical Evidence Identity & Verification Gate (D7, D11)

- **Canonical Evidence Identity**: `student_portfolio_records.id` (`portfolio_record_id`).
- **Uniqueness Contract Key**:
  $$\text{Key} = \langle \text{scoring\_model\_version\_id}, \text{criterion\_id}, \text{portfolio\_record\_id} \rangle$$
- **Verification Gate Invariant**:
  $$\text{Record Eligible for Mapping} \iff \text{student\_portfolio\_records.status} = \text{'verified'}$$

---

## 5. Physical Schema Changes (D15)

### 5.1 `award_evidence_mapping_rules` Table (NEW)
```sql
CREATE TABLE IF NOT EXISTS `award_evidence_mapping_rules` (
    `id` CHAR(36) NOT NULL,
    `scoring_model_version_id` CHAR(36) NOT NULL,
    `criterion_id` CHAR(36) NOT NULL,
    `criterion_component_id` CHAR(36) NULL,
    `rule_code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `portfolio_category_id` CHAR(36) NOT NULL,
    `portfolio_subcategory_id` CHAR(36) NULL,
    `authority_status` VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL',
    `priority` INT NOT NULL DEFAULT 1,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    KEY `idx_aemr_version` (`scoring_model_version_id`),
    KEY `idx_aemr_criterion` (`criterion_id`),
    KEY `idx_aemr_component` (`criterion_component_id`),
    KEY `idx_aemr_category` (`portfolio_category_id`),
    KEY `idx_aemr_subcategory` (`portfolio_subcategory_id`),
    KEY `idx_aemr_active` (`is_active`),
    CONSTRAINT `fk_aemr_version` FOREIGN KEY (`scoring_model_version_id`) REFERENCES `award_scoring_model_versions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_aemr_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `award_criteria` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_aemr_component` FOREIGN KEY (`criterion_component_id`) REFERENCES `award_criterion_components` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_aemr_category` FOREIGN KEY (`portfolio_category_id`) REFERENCES `portfolio_categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.2 `award_evidence_mapping_conditions` Table (NEW)
```sql
CREATE TABLE IF NOT EXISTS `award_evidence_mapping_conditions` (
    `id` CHAR(36) NOT NULL,
    `mapping_rule_id` CHAR(36) NOT NULL,
    `field_key` VARCHAR(100) NOT NULL,
    `operator` VARCHAR(20) NOT NULL DEFAULT 'EQ',
    `comparison_value` TEXT NULL,
    `group_number` INT NOT NULL DEFAULT 1,
    `display_order` INT NOT NULL DEFAULT 1,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    KEY `idx_aemc_rule` (`mapping_rule_id`),
    KEY `idx_aemc_field` (`field_key`),
    CONSTRAINT `fk_aemc_rule` FOREIGN KEY (`mapping_rule_id`) REFERENCES `award_evidence_mapping_rules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 6. Deterministic Mapping Backfills (D16)

56 active mapping rules backfilled across the 9 portfolio categories:
- **Journalism**: 2 rules mapping to `CAMPUS_JOURNALISM`.
- **Sports**: 6 rules mapping to `SPORTS`.
- **Socio-Cultural**: 3 rules mapping to `SOCIO_CULTURAL_PERFORMING_ARTS`.
- **Church Ministry**: 4 rules mapping to `CHURCH_MINISTRY_INVOLVEMENT`.
- **Community Service**: 7 rules mapping to `COMMUNITY_SERVICE_VOLUNTEERISM`.
- **Organization Membership**: 6 rules mapping to `ORG_MEMBERSHIP_PARTICIPATION`.
- **Seminar / Training**: 4 rules mapping to `SEMINAR_TRAINING`.
- **Citation & Recognition**: 15 rules mapping to `CITATION_RECOGNITION`.
- **Leadership**: 9 rules mapping to `LEADERSHIP_POSITION`.

---

## 7. Evidence Mapping Service (`EvidenceMappingService.php`)

Implemented at [EvidenceMappingService.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/EvidenceMappingService.php):
- `findQualifyingEvidenceForCriterion(...)`:
  - Evaluates active mapping rules for criterion under scoring model version.
  - Rejects any record with `status != 'verified'`.
  - Filters out duplicates of the same `portfolio_record_id` within the criterion.
  - Evaluates structured metadata conditions (`EQ`, `IS_NOT_NULL`, `IS_NULL`).
  - Returns qualifying match set with rule provenance and basis snapshots.

---

## 8. Phase D Verification Results (`spark verify:awards-phase-d`)

```text
========================================================================
AchieveNest — Phase D Evidence Mapping & Duplicate-Safe Rule Matching
========================================================================
  MAP-001      Evidence mapping rules table populated (56 active rules) [PASS]
  MAP-002      Evidence mapping conditions table exists and accessible [PASS]
  GATE-001     Hard verification gate excludes unverified/draft records [PASS]
  GATE-002     Verified record qualifies through matching rule       [PASS]
  DEDUP-001    Single-criterion duplicate protection prevents double count [PASS]
  CROSS-001    Cross-award evidence reuse permitted across awards    [PASS]
  META-001     Sports evidence matches mapped sports criterion       [PASS]
  SRV-001      AwardEvaluationService executes evaluation compatibly [PASS]
  INV-001      0 orphaned mapping rules without active scoring model version [PASS]
========================================================================
Phase D Verification Summary: 9 Passed, 0 Failed
========================================================================
```

---

## 9. Replay Parity & Full Regression Evidence

- **MySQL Defense Replay**: Applied all 15 migrations from zero (`000001` $\rightarrow$ `000015`) into `achievenest_awards_phase_d_mysql_replay` with **100% exit code 0** (15 awards, 40 criteria, 15 versions, 56 rules).
- **Phase C Suite**: `spark verify:awards-phase-c` $\rightarrow$ **`13 / 13 PASSED`**.
- **Phase D Suite**: `spark verify:awards-phase-d` $\rightarrow$ **`9 / 9 PASSED`**.
- **Phase G Academic Structure Closure**: `spark verify:phase-g-closure` $\rightarrow$ **`24 / 24 PASSED`**.
- **Master Backend Regression**: `spark test:phase15-backend` $\rightarrow$ **`8 / 8 Suites PASSED`**.
- **Frontend Vitest Suite**: `npm test -- --run` $\rightarrow$ **`38 / 38 Test Files, 236 / 236 Tests PASSED`**.
- **Frontend Quality**: `0 lint errors`, production build completed in `2.25s`.

---

## 10. Final Phase D Gate Status

```text
PHASE D: PASS — EVIDENCE MAPPING VERIFIED
```
