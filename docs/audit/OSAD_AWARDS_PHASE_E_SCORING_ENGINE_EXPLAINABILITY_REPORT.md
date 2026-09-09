# OSAD Awards & Scoring Criteria — Phase E Scoring Engine & Explainability Report

> **Executive Scope:** Configurable scoring-rule engine, controlled rule families (`sum_capped`, `highest_only`, `fixed_presence`, `matrix_mapping`), point capping, non-computable criteria handling, explainability payload generation, deterministic backfills, and verification evidence for **Phase E: Configurable Scoring Engine & Explainability**.

---

## 1. Executive Summary

Phase E implements the deterministic scoring engine and explainability layer for AchieveNest's Awards & Scoring Criteria subsystem:
1. **Configurable Rule Engine**: Implemented `AwardScoringRuleEngine.php` to calculate points across controlled rule families without hardcoded branching in controllers.
2. **Deterministic Backfills**: Backfilled 40 active scoring rules across all 40 criteria in the published v1.0 scoring models with check-constraint compliant types (`sum_capped`, `matrix_mapping`, `highest_only`, `fixed_presence`).
3. **Controlled Rule Families**:
   - `sum_capped`: Accumulates points per verified record up to `max_points` with cap adjustment.
   - `highest_only`: Identifies and selects the single highest point contribution among qualifying evidence, cleanly isolating lower records.
   - `fixed_presence`: Awards fixed points upon verified evidence presence.
   - `matrix_mapping`: Maps structured competition/journalism evidence types to point allocations.
4. **Transparent Explainability**: Every criterion evaluation generates an explainability payload containing `rule_code`, `authority_status`, `pre_cap_points`, `cap_adjustment`, `selected_evidence`, and `excluded_evidence` with explicit exclusion reasons.
5. **Non-Computable Criteria Decoupling**: Official rubric criteria requiring panel, interview, or scholastic review are marked *"Not Automatically Evaluated (Panel / Institutional Requirement)"*, awarding 0 automatic points without corrupting the computable score denominator.
6. **Full Regression Parity**: Verified that all 16 MySQL defense migrations replay cleanly from zero (`16/16 PASS`), `verify:awards-phase-e` passes (`8/8 PASS`), and master backend tests pass (`8/8 suites PASS`).

---

## 2. Authoritative Repository Freeze State (E1)

```text
Branch:                  audit/project-architecture-linkage
HEAD SHA:                ea987bf32c208cc99ebe1a60b989c0c09ca83e98
Latest Commit:           ea987bf docs(audit): close osad refinement regression and replay
Remote Origin:          https://github.com/Astherisk1229/AchieveNest.git (fetch & push)
Working Tree:            Clean baseline with Phase E migrations, rule engine & verification suite
```

---

## 3. Pre-Migration WAMP Backup & Disposable Clone (E2–E3)

```text
Backup Path:             backend/database/mysql-defense/achievenest_local_pre_osad_awards_phase_e_backup.sql
Backup Engine:           mysqldump (MySQL 8.4.7)
Backup Status:           Verified, non-empty, successfully restored to disposable clone
Disposable Clone DB:     achievenest_awards_phase_e_test
Validation:              All tables and records restored and verified
```

---

## 4. Controlled Scoring Rule Families & Mathematical Contract (E6, E11, E12)

### 4.1 `sum_capped`
$$\text{Raw Points} = \sum_{i=1}^n \text{points}_i$$
$$\text{Awarded Points} = \min(\text{Raw Points}, \text{max\_points})$$
$$\text{Cap Adjustment} = \max(0, \text{Raw Points} - \text{max\_points})$$

### 4.2 `highest_only`
$$\text{Awarded Points} = \max_{i} (\text{points}_i)$$
$$\text{Selected Evidence} = \arg\max_i (\text{points}_i)$$
$$\text{Excluded Evidence} = \{e_j \mid \text{points}_j < \text{Awarded Points}\} \quad (\text{reason: } \text{LOWER\_THAN\_HIGHEST\_SELECTED})$$

