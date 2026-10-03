# Phase 1A — Existing Schema and Code Audit
## AchieveNest Campus Journalism Award Foundation

**Target Domain:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Audit Scope:** Repository Migrations, Models, Services, Test Schema, and Canonical Reference Data  
**Audit Timestamp:** 2026-08-31 22:30:00 UTC+08:00  

---

## 1. Executive Objective

The objective of Workstream 1A is to conduct an exhaustive audit of the AchieveNest codebase and database architecture prior to finalizing any DDL or configuration for the **Campus Journalism Award**. In accordance with **Principle 1 (Audit before alteration)** and **Principle 2 (Reuse before creating)**, all existing normalized structures for awards, criteria, scoring rules, evidence mappings, student portfolios, evidence files, and verification lifecycles are evaluated for reuse and reconciliation.

---

## 2. Repository Code and Migration Inventory

### 2.1 Database Migrations Audit

| Migration Identifier | Name | Scope / Purpose | Campus Journalism Reusability |
|---|---|---|---|
| `2026-08-27-000016` | `CreateStudentPortfolioDomain` | Creates `portfolio_categories`, `portfolio_subcategories`, `student_portfolio_records`, `student_portfolio_evidence`, `student_portfolio_verification_events`. | **Authoritative Foundation**: Reused for student publications, attachments, and verification status. |
| `2026-08-27-000017` | `CreateAwardScoringDomain` | Creates `award_definitions`, `award_criteria`, `award_scoring_rules`, `award_portfolio_mappings`, `award_cycles`, `student_award_evaluations`, `student_award_criterion_scores`, `student_award_score_evidence`, `award_interview_eligibilities`. | **Authoritative Foundation**: Reused for award definitions, official criteria, scoring rules, and scoring snapshots. |
| `2026-08-27-000022` | `EnableTargetRlsAndGrants` | Establishes target RLS policies, role access grants, and security invokers. | **Security Baseline**: Preserves RLS policies and table grants without weakening authorization. |
| `2026-08-27-000024` | `SeedPermanentReferenceData` | Seeds permanent reference data for roles, units, academic programs, and portfolio taxonomy. | **Taxonomy Foundation**: Seeds the permanent `Campus Journalism` portfolio category (`2b09cd61-7a23-4466-be58-889398e8f201`). |
| `2026-08-30-000030` | `AddAwardConfigurationAndAuthorityMetadata` | Extends `award_definitions`, `award_criteria`; creates `award_scoring_model_versions` and `award_criterion_components`. | **Authority & Subcriteria Baseline**: Provides multi-version scoring models and `award_criterion_components`. |
| `2026-08-30-000031` | `AddAwardEvidenceMappingRules` | Creates `award_evidence_mapping_rules` linking components to taxonomy categories/subcategories. | **Mapping Engine**: Reused for declarative taxonomy-to-component evidence mapping. |
| `2026-08-30-000032` | `AddAwardScoringEngineRules` | Adds rule configuration JSON validation and engine parameters. | **Engine Foundation**: Provides `rule_config` JSON fields for sum-capped item rules and role matrices. |
| `2026-08-30-000039` | `RemediateCampusJournalismAward` | Remediates Campus Journalism Award to 100.00 official / 70.00 computable baseline. | **Authoritative Award Model**: Defines exact 4 criteria, 6 components, 8 mappings, and 6 scoring rules. |
| `2026-08-31-000001` | `CreateCanonicalMySQLBaseline` | Canonical MySQL baseline migration executing `000001_schema.sql` and `000002_reference_data.sql`. | **Fresh Replay Foundation**: Ensures reproducible fresh database construction. |

---

## 3. Database Schema Entity Audit

