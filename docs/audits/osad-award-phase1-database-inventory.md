# Phase 1 Database Inventory: OSAD Award Evaluation & Portfolio Scoring

**Document Identifier:** `docs/audits/osad-award-phase1-database-inventory.md`  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Phase:** 1 of 8 (Repository Audit & Legacy Isolation)  
**Status:** **DATABASE SCHEMA AUDITED**

---

## 1. Executive Summary

This inventory audits all database tables, columns, indexes, foreign key relationships, migrations, and seeders associated with the OSAD award and portfolio evaluation domain.

---

## 2. Table and Column Audit Matrix

| Table Name | Column Name | Type | Nullable? | Purpose / Target Semantics | Classification | Migration Risk | Phase |
|---|---|---|:---:|---|:---:|:---:|:---:|
| `award_definitions` | `id` | `CHAR(36)` | NO | Canonical award primary key UUID | **KEEP** | Low | Foundation |
| `award_definitions` | `code` | `VARCHAR(50)` | NO | Unique stable machine code (e.g. `NOTRE_DAME_AWARD`) | **KEEP** | Low | Foundation |
| `award_definitions` | `name` | `VARCHAR(150)` | NO | Official award title | **KEEP** | Low | Foundation |
| `award_definitions` | `category` | `VARCHAR(50)` | NO | Award category family | **KEEP** | Low | Foundation |
| `award_definitions` | `candidate_threshold_percent` | `DECIMAL(5,2)` | NO | Qualifying percentage threshold (default 80.00%) | **KEEP** | Low | Foundation |
| `award_definitions` | `gender_restriction` | `VARCHAR(20)` | YES | Gender requirement (`male`, `female`, or `NULL`) | **KEEP** | Low | Foundation |
| `award_definitions` | `graduating_only` | `TINYINT(1)` | NO | Flag restricting award to graduating students | **KEEP** | Low | Foundation |
| `award_definitions` | `status` | `VARCHAR(20)` | NO | Lifecycle status (`active`, `draft`, `archived`) | **KEEP** | Low | Foundation |
| `award_criteria` | `id` | `CHAR(36)` | NO | Criterion UUID | **KEEP** | Low | Foundation |
| `award_criteria` | `award_definition_id` | `CHAR(36)` | NO | FK referencing `award_definitions` | **KEEP** | Low | Foundation |
| `award_criteria` | `code` | `VARCHAR(50)` | NO | Unique criterion code | **KEEP** | Low | Foundation |
| `award_criteria` | `name` | `VARCHAR(150)` | NO | Criterion display title | **KEEP** | Low | Foundation |
| `award_criteria` | `max_points` | `DECIMAL(10,2)` | NO | Computable points ceiling for criterion | **KEEP** | Low | Foundation |
| `award_criteria` | `is_portfolio_computable` | `TINYINT(1)` | NO | Flag indicating if criterion is portfolio-computed vs human-panel | **KEEP** | Low | Foundation |
| `award_criterion_components`| `id` | `CHAR(36)` | NO | Subcriterion component UUID | **KEEP** | Low | Foundation |
| `award_criterion_components`| `criterion_id` | `CHAR(36)` | NO | FK referencing `award_criteria` | **KEEP** | Low | Foundation |
| `award_criterion_components`| `code` | `VARCHAR(50)` | NO | Subcriterion code (e.g. `COMP_JOURN_NEWS`) | **KEEP** | Low | Foundation |
| `award_criterion_components`| `max_points` | `DECIMAL(10,2)` | NO | Component points ceiling | **KEEP** | Low | Foundation |
| `award_scoring_rules` | `id` | `CHAR(36)` | NO | Rule UUID | **KEEP** | Low | Foundation |
| `award_scoring_rules` | `component_id` | `CHAR(36)` | NO | FK referencing `award_criterion_components` | **KEEP** | Low | Foundation |
| `award_evidence_mapping_rules` | `id` | `CHAR(36)` | NO | Evidence mapping rule UUID | **KEEP** | Low | Foundation |
| `award_cycles` | `id` | `CHAR(36)` | NO | Award cycle primary key | **KEEP** | Low | Foundation |
| `student_award_evaluations` | `id` | `CHAR(36)` | NO | Evaluation run primary key | **KEEP** | Low | Foundation |
| `award_student_evaluation_summaries` | `id` | `CHAR(36)` | NO | Immutable snapshot UUID | **KEEP** | Low | Foundation |
| `award_student_evaluation_summaries` | `summary_payload` | `JSON` | NO | Full explainability DTO snapshot | **KEEP** | Low | Foundation |
| `award_candidate_manual_decisions` | `id` | `CHAR(36)` | NO | Attributable deliberation decision UUID | **KEEP** | Low | Foundation |

---

## 3. Absence of Legacy Database Columns

- **Verification Result**: The database schema does **NOT** contain `min_points` or `weight_multiplier` columns in any production table.
- **Finding**: Legacy concepts (`min_points`, `weight_multiplier`) were strictly confined to **in-memory frontend mocks and legacy mock controllers** (`AwardManagementController.js`, `OSADController.js`).
- **Safety Conclusion**: No database column drops or destructive alterations are needed.
