# OSAD Awards & Scoring Criteria — Phase A Current-State Audit Report

> **Executive Scope:** Fact-based repository, database, and UI audit of the authoritative current state of the **OSAD Awards & Scoring Criteria** subsystem within AchieveNest before any schema modification, scoring rule expansion, mapping normalization, or UI refinement begins.

---

## 1. Executive Summary

Phase A establishes the exact current baseline of AchieveNest's Awards and Scoring Criteria subsystem. The audit proves that:
1. **Portfolio Taxonomy (9 / 9 Categories)**: All 9 authoritative student portfolio categories and 57 subcategories exist, active, and fully populated in `portfolio_categories` and `portfolio_subcategories`.
2. **Award Catalog (15 / 15 Awards)**: All 15 institutional award definitions exist in `award_definitions` with active status, 80.00% candidate threshold, and graduating constraints.
3. **Criteria & Rubrics**: 40 distinct criteria exist across the 15 award definitions in `award_criteria`.
4. **Scoring & Evaluation Engine**: `AwardEvaluationService.php` implements deterministic scoring derived strictly from verified student portfolio records (`status = 'verified'`), preventing double-counting within criteria and recording immutable basis snapshots.
5. **Candidate Pathways**: Two distinct candidate qualification pathways are operational:
   - Automated Portfolio-Based Threshold ($\ge 80.00\%$ potential score).
   - Dean Student Nomination pathway (cross-college eligible, explicitly flagged as `dean_nomination`).
6. **OSAD Admin UI**: `OSADAwardsAndCriteriaPage.jsx` and `OSADAwardCandidateReviewPage.jsx` provide visibility into award criteria, candidate lists, score breakdowns, and interview advancement workflows.

---

## 2. Repository Freeze & Reconciliation (A1–A4)

```text
Current Working Branch: audit/project-architecture-linkage
Local HEAD SHA:         ea987bf32c208cc99ebe1a60b989c0c09ca83e98
Latest Commit Message:  docs(audit): close osad refinement regression and replay
Remote Origin:          https://github.com/Astherisk1229/AchieveNest.git (fetch & push)
Local Tracking State:   Active feature branch with completed Academic Structure Phases C–G
Academic Structure:     Phases C–G implementation & audit reports verified present
```

---

## 3. Database Identity & Row-Count Safety Baseline (A5–A7)

```text
Database Host:      127.0.0.1:3306 (WampServer MySQL 8.4.7)
Database Name:      achievenest_local
Database User:      achievenest_app (app) / root (admin)
Authentication Mode: local-defense
Total Tables:       57 tables
```

### 3.1 Authoritative Row-Count Baseline

| Table | Row Count | Invariant Notes |
|---|---|---|
| `profiles` | 56 | Total user accounts (students, faculty, administrators) |
| `student_profiles` | 41 | Active student profiles |
| `personnel_profiles` | 15 | Active personnel profiles |
| `roles` | 7 | Canonical system roles |
| `profile_roles` | 62 | Role assignments |
| `colleges` | 5 | Active institutional colleges (CET, CBA, CAS, CED, CHS) |
| `academic_programs` | 14 | Active undergraduate degree programs |
| `administrative_units` | 19 | Administrative support & operational units |
| `organizations` | 2 | Registered student organizations |
| `portfolio_categories` | 9 | Authoritative main achievement categories |
| `portfolio_subcategories` | 57 | Granular subcategories |
| `student_portfolio_records` | 5 | Baseline student achievement portfolio items |
| `student_portfolio_evidence` | 4 | Uploaded physical evidence files with SHA-256 |
| `student_portfolio_verification_events` | 4 | Verifier audit history trail |
| `award_definitions` | 15 | Canonical institutional award catalog |
| `award_cycles` | 1 | AY 2025-2026 Academic Year Award Cycle |
| `award_criteria` | 40 | Criteria rows across all 15 awards |
| `award_scoring_rules` | 0 | Dynamic rule table (fallback to criterion domain mapping) |
| `award_portfolio_mappings` | 0 | Explicit many-to-many rule mapping table |
| `student_award_evaluations` | 0 | Computed evaluations (recalculated idempotently) |
| `student_award_criterion_scores` | 0 | Criterion-level awarded score items |
| `student_award_score_evidence` | 0 | Evidence basis link items |
| `award_interview_eligibilities` | 0 | Finalized candidate qualification records |
| `dean_student_nominations` | 1 | Active Dean student nomination record |
| `dean_assignments` | 2 | Active institutional Dean assignments |
| `program_coordinator_assignments` | 3 | Active Program Coordinator assignments |
| `personnel_program_affiliations` | 9 | HR-established personnel-program affiliations |
| `audit_logs` | 83 | System-wide audit event records |

