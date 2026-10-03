# OSAD Awards & Scoring Criteria — Phase I Authorization, Audit & Manual Decision Controls Report

> **Executive Scope:** Backend-authoritative authorization matrix for Awards & Scoring Criteria, immutable published scoring model version protection (v1.0), historical evaluation summary protection, attributable manual candidate decisions (`award_candidate_manual_decisions`), comprehensive audit trail integration in `audit_logs`, zero synthetic score injection invariants, and verification evidence for **Phase I: Authorization, Audit History & Manual Decision Controls**.

---

## 1. Executive Summary

Phase I establishes robust governance, backend authorization, immutable snapshot security, and audit history across the Awards & Scoring Criteria subsystem:
1. **Authoritative Backend Access Control**: Enforced strict backend authorization across Award Catalog mutations, candidate evaluations, Dean nominations, and candidate review state transitions.
2. **Published Scoring Model Immutability**: All 15 published scoring models (v1.0) and their underlying rules are strictly protected against in-place mutation, requiring new version drafting.
3. **Attributable Manual Decision Controls**: Implemented `award_candidate_manual_decisions` table requiring an explicit decision type (`advance_for_interview`, `include_in_review`, `exclude_from_review`), mandatory justification reason, actor profile ID, and timestamp.
4. **Zero Synthetic Score Injection**: Manual candidate decisions and Dean direct nominations manipulate review states without fabricating synthetic portfolio points (`potential_score` is never boosted or forged).
5. **Comprehensive Audit Trail**: Integrated audit logging via `audit_logs` capturing actor, action event code, target entity, Award/Cycle context, and timestamp.
6. **Full Defense Replay & Regressions**: Replayed all 18 MySQL defense migrations from zero (`18/18 PASS`), `spark verify:awards-phase-i` passed (`7/7 PASS`), all previous phases passed (`C, D, E, F, G, G closure`), and frontend Vitest suite passed (`39/39 files, 239/239 tests`).

---

## 2. Authoritative Repository Freeze State (I1)

```text
Branch:                  audit/project-architecture-linkage
HEAD SHA:                ea987bf32c208cc99ebe1a60b989c0c09ca83e98
Latest Commit:           ea987bf docs(audit): close osad refinement regression and replay
Remote Origin:          https://github.com/Astherisk1229/AchieveNest.git (fetch & push)
Working Tree:            Clean baseline with Phase I manual decision schema, commands & audit hooks
```

---

## 3. Pre-Migration WAMP Backup & Disposable Clone (I2–I3)

```text
Backup Path:             backend/database/mysql-defense/achievenest_local_pre_osad_awards_phase_i_backup.sql
Backup Engine:           mysqldump (MySQL 8.4.7)
Backup Status:           Verified, non-empty, successfully restored to disposable clone
Disposable Clone DB:     achievenest_awards_phase_i_test
Validation:              All tables and records restored and verified
```

---

## 4. Physical Schema Changes (I15)

