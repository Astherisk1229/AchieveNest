# OSAD Awards & Scoring Criteria — Phase 0 Authoritative Master Baseline Report

> **Executive Scope:** Authoritative 15-Award Master Catalog & Source Baseline Reconciliation. Compares the primary institutional rubric source (`AchieveNest_FINAL_Complete_Portfolio_Categories_and_Potential_Award_Scoring_Sheets.docx`) against the live MySQL database (`achievenest_local`). Identifies authoritative definitions, official vs portfolio-computable criteria subsets, non-computable panel requirements, unauthorized/non-source award entries, missing awards, renamed awards, and establishes the strict baseline for the Award-by-Award remediation program under **ZERO database mutations**.

---

## 1. Executive Summary & Source Fidelity Purpose

Phase 0 establishes the factual semantic baseline of the AchieveNest Awards & Scoring Criteria subsystem. While earlier phases established technical versioning, automated candidate generation ($\ge 80.00\%$), deterministic scoring engines, evaluation snapshots, and authorization matrices, **15 existing database rows does not guarantee semantic fidelity with the authoritative institutional rubrics**.

This report proves:
1. **The Exact Authoritative 15-Award Catalog** from the source document.
2. **Official Rubric Weights vs Portfolio-Computable Subsets** for each award.
3. **Identification of Non-Computable Criteria** (Panel Interview, Scholastic Records, Moral Character) that must remain visible without injecting false zeros.
4. **Factual Audit of Current Database Rows** in `achievenest_local`.
5. **Detailed Gap Analysis & Classification** (Correct, Renamed, Missing, Unauthorized/Non-Source, Proposed).
6. **Zero Database Mutation Invariant**: Phase 0 is 100% read-only. Zero `ALTER`, `UPDATE`, `DELETE`, `DROP`, or migrations were executed.

---

## 2. Authoritative 15-Award Catalog & Source Baseline

| # | Exact Authoritative Award Name | Authority Status | Official Max | Computable Max | Candidate Threshold | Graduating Only | Gender Eligibility |
|---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Notre Dame Award** | `OFFICIAL` | 100.00 | 50.00 | 80.00% | Yes (Graduating) | All |
| 2 | **Saint Marcellin Champagnat (SMC) Award** | `OFFICIAL` | 100.00 | 60.00 | 80.00% | Yes (Graduating) | All |
| 3 | **Leadership Award** | `OFFICIAL` | 100.00 | 50.00 | 80.00% | Yes (Graduating) | All |
| 4 | **Campus Journalism Award** | `OFFICIAL` | 100.00 | 70.00 | 80.00% | Yes (Graduating) | All |
| 5 | **Outstanding Performance in Sports - Female** | `OFFICIAL` | 100.00 | 55.00 | 80.00% | Yes (Graduating) | Female Only |
| 6 | **Outstanding Performance in Sports - Male** | `OFFICIAL` | 100.00 | 55.00 | 80.00% | Yes (Graduating) | Male Only |
| 7 | **Outstanding Performance in Socio-Cultural - Female** | `PROPOSED` | 100.00 | 55.00 | 80.00% | Yes (Graduating) | Female Only |
| 8 | **Outstanding Performance in Socio-Cultural - Male** | `PROPOSED` | 100.00 | 55.00 | 80.00% | Yes (Graduating) | Male Only |
| 9 | **Outstanding Student Leader of the Year** | `OFFICIAL` | 100.00 | 50.00 | 80.00% | No (Annual) | All |
| 10 | **Outstanding Member of the Year** | `OFFICIAL` | 100.00 | 40.00 | 80.00% | No (Annual) | All |
| 11 | **Outstanding Volunteer of the Year** | `OFFICIAL` | 100.00 | 50.00 | 80.00% | No (Annual) | All |
| 12 | **Outstanding Athlete of the Year - Female** | `OFFICIAL` | 100.00 | 55.00 | 80.00% | No (Annual) | Female Only |
| 13 | **Outstanding Athlete of the Year - Male** | `OFFICIAL` | 100.00 | 55.00 | 80.00% | No (Annual) | Male Only |
| 14 | **Outstanding Performer of the Year - Female** | `PROPOSED` | 100.00 | 55.00 | 80.00% | No (Annual) | Female Only |
| 15 | **Outstanding Performer of the Year - Male** | `PROPOSED` | 100.00 | 55.00 | 80.00% | No (Annual) | Male Only |