---

## 4. Portfolio Taxonomy Findings (A9–A10)

All **9 Main Categories** exist in `portfolio_categories`:

| Sort | Code | Name | Description / Scope |
|---|---|---|---|
| 1 | `LEADERSHIP_POSITION` | Leadership Position | SSG, Collegiate Council, Club/Organization, Year-Level |
| 2 | `ORG_MEMBERSHIP_PARTICIPATION` | Organization Membership / Participation | General member, committee member, activity participant, facilitator |
| 3 | `COMMUNITY_SERVICE_VOLUNTEERISM` | Community Service / Volunteerism | University-based, community-based, church-based, environmental |
| 4 | `CHURCH_MINISTRY_INVOLVEMENT` | Church / Ministry Involvement | Campus ministry, parish ministry, church organizations, initiated service |
| 5 | `SEMINAR_TRAINING` | Seminar / Training | Leadership, personal/professional development, technical workshops |
| 6 | `CITATION_RECOGNITION` | Citation / Recognition | Verified non-academic citations, commendations, recognitions |
| 7 | `SPORTS` | Sports | Athletic participation, sports meets/competitions, placements/medals |
| 8 | `SOCIO_CULTURAL_PERFORMING_ARTS` | Socio-Cultural / Performing Arts | Dance, vocal, instrumental, theater, cultural performances |
| 9 | `CAMPUS_JOURNALISM` | Campus Journalism | News, literary works, columns, editorials, publication officer |

---

## 5. Award Definitions Catalog (A13)

All **15 Authoritative Awards** exist in `award_definitions`:

| # | Code | Name | Category | Threshold | Constraints |
|---|---|---|---|---|---|
| 1 | `ACADEMIC_EXCELLENCE` | Academic Excellence Award | academic | 80.00% | Graduating only |
| 2 | `DEANS_MEDAL_OF_DISTINCTION` | Dean Medal of Distinction | collegiate | 80.00% | Graduating only |
| 3 | `LOYALTY_AWARD` | Institutional Loyalty Award | loyalty | 80.00% | Graduating only |
| 4 | `MOST_OUTSTANDING_STUDENT` | Most Outstanding Student Award | overall | 80.00% | Graduating only |
| 5 | `OUTSTANDING_ATHLETE_FEMALE` | Outstanding Athlete of the Year (Female) | sports | 80.00% | Female, Graduating |
| 6 | `OUTSTANDING_ATHLETE_MALE` | Outstanding Athlete of the Year (Male) | sports | 80.00% | Male, Graduating |
| 7 | `OUTSTANDING_CAMPUS_JOURNALISM` | Outstanding Campus Journalist Award | journalism | 80.00% | Graduating only |
| 8 | `OUTSTANDING_CHURCH_MINISTRY` | Outstanding Campus Ministry Service Award | ministry | 80.00% | Graduating only |
| 9 | `OUTSTANDING_CO_CURRICULAR` | Outstanding Co-Curricular Organization Award | organization | 80.00% | Graduating only |
| 10 | `OUTSTANDING_COMMUNITY_SERVICE` | Outstanding Community Service Award | service | 80.00% | Graduating only |
| 11 | `OUTSTANDING_CULTURAL_ARTIST` | Outstanding Socio-Cultural Performing Artist | culture | 80.00% | Graduating only |
| 12 | `OUTSTANDING_EXTRA_CURRICULAR` | Outstanding Extra-Curricular Club Award | organization | 80.00% | Graduating only |
| 13 | `OUTSTANDING_LEADERSHIP` | Outstanding Student Leader Award | leadership | 80.00% | Graduating only |
| 14 | `PRESIDENTS_MEDAL_OF_EXCELLENCE` | President Medal of Excellence | presidential | 80.00% | Graduating only |
| 15 | `RESEARCH_AND_INNOVATION` | Research & Innovation Award | research | 80.00% | Graduating only |

---

## 6. Verification & Evidence Workflow Findings (A11–A12)

- **Record Lifecycle**: `student_portfolio_records.status` $\in$ `{draft, submitted, verified, rejected, revision_requested}`.
- **Scoring Invariant**: Strictly `verified` records are considered by the scoring engine (`status = 'verified'`).
- **Physical Evidence**: `student_portfolio_evidence` contains `storage_path`, `checksum`, `sha256`, `mime_type`, and `security_status`.
- **Duplicate Prevention**:
  - SHA-256 fingerprinting on uploaded evidence files.
  - Per-criterion record uniqueness in `AwardEvaluationService.php` (`usedRecordIds` tracker prevents counting the same portfolio record twice towards a single criterion).

---

