# Phase B — Domain, Terminology & Governance Reconciliation Report

> **Executive Scope:** Formal governance contract, terminology freeze, rule-authority taxonomy, lifecycle ownership, decision boundaries, and Phase C schema contract for the **OSAD Awards & Scoring Criteria** subsystem within AchieveNest.

---

## 1. Executive Summary

Phase B reconciles the factual findings from the Phase A audit into an approved governance contract. It formally establishes that:
1. **Domain Boundary Separation**: The Student Portfolio Domain (what achievements a student submitted and had verified) remains strictly decoupled from the OSAD Award Configuration Domain (how portfolio evidence is mapped and scored for specific awards). Students do not choose awards during upload.
2. **Terminology Freeze**: Standardizes user-facing and conceptual terminology: *Awards & Scoring Criteria*, *Award*, *Award Criterion*, *Criterion Component*, *Evidence Mapping Rule*, *Scoring Rule*, *Portfolio Raw Score*, *Portfolio Potential Score*, *Potential Candidate*, and *Portfolio-Based Award Evaluation Summary*.
3. **Rule Authority Taxonomy**: Categorizes all rules into `OFFICIAL`, `SYSTEM_OPERATIONALIZATION`, and `PROPOSED` to preserve institutional provenance and transparency.
4. **Candidate Qualification vs. Official Passing Score**: The 80.00% potential score threshold is strictly an automated **Candidate-Generation Threshold** for qualifying a student as a *Potential Candidate / Eligible for Interview*, not the final institutional award passing mark.
5. **Candidate Pathways**: The system supports two distinct candidate intake pathways that converge into the OSAD Candidate Review Queue:
   - **Automated Portfolio Pathway** ($\text{Portfolio Potential Score} \ge 80.00\%$).
   - **Dean Nomination Pathway** (Direct Dean nomination without synthetic point injection).
6. **Zero Database Mutation**: Phase B is non-destructive and records policy decisions without altering schema or data.

---

## 2. Phase A Baseline Evidence Freeze

```text
Branch:                  audit/project-architecture-linkage
HEAD SHA:                ea987bf32c208cc99ebe1a60b989c0c09ca83e98
Database:                achievenest_local (MySQL 8.4.7 on Port 3306)
Database Tables:         57
Active User Profiles:    56 (41 Students, 15 Personnel)
Institutional Colleges:  5 (CET, CBA, CAS, CED, CHS)
Academic Programs:       14
Portfolio Categories:    9
Portfolio Subcategories: 57
Award Definitions:       15
Award Criteria:          40
Award Cycles:            1 (AY 2025-2026)
Phase A DB Mutations:    0
Phase A Gate Status:     PASS
```

---

## 3. Terminology Reconciliation Matrix

| Concept | Current Code/DB Term | Current UI Term | Domain-Approved Term | Final Status | Decision Source |
|---|---|---|---|---|---|
| **Subsystem Module** | `osad/awards` | Awards & Criteria | **Awards & Scoring Criteria** | **FROZEN** | OSAD Domain |
| **Award Entity** | `award_definitions` | Award | **Award** | **FROZEN** | Institutional Policy |
| **Major Scoring Section** | `award_criteria` | Criteria | **Award Criterion** | **FROZEN** | Master Scoring Manual |
| **Nested Scoring Section** | `award_scoring_rules` | Subcriteria | **Criterion Component** | **FROZEN** | Master Scoring Manual |
| **Evidence Routing** | `award_portfolio_mappings` | Mapping | **Evidence Mapping Rule** | **FROZEN** | Domain Architecture |
| **Scoring Logic** | `AwardEvaluationService` | Scoring | **Scoring Rule** | **FROZEN** | Domain Architecture |
| **Computed Total Points** | `raw_score` | Total Points | **Portfolio Raw Score** | **FROZEN** | Scoring Manual |
| **Normalized Score (%)** | `potential_score` | Potential Score | **Portfolio Potential Score** | **FROZEN** | Scoring Manual |
| **Generated Candidate** | `qualifies_portfolio_based` | Potential Candidate | **Potential Candidate** | **FROZEN** | Master Scoring Manual |
| **Generated Summary** | `report_payload` | Candidate Summary | **Portfolio-Based Award Evaluation Summary** | **FROZEN** | OSAD Domain |
| **Non-Computable Criteria** | N/A | Excluded | **Not Automatically Evaluated** | **FROZEN** | Institutional Rubrics |