### 3.1 Table: `award_definitions`
- **Purpose**: Authoritative catalog of awards recognized by the institution.
- **Primary Key**: `id` (UUID / CHAR(36))
- **Key Columns**:
  - `code` (VARCHAR(50), UNIQUE)
  - `name` (VARCHAR(200), UNIQUE)
  - `category` (VARCHAR(50))
  - `candidate_threshold_percent` (DECIMAL(5,2), CHECK 0..100) — Default `80.00`
  - `gender_restriction` (VARCHAR(20), NULLable)
  - `graduating_only` (TINYINT(1)) — Default `1` (True)
  - `status` (VARCHAR(20)) — `active` / `draft` / `archived`
  - `authority_status` (VARCHAR(50)) — `OFFICIAL` / `PROPOSED` / `SYSTEM_OPERATIONALIZATION`
  - `source_fidelity_status` (VARCHAR(50)) — `VERIFIED` / `LEGACY_QUARANTINED`
  - `is_catalog_visible` (TINYINT(1)) — Default `1`
  - `active_scoring_version` (VARCHAR(20)) — Default `'1.0'`
- **Campus Journalism Instance**:
  - `id`: `50000001-0000-0000-0000-000000000023`
  - `code`: `CAMPUS_JOURNALISM_AWARD`
  - `name`: `Campus Journalism Award`
  - `category`: `journalism`
  - `authority_status`: `OFFICIAL`
  - `source_fidelity_status`: `VERIFIED`
  - `graduating_only`: `1`
  - `candidate_threshold_percent`: `80.00`

### 3.2 Table: `award_criteria`
- **Purpose**: Official rubric criteria evaluating candidate eligibility (100-point basis).
- **Primary Key**: `id` (UUID / CHAR(36))
- **Foreign Keys**:
  - `award_definition_id` $\rightarrow$ `award_definitions(id)` ON DELETE CASCADE
  - `scoring_model_version_id` $\rightarrow$ `award_scoring_model_versions(id)` ON DELETE SET NULL
- **Key Columns**:
  - `code` (VARCHAR(50))
  - `name` (VARCHAR(200))
  - `weight` (DECIMAL(10,2))
  - `max_points` (DECIMAL(10,2))
  - `sort_order` (INT)
  - `is_portfolio_computable` (TINYINT(1))
  - `authority_status` (VARCHAR(50))
- **Uniqueness**: `UNIQUE(award_definition_id, code)`

### 3.3 Table: `award_criterion_components`
- **Purpose**: Subcriteria breakdown under computable criteria for structured scoring.
- **Primary Key**: `id` (UUID / CHAR(36))
- **Foreign Keys**:
  - `criterion_id` $\rightarrow$ `award_criteria(id)` ON DELETE CASCADE
- **Key Columns**:
  - `code` (VARCHAR(50))
  - `name` (VARCHAR(200))
  - `description` (TEXT)
  - `max_points` (DECIMAL(10,2))
  - `sort_order` (INT)
  - `is_computable` (TINYINT(1))
  - `authority_status` (VARCHAR(50))

### 3.4 Table: `award_scoring_rules`
- **Purpose**: Authoritative mathematical point calculation configuration for each component.
- **Primary Key**: `id` (UUID / CHAR(36))
- **Foreign Keys**:
  - `criterion_id` $\rightarrow$ `award_criteria(id)` ON DELETE CASCADE
  - `criterion_component_id` $\rightarrow$ `award_criterion_components(id)` ON DELETE CASCADE
- **Key Columns**:
  - `code` (VARCHAR(50))
  - `name` (VARCHAR(200))
  - `rule_type` (VARCHAR(50)) — `sum_capped`, `highest_only`, `fixed_presence`, etc.
  - `points` (DECIMAL(10,2))
  - `max_points` (DECIMAL(10,2))
  - `rule_config` (JSON / JSONB)
  - `authority_status` (VARCHAR(50))
  - `is_active` (TINYINT(1))

### 3.5 Table: `award_evidence_mapping_rules`
- **Purpose**: Declarative routing from portfolio taxonomy records to scoring components.
- **Primary Key**: `id` (UUID / CHAR(36))
- **Foreign Keys**:
  - `criterion_id` $\rightarrow$ `award_criteria(id)` ON DELETE CASCADE
  - `criterion_component_id` $\rightarrow$ `award_criterion_components(id)` ON DELETE CASCADE
  - `portfolio_category_id` $\rightarrow$ `portfolio_categories(id)` ON DELETE RESTRICT
  - `portfolio_subcategory_id` $\rightarrow$ `portfolio_subcategories(id)` ON DELETE RESTRICT