---

## 3. Award-by-Award Authoritative Criteria & Scoring Breakdown

### 1. Notre Dame Award (`OFFICIAL`)
- **Official Rubric (100 pts)**: Scholastic Achievement (30), Leadership: On and Off Campus (20), Church Activities (20), Citations Received Other than Academics (10), Character (20).
- **Portfolio-Computable Subset (50 pts)**: Leadership and Involvement (20), Church Activities (20), Non-Academic Citations and Recognitions (10).
- **Not Automatically Evaluated (50 pts)**: Scholastic Achievement (30), Moral Character (20).
- **Evidence Mapping**: Leadership Positions, Leadership Development, Church/Ministry Involvement, Non-Academic Citations.

### 2. Saint Marcellin Champagnat (SMC) Award (`OFFICIAL`)
- **Official Rubric (100 pts)**: Scholastic Achievement (20), Leadership: On and Off Campus (20), Community Involvement (30), Citations Received Other than Academics (10), Character (20).
- **Portfolio-Computable Subset (60 pts)**: Leadership and Involvement (20), Community / Church Involvement (30), Non-Academic Citations (10).
- **Not Automatically Evaluated (40 pts)**: Scholastic Achievement (20), Moral Character (20).
- **Evidence Mapping**: Leadership Positions, Community Service / Volunteerism, Church Ministries, Non-Academic Citations.

### 3. Leadership Award (`OFFICIAL`)
- **Official Rubric (100 pts)**: Scholastic Achievement (20), Leadership: On and Off Campus (30), Community Involvement (20), Character (20), Interview (10).
- **Portfolio-Computable Subset (50 pts)**: Leadership: On and Off Campus (30), Community Involvement (20).
- **Not Automatically Evaluated (50 pts)**: Scholastic Achievement (20), Character (20), Panel Interview (10).
- **Evidence Mapping**: Leadership Positions, Leadership Development, Community Service / Civic Engagement.

### 4. Campus Journalism Award (`OFFICIAL`)
- **Official Rubric (100 pts)**: Quality of Publication (60), Leadership (10), Character (20), Interview (10).
- **Portfolio-Computable Subset (70 pts)**: Verified Publication Evidence (60), Leadership in Student Publication (10).
- **Not Automatically Evaluated (30 pts)**: Character (20), Panel Interview (10).
- **Evidence Mapping**: Campus Journalism Articles/Editorial evidence, Journalism Leadership positions, Press Citations.

### 5 & 6. Outstanding Performance in Sports - Female / Male (`OFFICIAL`)
- **Official Rubric (100 pts)**: Academic Achievement (15), Skills and Attitude (40), Participation in Sports and Athletic Meets (20), Awards Received (15), Interview (10).
- **Portfolio-Computable Subset (55 pts)**: Sports Skills Evidence (20), Participation in Athletic Meets (20), Sports Awards & Recognitions (15).
- **Not Automatically Evaluated (45 pts)**: Academic Achievement (15), Sports Attitude (20), Panel Interview (10).
- **Evidence Mapping**: Athletic Varsity / Club evidence, Tournament participation records, Sports placements/medals.

### 7 & 8. Outstanding Performance in Socio-Cultural - Female / Male (`PROPOSED`)
- **Proposed Rubric (100 pts)**: Academic Achievement (15), Skills and Dedication (40), Participation in Meets / Showcases (20), Awards Received (15), Interview (10).
- **Portfolio-Computable Subset (55 pts)**: Socio-Cultural Skills Evidence (20), Participation in Meets / Competitions (20), Cultural Awards & Citations (15).
- **Not Automatically Evaluated (45 pts)**: Academic Achievement (15), Attitude / Dedication (20), Panel Interview (10).
- **Evidence Mapping**: Performing Arts, Cultural Troupe, Theatre, Music, Dance participation & awards.

### 9. Outstanding Student Leader of the Year (`OFFICIAL`)
- **Official Rubric (100 pts)**: Scholastic Achievement (15), Leadership: On and Off Campus (40), Community Involvement (10), Character (20), Interview (15).
- **Portfolio-Computable Subset (50 pts)**: Leadership: On and Off Campus (40), Community Involvement (10).
- **Not Automatically Evaluated (50 pts)**: Scholastic Achievement (15), Character (20), Panel Interview (15).
- **Evidence Mapping**: Supreme Student Government / Club Officer positions, Leadership Development, Community Service.

