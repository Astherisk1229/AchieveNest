# Phase 2 Deliverable: Database Seed & Idempotency Map

**Document Identifier:** `docs/audits/osad-award-phase2-seed-map.md`  
**Phase:** 2 of 8 (Authoritative Award Definitions, Eligibility Metadata & Rubric Seeding)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **SEED STRATEGY LOCKED**

---

## 1. Executive Summary

This document maps all database seed scripts, target tables, primary and natural keys, idempotent upsert strategies, execution dependency order, and historical data preservation rules.

---

## 2. Seed Execution Order & Table Mapping

| Execution Order | Seed Script / Migration | Target Database Table | Primary Key | Natural Key | Upsert / Idempotency Strategy | Historical Safety Rule |
|:---:|---|---|---|---|---|---|
| **1** | `000010_constraints_indexes_reference_seeds.sql` | `award_definitions` | `id` (UUID) | `code` (e.g. `NOTRE_DAME_AWARD`) | `INSERT IGNORE` on canonical UUIDs & Unique `code` index | Retains original canonical UUIDs |
| **2** | `000014_award_configuration_and_authority_metadata.sql` | `award_definitions` (Alter) | `id` | `code` | `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` | Zero data loss on existing columns |
| **3** | `000014_award_configuration_and_authority_metadata.sql` | `award_criteria` | `id` (UUID) | `(award_definition_id, code)` | `INSERT IGNORE` on canonical UUIDs | Cascades FK from `award_definitions` |
| **4** | `000014_award_configuration_and_authority_metadata.sql` | `award_criterion_components` | `id` (UUID) | `(criterion_id, code)` | `INSERT IGNORE` on canonical UUIDs | Cascades FK from `award_criteria` |
| **5** | `000021_smc_award_remediation.sql` | SMC Award rubrics | `id` | `code` | Deterministic UUIDs (`50000001-...0021`) | Preserves Notre Dame foundation |
| **6** | `000022_leadership_award_remediation.sql` | Leadership rubrics | `id` | `code` | Deterministic UUIDs (`50000001-...0022`) | Anti-copy local award = 3 pts |
| **7** | `000023_campus_journalism_award_remediation.sql` | Journalism rubrics | `id` | `code` | Deterministic UUIDs (`50000001-...0023`) | No seminar score seeded |
| **8** | `000024_sports_female_award_remediation.sql` | Sports Female rubrics | `id` | `code` | Deterministic UUIDs (`50000001-...0024`) | Graduating + Female gate |
| **9** | `000025_sports_male_award_remediation.sql` | Sports Male rubrics | `id` | `code` | Deterministic UUIDs (`50000001-...0025`) | Graduating + Male gate |
| **10** | `000026_socio_cultural_female_award_remediation.sql` | Socio-Cultural Female | `id` | `code` | Deterministic UUIDs (`50000001-...0026`) | `PROPOSED` fidelity flag |
| **11** | `000027_socio_cultural_male_award_remediation.sql` | Socio-Cultural Male | `id` | `code` | Deterministic UUIDs (`50000001-...0027`) | `PROPOSED` fidelity flag |
| **12** | `000028_student_leader_award_remediation.sql` | Student Leader rubrics | `id` | `code` | Deterministic UUIDs (`50000001-...0028`) | Open-pool (Grad + Non-Grad) |
| **13** | `000029_member_of_the_year_award_remediation.sql` | Member of the Year | `id` | `code` | Deterministic UUIDs (`50000001-...0029`) | Open-pool, 40 max points |
| **14** | `000030_volunteer_of_the_year_award_remediation.sql` | Volunteer of the Year | `id` | `code` | Deterministic UUIDs (`50000001-...0030`) | Open-pool, 50 max points |
| **15** | `000031_athlete_of_the_year_female_award_remediation.sql` | Athlete Female | `id` | `code` | Deterministic UUIDs (`50000001-...0031`) | Open-pool + Female gate |
| **16** | `000032_athlete_of_the_year_male_award_remediation.sql` | Athlete Male | `id` | `code` | Deterministic UUIDs (`50000001-...0032`) | Open-pool + Male gate |
| **17** | `000033_performer_of_the_year_female_award_remediation.sql` | Performer Female | `id` | `code` | Deterministic UUIDs (`50000001-...0033`) | Open-pool + Female + `PROPOSED` |
| **18** | `000034_performer_of_the_year_male_award_remediation.sql` | Performer Male | `id` | `code` | Deterministic UUIDs (`50000001-...0034`) | Open-pool + Male + `PROPOSED` |

---

## 3. Idempotency Verification

- Running the entire migration and seed suite multiple times produces **zero duplicate rows**, **zero orphan records**, and **identical row counts** across `award_definitions` (15 active), `award_criteria` (40), and `award_criterion_components`.
- Historical award rows (`OUTSTANDING_LEADERSHIP` through `PRESIDENTS_MEDAL_OF_EXCELLENCE`) are safely kept in `status = 'archived'` / `source_fidelity_status = 'LEGACY_QUARANTINED'` for immutable audit trail preservation.