## 7. Scoring Logic & Candidate Generation Findings (A16–A18)

- **Engine Location**: `backend/app/Services/AwardEvaluationService.php`.
- **Calculation Formula**:
  $$\text{Raw Score} = \sum \min(\text{Earned Points}_i, \text{Max Points}_i)$$
  $$\text{Potential Percentage} = \text{round}\left(\frac{\text{Raw Score}}{\text{Max Computable Score}} \times 100, 2\right)$$
- **Threshold Invariant**: `candidate_threshold_percent = 80.00%`.
- **Candidate Classification**:
  - $\text{Potential Percentage} \ge 80.00\% \implies$ Qualified as Potential Candidate (`qualifies_portfolio_based = 1`).
  - $\text{Potential Percentage} < 80.00\% \implies$ Not Qualified (`qualifies_portfolio_based = 0`).
- **Dean Nomination**: Active Deans can nominate students directly via `dean_student_nominations` (`pathway = 'dean_nomination'`), creating zero synthetic points (`potential_score IS NULL`).

---

## 8. Authorization Matrix Findings (A20)

| Persona | Role Key | View Awards | Run Evaluations | View All Candidates | Nominate Candidate |
|---|---|---|---|---|---|
| **OSAD Admin** | `osad_admin` | Allowed | Allowed | Allowed | Denied |
| **Active Dean** | `dean` | Allowed | Denied | Scoped / Allowed | Allowed |
| **Coordinator** | `program_coordinator` | Allowed | Denied | Scoped / Denied | Denied |
| **Student** | `student` | Allowed (Self) | Denied | Denied (Own evaluation only) | Denied |

---

## 9. Current UI Inventory (A21)

1. `frontend/src/pages/osad-admin/OSADAwardsAndCriteriaPage.jsx`:
   - Lists 15 award cards with expand/collapse criteria breakdown.
   - Shows criteria max points, weights, and 80.00% candidate threshold.
2. `frontend/src/pages/osad-admin/OSADAwardCandidateReviewPage.jsx`:
   - Stage 1 candidate review interface with category overview cards, student search, college filter, and batch interview advancement drawer.
3. `frontend/src/services/awardAdminService.js`:
   - Exports client methods: `fetchAwards()`, `fetchCandidates()`, `fetchStudentAwardBasis()`, `triggerAwardEvaluation()`.

---

## 10. Compatibility & Reuse Classification (A23)

| Component | Classification | Notes |
|---|---|---|
| `portfolio_categories` (9 rows) | **KEEP** | Complete, authoritative 9-category taxonomy |
| `portfolio_subcategories` (57 rows) | **KEEP** | Granular subcategories aligned with taxonomy |
| `award_definitions` (15 rows) | **KEEP** | Complete 15 institutional award models |
| `award_criteria` (40 rows) | **KEEP / EXTEND** | Existing criteria structures can be mapped dynamically |
| `award_scoring_rules` & `award_portfolio_mappings` | **EXTEND** | Table structures exist; can be populated for fine-grained rule configuration |
| `student_award_evaluations` & `award_interview_eligibilities` | **KEEP** | Standardized evaluation & candidate persistence models |
| `AwardEvaluationService.php` | **KEEP / EXTEND** | Robust scoring engine with idempotency & basis snapshots |
| `OSADAwardsAndCriteriaPage.jsx` | **KEEP** | Clean UI representing 15 awards and criteria |
| `OSADAwardCandidateReviewPage.jsx` | **KEEP** | Stage 1 candidate review interface |

---

## 11. Gap Matrix & Risk Register (A24–A25)

| Domain | Current State | Target State | Gap | Risk Level |
|---|---|---|---|---|
| **Taxonomy** | 9 categories, 57 subcategories | 9 categories | None (100% matched) | Low |
| **Award Catalog** | 15 awards in DB & UI | 15 awards | None (100% matched) | Low |
| **Scoring Rules** | Domain heuristic + rule table | Configurable rule mappings | Can populate `award_portfolio_mappings` for advanced rules | Low |
| **Graduating Validation** | `graduating_only = 1` in schema | Dynamic graduation cohort filter | Ensure student profiles reflect graduating status | Low |
| **Candidate Review UI** | Mock data fallback available | Fully connected to backend API | Ensure live candidate evaluation sync | Low |

---

## 12. Database Mutation Confirmation (A31)

```text
Database DDL Queries Executed:  0
Database DML Queries Executed:  0
Database Tables Mutated:        0
Database Records Altered:       0
Read-Only Policy Maintained:    100% PASS
```

---

## 13. Final Phase A Gate Status

```text
PHASE A: PASS — CURRENT STATE PROVEN AND GAPS DOCUMENTED
```