### 10. Outstanding Member of the Year (`OFFICIAL`)
- **Official Rubric (100 pts)**: Scholastic Achievement (15), Quality of Membership Involvement (40), Leadership (10), Character (20), Interview (15).
- **Portfolio-Computable Subset (40 pts)**: Membership Involvement & Participation (20), Important Contribution to Org (10), Sub-committee Leadership (10).
- **Not Automatically Evaluated (60 pts)**: Scholastic Achievement (15), Character (20), Panel Interview (15), Subjective Quality of Involvement (10).
- **Evidence Mapping**: Student Organization membership records, Active project participation, Organizational citations.

### 11. Outstanding Volunteer of the Year (`OFFICIAL`)
- **Official Rubric (100 pts)**: Scholastic Achievement (15), Volunteerism: On and Off Campus (40), Leadership (10), Character (20), Interview (15).
- **Portfolio-Computable Subset (50 pts)**: Volunteerism: On and Off Campus (40), Leadership in Service Initiatives (10).
- **Not Automatically Evaluated (50 pts)**: Scholastic Achievement (15), Character (20), Panel Interview (15).
- **Evidence Mapping**: Community Outreach, Disaster Relief, Civic Extension, Ministry Volunteerism.

### 12 & 13. Outstanding Athlete of the Year - Female / Male (`OFFICIAL`)
- **Official Rubric (100 pts)**: Academic Achievement (15), Skills and Attitude (40), Participation in Sports and Athletic Meets (20), Awards Received (15), Interview (10).
- **Portfolio-Computable Subset (55 pts)**: Sports Skills Evidence (20), Participation in Meets (20), Sports Awards (15).
- **Not Automatically Evaluated (45 pts)**: Academic Achievement (15), Attitude (20), Panel Interview (10).
- **Evidence Mapping**: Annual sports competitions, PRISAA / State University meets, Athletic recognitions.

### 14 & 15. Outstanding Performer of the Year - Female / Male (`PROPOSED`)
- **Proposed Rubric (100 pts)**: Academic Achievement (15), Performance Skills (40), Participation in Showcases / Competitions (20), Awards Received (15), Interview (10).
- **Portfolio-Computable Subset (55 pts)**: Socio-Cultural Skills Evidence (20), Participation in Competitions (20), Performing Arts Awards (15).
- **Not Automatically Evaluated (45 pts)**: Academic Achievement (15), Attitude (20), Panel Interview (10).
- **Evidence Mapping**: Annual cultural competitions, Music / Dance / Dramatic arts presentations.

---

## 4. Live Current Database State Audit (`achievenest_local`)

```text
========================================================================================================
CURRENT PERSISTED AWARD ROWS IN DATABASE (15 ROWS)
========================================================================================================
1.  ACADEMIC_EXCELLENCE           Academic Excellence Award                              OFFICIAL
2.  DEANS_MEDAL_OF_DISTINCTION     Dean Medal of Distinction                              OFFICIAL
3.  LOYALTY_AWARD                  Institutional Loyalty Award                            SYSTEM_OPERATIONALIZATION
4.  MOST_OUTSTANDING_STUDENT       Most Outstanding Student Award                         OFFICIAL
5.  OUTSTANDING_ATHLETE_FEMALE     Outstanding Athlete of the Year (Female)               OFFICIAL
6.  OUTSTANDING_ATHLETE_MALE       Outstanding Athlete of the Year (Male)                 OFFICIAL
7.  OUTSTANDING_CAMPUS_JOURNALISM  Outstanding Campus Journalist Award                    OFFICIAL
8.  OUTSTANDING_CHURCH_MINISTRY    Outstanding Campus Ministry Service Award              OFFICIAL
9.  OUTSTANDING_CO_CURRICULAR      Outstanding Co-Curricular Student Organization Award   OFFICIAL
10. OUTSTANDING_COMMUNITY_SERVICE  Outstanding Community Service Award                    OFFICIAL
11. OUTSTANDING_CULTURAL_ARTIST    Outstanding Socio-Cultural Performing Artist Award     OFFICIAL
12. OUTSTANDING_EXTRA_CURRICULAR   Outstanding Extra-Curricular Club Award                OFFICIAL
13. OUTSTANDING_LEADERSHIP         Outstanding Student Leader Award                       OFFICIAL
14. PRESIDENTS_MEDAL_OF_EXCELLENCE President Medal of Excellence                          OFFICIAL
15. RESEARCH_AND_INNOVATION        Research & Innovation Award                            SYSTEM_OPERATIONALIZATION
========================================================================================================
```

