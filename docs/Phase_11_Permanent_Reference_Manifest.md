# Phase 11 Permanent Reference Manifest

| Table Name | Expected Count | Actual Count | Fingerprint Segment / Hash | Authoritative Source Migration | Operational Status |
| :--- | :---: | :---: | :--- | :--- | :---: |
| `roles` | 7 | 7 | `ROLE:*:dean,hr_staff,org_mod,osad,personnel,coord,student` | `000010_constraints_indexes_reference_seeds.sql` | PASS (Active) |
| `colleges` | 5 | 5 | `COLLEGE:*:CAS,CBA,CET,CHS,CTE` | `000010_constraints_indexes_reference_seeds.sql` | PASS (Active) |
| `academic_programs` | 14 | 14 | `PROG:*:BSCS,BSIT,BSA,BSBA,etc.` (0 orphans) | `000010_constraints_indexes_reference_seeds.sql` | PASS (Active) |
| `administrative_units` | 19 | 19 | `ADMIN:*:19 non-academic offices/units` | `000010_constraints_indexes_reference_seeds.sql` | PASS (Active) |
| `portfolio_categories` | 9 | 9 | `CAT:*:9 sorted student portfolio categories` | `000010_constraints_indexes_reference_seeds.sql` | PASS (Active) |
| `portfolio_subcategories` | 57 | 57 | `SUBCAT:*:57 subcategories` (0 orphans) | `000010_constraints_indexes_reference_seeds.sql` | PASS (Active) |
| `award_definitions` | 15 | 15 | `AWARD:*:15 institutional awards` (80% threshold) | `000010_constraints_indexes_reference_seeds.sql` | PASS (Active) |
| `award_criteria` | 75 | 75 | `CRITERIA:*:75 criteria across 15 awards` (0 orphans) | `000010_constraints_indexes_reference_seeds.sql` | PASS (Active) |
| `award_scoring_rules` | 150 | 150 | `RULE:*:150 rules linked to criteria` (0 orphans) | `000010_constraints_indexes_reference_seeds.sql` | PASS (Active) |
| `award_portfolio_mappings` | 57 | 57 | `MAPPING:*:57 category/subcategory mappings` (0 orphans) | `000010_constraints_indexes_reference_seeds.sql` | PASS (Active) |

## Master Cryptographic Fingerprint

- **SHA-256 Fingerprint (`achievenest_local`):** `a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f`
- **SHA-256 Fingerprint (`achievenest_phase11_replay` clean build):** `a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f`
- **Replay Invariant:** 100% Deterministic Match across clean migration replay.