### 4.3 `fixed_presence`
$$\text{Awarded Points} = \begin{cases} \text{fixed\_points}, & \text{if } |E_{\text{verified}}| > 0 \\ 0, & \text{otherwise} \end{cases}$$

---

## 5. Physical Schema Changes (E15)

### `award_scoring_rules` Table Extension
- `scoring_model_version_id`: `CHAR(36) NULL` (FK $\rightarrow$ `award_scoring_model_versions.id`)
- `criterion_component_id`: `CHAR(36) NULL` (FK $\rightarrow$ `award_criterion_components.id`)
- `authority_status`: `VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL'`
- `is_active`: `TINYINT(1) NOT NULL DEFAULT 1`
- `updated_at`: `DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`

---

## 6. Scoring Rule Engine Implementation (`AwardScoringRuleEngine.php`)

Implemented at [AwardScoringRuleEngine.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/AwardScoringRuleEngine.php):
- Evaluates points per criterion from matched evidence sets.
- Emits detailed explainability DTO:
  ```json
  {
    "criterion_id": "uuid",
    "criterion_code": "CRIT_LEADERSHIP",
    "is_computable": true,
    "status_label": "Portfolio Computable",
    "rule_type": "sum_capped",
    "rule_code": "CRIT_LEADERSHIP_RULE_SCORE",
    "authority_status": "OFFICIAL",
    "awarded_points": 35.00,
    "max_points": 35.00,
    "pre_cap_points": 45.00,
    "cap_adjustment": 10.00,
    "selected_evidence": [...],
    "excluded_evidence": [...]
  }
  ```

---

## 7. Phase E Verification Results (`spark verify:awards-phase-e`)

```text
========================================================================
AchieveNest — Phase E Configurable Scoring Engine & Explainability
========================================================================
  RULE-001     Scoring rules table populated (40 active rules for v1.0) [PASS]
  FAMILY-001   sum_capped rule accumulates points and caps correctly (35.00/35.00) [PASS]
  FAMILY-002   highest_only rule selects single highest evidence and excludes lower [PASS]
  FAMILY-003   fixed_presence rule awards fixed point upon presence  [PASS]
  EXPLAIN-001  Scoring engine produces comprehensive explainability payload [PASS]
  COMP-001     Non-computable criteria marked Not Automatically Evaluated [PASS]
  SRV-001      AwardEvaluationService executes evaluation compatibly [PASS]
  INV-001      0 orphaned scoring rules without active scoring model version [PASS]
========================================================================
Phase E Verification Summary: 8 Passed, 0 Failed
========================================================================
```

---

## 8. Full Replay & Multi-Suite Regression Evidence

- **MySQL Defense Replay**: Applied all 16 migrations from zero (`000001` $\rightarrow$ `000016`) into `achievenest_awards_phase_e_mysql_replay` with **100% exit code 0** (15 awards, 40 criteria, 15 versions, 56 mapping rules, 40 scoring rules).
- **Phase C Suite**: `spark verify:awards-phase-c` $\rightarrow$ **`13 / 13 PASSED`**.
- **Phase D Suite**: `spark verify:awards-phase-d` $\rightarrow$ **`9 / 9 PASSED`**.
- **Phase E Suite**: `spark verify:awards-phase-e` $\rightarrow$ **`8 / 8 PASSED`**.
- **Phase G Academic Structure Closure**: `spark verify:phase-g-closure` $\rightarrow$ **`24 / 24 PASSED`**.
- **Master Backend Regression**: `spark test:phase15-backend` $\rightarrow$ **`8 / 8 Suites PASSED`** (`46/46 Phase 14A`, `30/30 Phase 14B`).
- **Frontend Vitest Suite**: `npm test -- --run` $\rightarrow$ **`38 / 38 Test Files, 236 / 236 Tests PASSED`**.
- **Frontend Quality**: `0 lint errors`, production build completed in `4.37s`.

---

## 9. Final Phase E Gate Status

```text
PHASE E: PASS — SCORING ENGINE DETERMINISTIC AND EXPLAINABLE
```