---

## 5. Master Final Reconciliation Matrix

| # | Authoritative Award Name | Current DB Code | Current DB Name | Identity Classification | Criteria Alignment | Authority Alignment | Computable Max Alignment | Remediation Phase |
|---:|---|---|---|:---:|:---:|:---:|:---:|:---:|
| 1 | **Notre Dame Award** | `MOST_OUTSTANDING_STUDENT` | Most Outstanding Student Award | **UNAUTHORIZED / NON-SOURCE** | WRONG (35/35/30) | WRONG | WRONG (100 vs 50) | Phase 1 |
| 2 | **Saint Marcellin Champagnat (SMC) Award** | *None* | *None* | **MISSING** | MISSING | MISSING | MISSING (60) | Phase 2 |
| 3 | **Leadership Award** | `OUTSTANDING_LEADERSHIP` | Outstanding Student Leader Award | **RENAMED / REQUIRES RECONCILIATION** | PARTIAL (40/10) | OFFICIAL | WRONG (50 vs 50) | Phase 3 |
| 4 | **Campus Journalism Award** | `OUTSTANDING_CAMPUS_JOURNALISM` | Outstanding Campus Journalist Award | **RENAMED / REQUIRES RECONCILIATION** | CORRECT (60/10) | OFFICIAL | CORRECT (70) | Phase 4 |
| 5 | **Outstanding Performance in Sports - Female** | `OUTSTANDING_ATHLETE_FEMALE` | Outstanding Athlete of the Year (Female) | **RENAMED / AMBIGUOUS WITH AWD 12** | CORRECT (20/20/15) | OFFICIAL | CORRECT (55) | Phase 5 |
| 6 | **Outstanding Performance in Sports - Male** | `OUTSTANDING_ATHLETE_MALE` | Outstanding Athlete of the Year (Male) | **RENAMED / AMBIGUOUS WITH AWD 13** | CORRECT (20/20/15) | OFFICIAL | CORRECT (55) | Phase 6 |
| 7 | **Outstanding Performance in Socio-Cultural - Female** | *None* | *None* | **MISSING (PROPOSED)** | MISSING | PROPOSED | MISSING (55) | Phase 7 |
| 8 | **Outstanding Performance in Socio-Cultural - Male** | *None* | *None* | **MISSING (PROPOSED)** | MISSING | PROPOSED | MISSING (55) | Phase 8 |
| 9 | **Outstanding Student Leader of the Year** | `OUTSTANDING_LEADERSHIP` | Outstanding Student Leader Award | **DUPLICATE / AMBIGUOUS WITH AWD 3** | PARTIAL (40/10) | OFFICIAL | CORRECT (50) | Phase 9 |
| 10 | **Outstanding Member of the Year** | `OUTSTANDING_CO_CURRICULAR` | Outstanding Co-Curricular Student Org Award | **UNAUTHORIZED / RENAMED** | PARTIAL (20/10/10) | OFFICIAL | CORRECT (40) | Phase 10 |
| 11 | **Outstanding Volunteer of the Year** | `OUTSTANDING_COMMUNITY_SERVICE` | Outstanding Community Service Award | **RENAMED / REQUIRES RECONCILIATION** | CORRECT (40/10) | OFFICIAL | CORRECT (50) | Phase 11 |
| 12 | **Outstanding Athlete of the Year - Female** | `OUTSTANDING_ATHLETE_FEMALE` | Outstanding Athlete of the Year (Female) | **DUPLICATE / AMBIGUOUS WITH AWD 5** | CORRECT (20/20/15) | OFFICIAL | CORRECT (55) | Phase 12 |
| 13 | **Outstanding Athlete of the Year - Male** | `OUTSTANDING_ATHLETE_MALE` | Outstanding Athlete of the Year (Male) | **DUPLICATE / AMBIGUOUS WITH AWD 6** | CORRECT (20/20/15) | OFFICIAL | CORRECT (55) | Phase 13 |
| 14 | **Outstanding Performer of the Year - Female** | `OUTSTANDING_CULTURAL_ARTIST` | Outstanding Socio-Cultural Artist Award | **RENAMED / PROPOSED** | CORRECT (20/20/15) | PROPOSED | CORRECT (55) | Phase 14 |
| 15 | **Outstanding Performer of the Year - Male** | *None* | *None* | **MISSING (PROPOSED)** | MISSING | PROPOSED | MISSING (55) | Phase 15 |