---

## 4. Award Definition Authority Classification (15 Awards)

| # | Award Code | Award Name | Canonical Source | Rubric Authority Model | Notes |
|---|---|---|---|---|---|
| 1 | `ACADEMIC_EXCELLENCE` | Academic Excellence Award | NDMU Student Handbook / OSAD | `OFFICIAL` | Academic honors & verified academic competitions |
| 2 | `DEANS_MEDAL_OF_DISTINCTION` | Dean Medal of Distinction | College Dean / OSAD Policy | `OFFICIAL` | Collegiate academic & leadership merit |
| 3 | `LOYALTY_AWARD` | Institutional Loyalty Award | Institutional Tradition | `SYSTEM_OPERATIONALIZATION` | Continuous Marist residency & campus presence |
| 4 | `MOST_OUTSTANDING_STUDENT` | Most Outstanding Student Award | Master Scoring Manual Form A | `OFFICIAL` | Holistic leadership, service & development |
| 5 | `OUTSTANDING_ATHLETE_FEMALE` | Outstanding Athlete of the Year (Female) | Sports & Athletics Office / OSAD | `OFFICIAL` | Verified tournament placement & athletic skills |
| 6 | `OUTSTANDING_ATHLETE_MALE` | Outstanding Athlete of the Year (Male) | Sports & Athletics Office / OSAD | `OFFICIAL` | Verified tournament placement & athletic skills |
| 7 | `OUTSTANDING_CAMPUS_JOURNALISM` | Outstanding Campus Journalist Award | Student Publications / OSAD | `OFFICIAL` | Published articles & editorial leadership |
| 8 | `OUTSTANDING_CHURCH_MINISTRY` | Outstanding Campus Ministry Service Award | Campus Ministry Office / OSAD | `OFFICIAL` | Liturgical service & ministry initiatives |
| 9 | `OUTSTANDING_CO_CURRICULAR` | Outstanding Co-Curricular Organization Award | OSAD Club Governance | `OFFICIAL` | Program-affiliated club participation |
| 10 | `OUTSTANDING_COMMUNITY_SERVICE` | Outstanding Community Service Award | CESDO / Volunteerism Office | `OFFICIAL` | Community extension & outreach volunteerism |
| 11 | `OUTSTANDING_CULTURAL_ARTIST` | Outstanding Socio-Cultural Performing Artist | Socio-Cultural Office / OSAD | `OFFICIAL` | Performing arts showcases & cultural meets |
| 12 | `OUTSTANDING_EXTRA_CURRICULAR` | Outstanding Extra-Curricular Club Award | OSAD Club Governance | `OFFICIAL` | Non-academic interest club involvement |
| 13 | `OUTSTANDING_LEADERSHIP` | Outstanding Student Leader Award | Master Scoring Manual Form B | `OFFICIAL` | SSG / Council governance leadership |
| 14 | `PRESIDENTS_MEDAL_OF_EXCELLENCE` | President Medal of Excellence | President Office / OSAD | `OFFICIAL` | Supreme university governance & formation |
| 15 | `RESEARCH_AND_INNOVATION` | Research & Innovation Award | Research & Publication Office | `SYSTEM_OPERATIONALIZATION` | Research presentations, papers & patents |

---

## 5. Criteria Authority Classification (40 Criteria)

All 40 criteria configured in `award_criteria` are categorized under the authority model:

| Award Code | Criterion Code | Criterion Name | Max Points | Weight (%) | Authority Status |
|---|---|---|---|---|---|
| `ACADEMIC_EXCELLENCE` | `CRIT_ACAD_SCHOLASTIC` | Scholastic Honors & Awards | 50.00 | 50.00% | `OFFICIAL` |
| `ACADEMIC_EXCELLENCE` | `CRIT_ACAD_COMPETITION` | Academic Competitions & Seminars | 50.00 | 50.00% | `OFFICIAL` |
| `DEANS_MEDAL_OF_DISTINCTION` | `CRIT_DEAN_MERIT` | Collegiate Academic & Holistic Merit | 50.00 | 50.00% | `OFFICIAL` |
| `DEANS_MEDAL_OF_DISTINCTION` | `CRIT_DEAN_SERVICE` | Collegiate Leadership & Service | 50.00 | 50.00% | `OFFICIAL` |
| `LOYALTY_AWARD` | `CRIT_LOYAL_LEAD` | Leadership & Campus Presence | 20.00 | 33.33% | `SYSTEM_OPERATIONALIZATION` |
| `LOYALTY_AWARD` | `CRIT_LOYAL_COMM` | Community & Church Involvement | 30.00 | 50.00% | `SYSTEM_OPERATIONALIZATION` |
| `LOYALTY_AWARD` | `CRIT_LOYAL_RECOG` | Institutional Citations | 10.00 | 16.67% | `SYSTEM_OPERATIONALIZATION` |
| `MOST_OUTSTANDING_STUDENT` | `CRIT_LEADERSHIP` | Leadership and Governance | 35.00 | 35.00% | `OFFICIAL` |
| `MOST_OUTSTANDING_STUDENT` | `CRIT_COMMUNITY` | Community Service and Extension | 35.00 | 35.00% | `OFFICIAL` |
| `MOST_OUTSTANDING_STUDENT` | `CRIT_DEVELOPMENT` | Seminars and Professional Growth | 30.00 | 30.00% | `OFFICIAL` |
| `OUTSTANDING_ATHLETE_FEMALE` | `CRIT_SPORTS_SKILLS_F` | Sports Skills Evidence | 20.00 | 36.36% | `OFFICIAL` |
| `OUTSTANDING_ATHLETE_FEMALE` | `CRIT_SPORTS_MEETS_F` | Participation in Athletic Meets | 20.00 | 36.36% | `OFFICIAL` |
| `OUTSTANDING_ATHLETE_FEMALE` | `CRIT_SPORTS_AWARDS_F` | Sports Awards and Placements | 15.00 | 27.28% | `OFFICIAL` |
| `OUTSTANDING_ATHLETE_MALE` | `CRIT_SPORTS_SKILLS_M` | Sports Skills Evidence | 20.00 | 36.36% | `OFFICIAL` |
| `OUTSTANDING_ATHLETE_MALE` | `CRIT_SPORTS_MEETS_M` | Participation in Athletic Meets | 20.00 | 36.36% | `OFFICIAL` |
| `OUTSTANDING_ATHLETE_MALE` | `CRIT_SPORTS_AWARDS_M` | Sports Awards and Placements | 15.00 | 27.28% | `OFFICIAL` |
| `OUTSTANDING_CAMPUS_JOURNALISM` | `CRIT_JOURN_PUB` | Verified Publication Evidence | 60.00 | 85.71% | `OFFICIAL` |
| `OUTSTANDING_CAMPUS_JOURNALISM` | `CRIT_JOURN_LEAD` | Leadership in Campus Journalism | 10.00 | 14.29% | `OFFICIAL` |
| `OUTSTANDING_CHURCH_MINISTRY` | `CRIT_MINISTRY_INVOLVE` | Church Ministries Involvement | 15.00 | 37.50% | `OFFICIAL` |
| `OUTSTANDING_CHURCH_MINISTRY` | `CRIT_MINISTRY_INITIATE` | Initiated Ministry Activities | 15.00 | 37.50% | `OFFICIAL` |
| `OUTSTANDING_CHURCH_MINISTRY` | `CRIT_MINISTRY_LEAD` | Ministry Leadership & Citations | 10.00 | 25.00% | `OFFICIAL` |
| `OUTSTANDING_CO_CURRICULAR` | `CRIT_COCURR_MEM` | Membership Participation | 20.00 | 50.00% | `OFFICIAL` |
| `OUTSTANDING_CO_CURRICULAR` | `CRIT_COCURR_CONTRIB` | Important Org Contribution | 10.00 | 25.00% | `OFFICIAL` |
| `OUTSTANDING_CO_CURRICULAR` | `CRIT_COCURR_LEAD` | Org Leadership Involvement | 10.00 | 25.00% | `OFFICIAL` |
| `OUTSTANDING_COMMUNITY_SERVICE` | `CRIT_VOL_DIRECT` | Volunteerism: On and Off Campus | 40.00 | 80.00% | `OFFICIAL` |
| `OUTSTANDING_COMMUNITY_SERVICE` | `CRIT_VOL_LEAD` | Leadership in Service Initiatives | 10.00 | 20.00% | `OFFICIAL` |
| `OUTSTANDING_CULTURAL_ARTIST` | `CRIT_CULT_SKILLS` | Socio-Cultural Skills Evidence | 20.00 | 36.36% | `OFFICIAL` |
| `OUTSTANDING_CULTURAL_ARTIST` | `CRIT_CULT_MEETS` | Participation in Meets / Showcases | 20.00 | 36.36% | `OFFICIAL` |
| `OUTSTANDING_CULTURAL_ARTIST` | `CRIT_CULT_AWARDS` | Cultural Awards and Recognitions | 15.00 | 27.28% | `OFFICIAL` |
| `OUTSTANDING_EXTRA_CURRICULAR` | `CRIT_EXTR_MEM` | Club Membership Participation | 20.00 | 50.00% | `OFFICIAL` |
| `OUTSTANDING_EXTRA_CURRICULAR` | `CRIT_EXTR_CONTRIB` | Important Club Contribution | 10.00 | 25.00% | `OFFICIAL` |
| `OUTSTANDING_EXTRA_CURRICULAR` | `CRIT_EXTR_LEAD` | Club Leadership Involvement | 10.00 | 25.00% | `OFFICIAL` |
| `OUTSTANDING_LEADERSHIP` | `CRIT_LEAD_GOV` | Leadership: On and Off Campus | 40.00 | 80.00% | `OFFICIAL` |
| `OUTSTANDING_LEADERSHIP` | `CRIT_LEAD_COMM` | Community Involvement | 10.00 | 20.00% | `OFFICIAL` |
| `PRESIDENTS_MEDAL_OF_EXCELLENCE` | `CRIT_PRES_HOLISTIC` | Institutional Holistic Excellence | 40.00 | 40.00% | `OFFICIAL` |
| `PRESIDENTS_MEDAL_OF_EXCELLENCE` | `CRIT_PRES_LEAD` | Supreme University Governance | 30.00 | 30.00% | `OFFICIAL` |
| `PRESIDENTS_MEDAL_OF_EXCELLENCE` | `CRIT_PRES_SERVICE` | Community Outreach & Marist Formation | 30.00 | 30.00% | `OFFICIAL` |
| `RESEARCH_AND_INNOVATION` | `CRIT_RES_PUBLICATION` | Research Publications & Papers | 50.00 | 50.00% | `SYSTEM_OPERATIONALIZATION` |
| `RESEARCH_AND_INNOVATION` | `CRIT_RES_INNOVATION` | Innovations, Patents & Projects | 30.00 | 30.00% | `SYSTEM_OPERATIONALIZATION` |
| `RESEARCH_AND_INNOVATION` | `CRIT_RES_CONFERENCE` | Research Presentations | 20.00 | 20.00% | `SYSTEM_OPERATIONALIZATION` |