- **Key Columns**:
  - `rule_code` (VARCHAR(50))
  - `name` (VARCHAR(200))
  - `priority` (INT)
  - `is_active` (TINYINT(1))

### 3.6 Tables: `student_portfolio_records` & `student_portfolio_evidence`
- **Purpose**: Student-submitted portfolio accomplishments and their attached evidence files.
- **Cardinality**: `student_portfolio_records` (1) $\rightarrow$ `student_portfolio_evidence` (N).
- **Foreign Keys**:
  - `student_portfolio_records.student_profile_id` $\rightarrow$ `student_profiles(profile_id)`
  - `student_portfolio_records.category_id` $\rightarrow$ `portfolio_categories(id)`
  - `student_portfolio_records.subcategory_id` $\rightarrow$ `portfolio_subcategories(id)`
  - `student_portfolio_evidence.portfolio_record_id` $\rightarrow$ `student_portfolio_records(id)` ON DELETE CASCADE
- **Integrity Rule**: Scoring operates strictly on `student_portfolio_records`. Evidence records provide verification backing but never inflate achievement counts.

---

## 4. GitHub ↔ AchieveNest-Test Reconciliation Matrix

| Requirement | GitHub Structure | Test Structure | Reusable? | Gap Identified | Reconciled Action |
|---|---|---|:---:|---|---|
| **Portfolio Category** | `portfolio_categories` | `portfolio_categories` | **Yes** | None. Category `Campus Journalism` (`2b09cd61-7a23-4466-be58-889398e8f201`) exists. | Reused directly. |
| **Award Definition** | `award_definitions` | `award_definitions` | **Yes** | None. Record `CAMPUS_JOURNALISM_AWARD` exists with UUID `50000001-0000-0000-0000-000000000023`. | Reused with stable ID. |
| **Criteria (Rubric)** | `award_criteria` | `award_criteria` | **Yes** | None. 4 criteria represent 100.00 pts total (70.00 computable, 30.00 non-computable). | Reused directly. |
| **Subcriteria (Components)** | `award_criterion_components` | `award_criterion_components` | **Yes** | None. 6 components represent News, Literary, Column, Editorial, Leadership Role, Awards. | Reused directly. |
| **Scoring Rules** | `award_scoring_rules` | `award_scoring_rules` | **Yes** | None. 6 sum_capped rules with JSON configs define exact point values and caps. | Reused directly. |
| **Evidence Routing** | `award_evidence_mapping_rules` | `award_evidence_mapping_rules` | **Yes** | None. 8 mapping rules link subcategories to components deterministically. | Reused directly. |
| **Achievement Record** | `student_portfolio_records` | `student_portfolio_records` | **Yes** | None. Single achievement entity contains structured metadata. | Reused directly. |
| **Evidence Files** | `student_portfolio_evidence` | `student_portfolio_evidence` | **Yes** | None. 1:N relationship with `portfolio_record_id` foreign key. | Reused directly. |
| **Verification State** | `student_portfolio_records.status` | `student_portfolio_records.status` | **Yes** | None. Clearly separated from lifecycle status. | Reused directly. |
| **Journalism Roles** | `portfolio_subcategories` + JSON | `portfolio_subcategories` + JSON | **Yes** | None. Officer (`...0006`) and Member/Contributor (`...0005`) distinct. | Reused directly. |
| **Recognition Levels** | `portfolio_categories` (`Citation`) | `portfolio_categories` (`Citation`) | **Yes** | None. International/National (3) and Local (2) supported via rule config. | Reused directly. |

---

## 5. Gate 1A Conclusion & Approval

- **Gate Status:** **PASSED**
- **Findings:** The existing normalized database architecture completely and accurately supports the required Campus Journalism Award data model without requiring destructive modifications, table renames, or ad-hoc column hacks.
- **Architectural Decision:** Replay and validate the canonical configuration deterministically via additive migrations and SQL specifications.
