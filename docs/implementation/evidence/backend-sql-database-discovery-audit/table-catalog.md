# Canonical Database Table Catalog

| Table Name | Domain | Description / Purpose | Created By Migration |
|---|---|---|---|
| `profiles` | Identity & Auth | Central user identity, email, name, role, sex, avatar | `Pre-existing / Initial Schema` |
| `local_auth_credentials` | Local Auth | Password hashes, must_change_password flags, lockouts | `Pre-existing / Initial Schema` |
| `colleges` | Institutional Structure | Academic colleges, codes, names, branding metadata | `Pre-existing / Initial Schema` |
| `administrative_units` | Institutional Structure | Non-academic departments, units, offices | `Historical Migration` |
| `academic_programs` | Academic Programs | Degree programs affiliated with colleges | `Historical Migration` |
| `personnel_profiles` | Personnel Master Data | Personnel group, organizational side, faculty status, employment status, rank/title | `Historical Migration` |
| `personnel_annual_reviews` | Evaluation Eligibility | Annual review records, subject_to_evaluation flag, Dean endorsement | `Pre-existing / Initial Schema` |
| `faculty_rank_catalog` | Rank & Catalog | Authoritative Full-Time faculty academic ranks (Instructor I to Professor VI) | `2026-09-08-000064_CreateFacultyRankCatalog.php` |
| `part_time_faculty_titles` | Rank & Catalog | Authoritative Part-Time faculty titles (Lecturer to Professorial Lecturer) | `Historical Migration` |
| `faculty_rank_transitions` | Rank & Catalog | Allowed sequential rank progressions and verified PhD jump rules | `2026-09-08-000065_CreateFacultyRankTransitions.php` |
| `evaluation_scales` | Evaluation Instruments | Evaluation scale master definitions | `2026-09-08-000063_CreateEvaluationScaleCatalogue.php` |
| `evaluation_scale_versions` | Evaluation Instruments | Versioned instrument metadata and status | `2026-09-08-000063_CreateEvaluationScaleCatalogue.php` |
| `evaluation_scale_areas` | Evaluation Instruments | Evaluation Areas (Area 1–5), max points and percentage caps | `2026-09-08-000063_CreateEvaluationScaleCatalogue.php` |
| `evaluation_scale_categories` | Evaluation Instruments | Instrument categories nested under Areas | `2026-09-08-000063_CreateEvaluationScaleCatalogue.php` |
| `evaluation_scale_subcategories` | Evaluation Instruments | Subcategories providing scoring granularity | `2026-09-08-000063_CreateEvaluationScaleCatalogue.php` |
| `evaluation_scale_criteria` | Evaluation Instruments | Individual criteria, benchmarks, point ceilings | `2026-09-08-000063_CreateEvaluationScaleCatalogue.php` |
| `personnel_evaluations` | Personnel Evaluation | Evaluation roots, cycle, reviewer route, status, computed scores | `Historical Migration` |
| `personnel_evaluation_items` | Personnel Evaluation | Scored items, evidence linkages, evaluator ratings | `Historical Migration` |
| `personnel_portfolio_submissions` | Personnel Portfolio | Whole-portfolio submissions, version lineage, snapshot data | `Historical Migration` |
| `personnel_accomplishments` | Personnel Portfolio | Individual accomplishment records and evidence links | `Historical Migration` |
| `personnel_evidence_records` | Protected Evidence | Protected evidence file metadata, SHA-256 hashes, storage paths | `Historical Migration` |
| `personnel_evaluation_audits` | Audit & Governance | Immutable append-only audit trail for all evaluation events | `Historical Migration` |
| `personnel_workflow_notifications` | Workflow Notifications | Event-driven persisted notifications for review actions | `Historical Migration` |
| `awards` | OSAD Student Awards | OSAD award definitions, cycles, and eligibility rules | `Historical Migration` |
| `award_evaluations` | OSAD Student Awards | Award evaluations, student candidates, scores, decisions | `Historical Migration` |
