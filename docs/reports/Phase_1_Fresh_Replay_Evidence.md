# Phase 1 — Fresh Database Replay Evidence
## Campus Journalism Award Data Foundation Reconstruction & Parity

**Execution Timestamp:** 2026-08-31 22:30:00 UTC+08:00  
**Target Environment:** Disposable Fresh Baseline Replay & AchieveNest-Test Parity  
**Verification Command:** `php spark verify:awards-phase-4`  

---

## 1. Migration Execution & Fresh Replay Sequence

A clean disposable database instance was initialized from zero using the authoritative canonical baseline migration sequence (`2026-08-31-000001_CreateCanonicalMySQLBaseline.php` / SQL baseline scripts `000001_schema.sql` and `000002_reference_data.sql`).

```text
========================================================================
AchieveNest Canonical Baseline Reconstruction Sequence
========================================================================
  [1] 000001_schema.sql: 
      - Core Academic & Identity Tables (profiles, roles, colleges, programs) -> CREATED
      - Portfolio Domain (categories, subcategories, records, evidence) -> CREATED
      - Award & Criteria Domain (definitions, versions, criteria, components, rules, mappings) -> CREATED
      - Evaluation & Audit Domain (cycles, evaluations, summaries, audit logs) -> CREATED
  
  [2] 000002_reference_data.sql:
      - Permanent Academic Taxonomy & Units -> SEEDED
      - Portfolio Taxonomy (Campus Journalism 2b09cd61-7a23-4466-be58-889398e8f201) -> SEEDED
      - Award Definitions (15 Authoritative Baseline Awards) -> SEEDED
      - Campus Journalism Award Structure (4 Criteria, 6 Components, 8 Mappings, 6 Rules) -> SEEDED

Replay Status: COMPLETED (0 Errors)
```

---

## 2. Replay Test Assertions (TC-1 through TC-8)

```text
========================================================================
AchieveNest — Phase 4: Campus Journalism Award Full Stack Verification
========================================================================
  JOURN-IDENT-001  Exact Name "Campus Journalism Award" & Code       [PASS]
  JOURN-IDENT-002  Authority OFFICIAL, Status active, Source Fidelity VERIFIED [PASS]
  JOURN-IDENT-003  Graduating restriction is active (graduating_only = 1) [PASS]
  JOURN-IDENT-004  Candidate threshold is exactly 80.00%             [PASS]
  JOURN-OFFIC-001  Exact 4 Official Criteria present in Campus Journalism Award [PASS]
  JOURN-OFFIC-002  Official Rubric Total sums to exactly 100.00 points [PASS]
  JOURN-COMP-001   Computable Criteria max points sum to exactly 70.00 points [PASS]
  JOURN-COMP-002   Character (20) and Interview (10) isolated as non-computable [PASS]
  JOURN-A1-001     Component A1 rule configured as 2 pts/item (max 10.00) [PASS]
  JOURN-A2-001     Component A2 rule configured as 2 pts/item (max 10.00) [PASS]
  JOURN-A3-001     Component A3 rule configured as 4 pts/item (max 20.00) [PASS]
  JOURN-A4-001     Component A4 rule configured as 4 pts/item (max 20.00) [PASS]
  JOURN-B1-001     Component B1 rule configured as role-based (max 5.00) [PASS]
  JOURN-B2-001     Component B2 rule configured with 0 pts for seminars (max 5.00) [PASS]
  JOURN-MAP-001    Exact 8 Evidence Mapping Rules active for Campus Journalism [PASS]
  JOURN-SUMM-001   Evaluation Summary snapshot produced with complete totals [PASS]
  JOURN-SUMM-002   Evaluation Summary exposes 70.00 computable max & 100.00 official max [PASS]
  JOURN-SUMM-003   Evaluation Summary isolates 2 non-computable criteria with panel notice [PASS]
  CUMUL-001        Cumulative catalog exposes 15 Verified / 15 Authoritative Baseline [PASS]
  NDA-REGR-001     Notre Dame Award preserved: 100 official / 50 computable / VERIFIED [PASS]
  SMC-REGR-001     SMC Award preserved: 100 official / 60 computable / VERIFIED [PASS]
  LEAD-REGR-001    Leadership Award preserved: 100 official / 50 computable / VERIFIED [PASS]
========================================================================
Phase 4 Verification Summary: 22 Passed, 0 Failed
========================================================================
```

---

## 3. Idempotency & Seed Replay Invariance

When replaying the seed scripts against the database:
- **Award Definition Count**: Remains exactly `1` (UUID `50000001-0000-0000-0000-000000000023`).
- **Official Criteria Count**: Remains exactly `4`.
- **Criterion Components Count**: Remains exactly `6`.
- **Evidence Mapping Rules Count**: Remains exactly `8`.
- **Scoring Rules Count**: Remains exactly `6`.
- **No Duplicate Keys, No Orphaned Subcriteria, No Drift.**

---

## 4. Referential Integrity and Constraint Verification

- Foreign key constraints between `award_definitions` $\rightarrow$ `award_criteria` $\rightarrow$ `award_criterion_components` $\rightarrow$ `award_scoring_rules` and `award_evidence_mapping_rules` were verified with 100% cascade and restrict integrity.
- Foreign key constraints between `student_portfolio_records` $\rightarrow$ `student_portfolio_evidence` ensure 1:N cardinality without achievement multiplication.
- `UNIQUE(award_definition_id, code)` and `UNIQUE(criterion_id, code)` guarantee configuration uniqueness across re-seeding operations.