---

## 6. Rule Authority Model

```text
       ┌─────────────────────────────────────────────────────────────┐
       │                    RULE AUTHORITY MODEL                     │
       └─────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
     [ OFFICIAL ]        [ SYSTEM_OPERATIONALIZATION ]       [ PROPOSED ]
Direct institutional        Official rubric exists but       Working candidate
OSAD score form / rubric    lacks machine scoring detail.   generation model for
(e.g. Form A / Form B).     AchieveNest provides objective   institutional review.
                            verifiable point allocation.
```

- **Governance Ownership**: OSAD exclusively owns rule approval and publication.
- **Rule Immutability**: Rules tagged as `PROPOSED` must never be silently converted to `OFFICIAL` without authoritative OSAD sign-off.

---

## 7. 80.00% Candidate Threshold Governance

- **Policy Status**: The `candidate_threshold_percent = 80.00%` represents the **Automated Candidate-Generation Threshold**.
- **Scope & Hierarchy**:
  - Global Default: `80.00%`.
  - Stored per Award Definition in `award_definitions.candidate_threshold_percent`.
  - Supports Award-specific configuration if designated by institutional rubrics.
- **Semantic Invariant**:
  $$\text{Portfolio Potential Score} \ge \text{Threshold} \implies \text{Eligible for OSAD Interview / Panel Review}$$
  $$\text{Candidate Threshold} \neq \text{Official Award Passing Requirement}$$