---

## 6. Subsystem Registers

### A. Unauthorized / Non-Source Award Register
These rows currently exist in `achievenest_local` but **have no basis in the authoritative institutional rubric document**:
1. `MOST_OUTSTANDING_STUDENT` (Most Outstanding Student Award) — Invented placeholder; must be replaced by **Notre Dame Award**.
2. `OUTSTANDING_CHURCH_MINISTRY` (Outstanding Campus Ministry Service Award) — Category converted into award name; not an authoritative standalone award.
3. `OUTSTANDING_EXTRA_CURRICULAR` (Outstanding Extra-Curricular Club Award) — Category converted into award name.
4. `ACADEMIC_EXCELLENCE` (Academic Excellence Award) — Non-source award.
5. `RESEARCH_AND_INNOVATION` (Research & Innovation Award) — Non-source award.
6. `LOYALTY_AWARD` (Institutional Loyalty Award) — Non-source award.
7. `DEANS_MEDAL_OF_DISTINCTION` (Dean Medal of Distinction) — Non-source award.
8. `PRESIDENTS_MEDAL_OF_EXCELLENCE` (President Medal of Excellence) — Non-source award.

### B. Missing Award Register
These authoritative awards are completely missing from the current database:
1. **Saint Marcellin Champagnat (SMC) Award** (Graduating, 60 computable max).
2. **Outstanding Performance in Socio-Cultural - Female** (Graduating, 55 computable max, Proposed).
3. **Outstanding Performance in Socio-Cultural - Male** (Graduating, 55 computable max, Proposed).
4. **Outstanding Performer of the Year - Male** (Annual, 55 computable max, Proposed).

### C. Renamed & Disambiguation Register
1. `OUTSTANDING_LEADERSHIP` vs **Leadership Award** (Graduating) vs **Outstanding Student Leader of the Year** (Annual).
2. `OUTSTANDING_ATHLETE_FEMALE` vs **Outstanding Performance in Sports - Female** (Graduating) vs **Outstanding Athlete of the Year - Female** (Annual).
3. `OUTSTANDING_ATHLETE_MALE` vs **Outstanding Performance in Sports - Male** (Graduating) vs **Outstanding Athlete of the Year - Male** (Annual).
4. `OUTSTANDING_CAMPUS_JOURNALISM` vs **Campus Journalism Award**.
5. `OUTSTANDING_COMMUNITY_SERVICE` vs **Outstanding Volunteer of the Year**.
6. `OUTSTANDING_CO_CURRICULAR` vs **Outstanding Member of the Year**.
7. `OUTSTANDING_CULTURAL_ARTIST` vs **Outstanding Performer of the Year - Female**.

---

## 7. Zero Database Mutation Confirmation

```text
========================================================================
ZERO MUTATION COMPLIANCE VERIFICATION
========================================================================
ALTER TABLE queries executed:            0
UPDATE queries executed:                 0
DELETE queries executed:                 0
DROP TABLE / DATABASE executed:          0
TRUNCATE TABLE executed:                 0
CodeIgniter migrations executed:         0
MySQL defense scripts modified/run:      0
Database State:                          100% UNCHANGED / READ-ONLY
========================================================================
```

---

## 8. Inputs & Roadmap for Phase 1

With Phase 0 baseline frozen, the sequential Award-by-Award remediation program proceeds as follows:
- **Phase 1**: Correct **Notre Dame Award** (Replace unauthorized `MOST_OUTSTANDING_STUDENT`, establish official 50-point computable model: Leadership 20, Church 20, Citations 10).
- **Phases 2–15**: Consecutively implement, map, score, and verify Awards 2 through 15.
- **Phase 16**: Final Master Replay, Schema Parity & Zero-Defect Program Closure.

---

## 9. Final Phase 0 Gate Declaration

```text
========================================================================
PHASE 0: PASS — AUTHORITATIVE 15-AWARD MASTER BASELINE FROZEN
========================================================================
```