### `award_candidate_manual_decisions` Table (NEW)
```sql
CREATE TABLE IF NOT EXISTS `award_candidate_manual_decisions` (
    `id` CHAR(36) NOT NULL,
    `cycle_id` CHAR(36) NOT NULL,
    `award_definition_id` CHAR(36) NOT NULL,
    `student_profile_id` CHAR(36) NOT NULL,
    `decision_type` VARCHAR(50) NOT NULL,
    `reason` TEXT NOT NULL,
    `decided_by` CHAR(36) NOT NULL,
    `previous_status` VARCHAR(50) NULL,
    `new_status` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    KEY `idx_acmd_cycle` (`cycle_id`),
    KEY `idx_acmd_award` (`award_definition_id`),
    KEY `idx_acmd_student` (`student_profile_id`),
    KEY `idx_acmd_decided_by` (`decided_by`),
    CONSTRAINT `fk_acmd_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_acmd_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_acmd_student` FOREIGN KEY (`student_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_acmd_decided_by` FOREIGN KEY (`decided_by`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. Phase I Action-Permission Matrix (I9)

| Action / Capability | OSAD Administrator | College Dean | Program Coordinator | Organization Moderator | HR Administrator | Student |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View Award Catalog & Details | **ALLOW** | ALLOW | ALLOW | ALLOW | ALLOW | DENIED |
| Create Draft Scoring Model | **ALLOW** | DENIED | DENIED | DENIED | DENIED | DENIED |
| Publish / Retire Model Version | **ALLOW** | DENIED | DENIED | DENIED | DENIED | DENIED |
| View Potential Candidates Queue | **ALLOW** | SCOPED (College) | DENIED | DENIED | DENIED | DENIED |
| Submit Dean Direct Nomination | DENIED | **ALLOW (College)** | DENIED | DENIED | DENIED | DENIED |
| Record Candidate Review Decision | **ALLOW** | DENIED | DENIED | DENIED | DENIED | DENIED |
| View Portfolio Evaluation Summary | **ALLOW** | SCOPED (College) | DENIED | DENIED | DENIED | OWN ONLY |
| Manually Edit Portfolio Points | **PROHIBITED** | **PROHIBITED** | **PROHIBITED** | **PROHIBITED** | **PROHIBITED** | **PROHIBITED** |

---

## 6. Phase I Verification Results (`spark verify:awards-phase-i`)

```text
========================================================================
AchieveNest — Phase I Authorization, Audit & Manual Decision Controls
========================================================================
  AUTH-001     award_candidate_manual_decisions table exists and accessible [PASS]
  AUTH-002     OSAD Admin records attributable manual candidate decision [PASS]
  DECIS-001    Manual candidate decision causes zero synthetic score injection [PASS]
  IMMUT-001    Published scoring model version is protected (v1.0 published) [PASS]
  HIST-001     Historical evaluation summary snapshot is persistent and read-only [PASS]
  AUDIT-001    Audit log records actor, event code, target, context, and timestamp [PASS]
  INV-001      0 orphaned manual candidate decision records          [PASS]
========================================================================
Phase I Verification Summary: 7 Passed, 0 Failed
========================================================================
```

---

## 7. Full Replay & Multi-Suite Regression Evidence

- **MySQL Defense Replay**: Applied all 18 migrations from zero (`000001` $\rightarrow$ `000018`) into `achievenest_awards_phase_i_mysql_replay` with **100% exit code 0** (15 awards, 40 criteria, 15 versions, 56 mapping rules, 40 scoring rules, student evaluation summaries, candidate manual decisions).
- **Phase C Suite**: `spark verify:awards-phase-c` $\rightarrow$ **`13 / 13 PASSED`**.
- **Phase D Suite**: `spark verify:awards-phase-d` $\rightarrow$ **`9 / 9 PASSED`**.
- **Phase E Suite**: `spark verify:awards-phase-e` $\rightarrow$ **`8 / 8 PASSED`**.
- **Phase F Suite**: `spark verify:awards-phase-f` $\rightarrow$ **`9 / 9 PASSED`**.
- **Phase G Suite**: `spark verify:awards-phase-g` $\rightarrow$ **`8 / 8 PASSED`**.
- **Phase I Suite**: `spark verify:awards-phase-i` $\rightarrow$ **`7 / 7 PASSED`**.
- **Phase G Academic Structure Closure**: `spark verify:phase-g-closure` $\rightarrow$ **`24 / 24 PASSED`**.
- **Master Backend Regression**: `spark test:phase15-backend` $\rightarrow$ **`8 / 8 Suites PASSED`** (`46/46 Phase 14A`, `30/30 Phase 14B`).
- **Frontend Vitest Suite**: `npm test -- --run` $\rightarrow$ **`39 / 39 Test Files, 239 / 239 Tests PASSED`**.
- **Frontend Quality**: `0 lint errors`, production build completed in `5.73s`.

---

## 8. Final Phase I Gate Status

```text
PHASE I: PASS — GOVERNANCE, AUTHORIZATION AND AUDIT PROVEN
```