---

## 8. Graduating-Only Eligibility Governance

- **Schema Field**: `award_definitions.graduating_only = 1`.
- **Policy Reconciliation**: Institutional graduation awards (e.g. Most Outstanding Student, Leadership Award, President's Medal) are awarded during Commencement / Araw ng Parangal and apply to graduating seniors.
- **Implementation Guidance**: Student profiles are verified against academic year cohort and graduation standing (`student_program_enrollments.is_graduating` or graduation cohort metadata). Non-graduating students remain visible for student portfolio development but are filtered from final candidate generation for graduating-only awards.

---

## 9. Gender-Specific Eligibility Governance

- **Awards Impacted**:
  - `OUTSTANDING_ATHLETE_FEMALE` (`gender_restriction = 'female'`)
  - `OUTSTANDING_ATHLETE_MALE` (`gender_restriction = 'male'`)
  - Socio-Cultural Artist gender divisions.
- **Authoritative Source**: `student_profiles.gender` or institutional SIS registrar records.
- **Governance Invariant**: If a gender-restricted award is evaluated, the scoring engine filters candidate inclusion by student profile gender. Students with unassigned gender are flagged for OSAD administrative review before candidate generation.

---

## 10. Dean Nomination Pathway Governance

- **Authoritative Pathway**: `dean_student_nominations` (`pathway = 'dean_nomination'`).
- **Policy Invariants**:
  1. Active College Deans can nominate students across any university college (cross-college nomination allowed).
  2. Nominations are discovery entries that bypass the automated 80.00% portfolio threshold.
  3. Dean nominations inject **zero synthetic points** (`potential_score IS NULL` or actual verified score preserved).
  4. The candidate review interface clearly badges the origin as `[Dean Nomination]` versus `[Automated Threshold]`.

---

## 11. Award Cycle & Criteria Versioning Governance

- **Award Cycle (`award_cycles`)**: Represents an active evaluation period (e.g. `AY 2025-2026 - 2nd Semester`).
- **Criteria Immutability**:
  - Published award criteria associated with an open cycle are **immutable in place**.
  - Adjusting point weights or adding criteria rules requires publishing a new scoring model version.
  - Closed cycles freeze all historical evaluations (`student_award_evaluations`), preserving reproducible audit trails.

---

## 12. Candidate Lifecycle State Machine

```text
[ EVALUATED ] ───────────────────────────────────────────┐
      │                                                  │
      ├─ (Potential Score < 80%) ──> [ BELOW_THRESHOLD ] │
      │                                                  │
      └─ (Potential Score ≥ 80%) ──> [ POTENTIAL_CANDIDATE ]
                                             │
   [ DEAN_NOMINATED ] ───────────────────────┤
                                             ▼
                                  [ UNDER_OSAD_REVIEW ]
                                             │
                        ┌────────────────────┴────────────────────┐
                        ▼                                         ▼
           [ ADVANCED_FOR_INTERVIEW ]                   [ NOT_ADVANCED ]
                        │
                        ▼
               [ OFFICIAL_AWARDEE ] (Conferred by OSAD / Academic Council)
```

---

## 13. Manual Override & Audit Policy

- OSAD Administrators may manually include or exclude candidates during Stage 1 review.
- **Mandatory Audit Trail**: Every override requires:
  - `actor_profile_id` (OSAD administrator UUID).
  - `action` (`manual_candidate_inclusion`, `manual_candidate_exclusion`, `decision_reversal`).
  - `justification` (non-empty mandatory reason).
  - `occurred_at` (UTC/local timestamp logged in `audit_logs`).

---

## 14. Non-Computable Criteria & Evaluation Summary Terminology

- **Non-Computable Criteria**: Official rubric criteria requiring human, panel, or scholastic evaluation (e.g. Panel Interview, Moral Character) are explicitly rendered as:
  $$\textbf{"Not Automatically Evaluated (Panel / Institutional Requirement)"}$$
- **Generated Output Artifact**: The authoritative summary sheet is formally designated as:
  $$\textbf{"Portfolio-Based Award Evaluation Summary"}$$

---

## 15. OSAD Governance & Role Permissions Matrix

| Action | OSAD Admin | Active Dean | Coordinator | Student | HR Admin |
|---|---|---|---|---|---|
| **View Award Catalog & Criteria** | Allowed | Allowed | Allowed | Allowed | Allowed |
| **Manage / Edit Award Definitions** | Allowed | Denied | Denied | Denied | Denied |
| **Execute Automated Evaluation** | Allowed | Denied | Denied | Denied | Denied |
| **View Candidate Review Queue** | Allowed | Scoped / Allowed | Scoped | Denied | Denied |
| **Submit Student Nomination** | Denied | Allowed | Denied | Denied | Denied |
| **Advance Candidate to Interview** | Allowed | Denied | Denied | Denied | Denied |
| **View Own Award Evaluation** | Allowed | Denied | Denied | Allowed (Self) | Denied |

---

## 16. Immutable Governance Principles

1. **Upload Independence**: Students do not select target awards when submitting achievements.
2. **Taxonomy Decoupling**: The 9 Portfolio Categories remain separate from the 15 Award models.
3. **Verified Evidence Invariant**: Only portfolio records with `status = 'verified'` contribute to scoring.
4. **Cross-Award Reusability**: A single verified achievement may contribute to multiple awards if eligible under their respective criteria.
5. **Single-Criterion Deduplication**: No single portfolio record can be counted twice towards the same criterion.
6. **Candidate vs. Awardee Distinction**: A *Potential Candidate* is not automatically an *Awardee*.
7. **Transparent Provenance**: Non-computable criteria are visibly marked, never defaulted to 0.
8. **Explainable Scoring**: Every awarded point links to an exact portfolio record basis snapshot.
9. **Authoritative Backend Protection**: All evaluations and nominations are enforced at the API layer.
10. **Zero Silent Overrides**: All manual administrative actions are permanently logged in `audit_logs`.

---

## 17. Unresolved Decision Register

| ID | Decision Item | Classification | Resolution / Blocking Phase |
|---|---|---|---|
| **B-001** | Are all 15 awards graduating-only? | `B-SOURCE` | Graduating default preserved; schema allows per-award boolean. |
| **B-002** | Can Dean nomination bypass 80%? | `B-OSAD` | Resolved: Yes, Dean nomination is a direct discovery pathway. |
| **B-003** | Are published criteria immutable? | `B-POLICY` | Resolved: Yes, scoring changes require new versioning. |
| **B-004** | Final generated summary title | `B-OSAD` | Resolved: "Portfolio-Based Award Evaluation Summary". |

---

## 18. Phase C Schema Contract Handoff

Phase C shall design and reconcile the schema to support:
- **`award_definitions`**: Permanent master catalog (15 awards) with category, threshold, and constraints.
- **`award_cycles`**: Evaluation cycles with active date bounds and academic year linkage.
- **`award_criteria`**: Normalized criteria with sort order, weights, and max points.
- **`award_scoring_rules` & `award_portfolio_mappings`**: Configurable many-to-many rule mappings for granular subcategory matching.
- **`student_award_evaluations` & `student_award_criterion_scores`**: Idempotent scoring persistence with basis snapshots.
- **`award_interview_eligibilities`**: Dual-pathway candidate records (`automated_threshold` vs `dean_nomination`).

---

## 19. Database Mutation Confirmation

```text
Database DDL Queries Executed:  0
Database DML Queries Executed:  0
Database Tables Mutated:        0
Database Records Altered:       0
Read-Only Policy Maintained:    100% PASS
```

---

## 20. Final Phase B Gate Status

```text
PHASE B: PASS — TERMINOLOGY AND GOVERNANCE FROZEN
```
