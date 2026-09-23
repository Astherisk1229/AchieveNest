# Phase 2 Deliverable: Complete Criteria & Scoring Component Matrix

**Document Identifier:** `docs/audits/osad-award-phase2-criteria-matrix.md`  
**Phase:** 2 of 8 (Authoritative Award Definitions, Eligibility Metadata & Rubric Seeding)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **CRITERIA & COMPONENT HIERARCHY LOCKED**

---

## 1. Summary of Criteria Structure by Award

| # | Award Code | Official Criteria Structure | Computability Breakdown | Computable Max |
|---|---|---|---|---:|
| 1 | `NOTRE_DAME_AWARD` | Scholastic (30), Leadership (20), Church (20), Citations (10), Character (20) | Leadership (20) + Church (20) + Citations (10) | **50.00 pts** |
| 2 | `SMC_AWARD` | Scholastic (20), Leadership (20), Community/Church (30), Citations (10), Character (20) | Leadership (20) + Community (30) + Citations (10) | **60.00 pts** |
| 3 | `LEADERSHIP_AWARD` | Scholastic (20), Leadership (30), Community (20), Character (20), Interview (10) | Leadership (30) + Community (20) | **50.00 pts** |
| 4 | `CAMPUS_JOURNALISM_AWARD` | Character (20), Quality of Publication (60), Leadership (10), Interview (10) | Verified Publication (60) + Leadership (10) | **70.00 pts** |
| 5 | `SPORTS_AWARD_FEMALE` | Academic (15), Skills/Attitude (40), Participation (20), Awards (15), Interview (10) | Skills (20) + Participation (20) + Awards (15) | **55.00 pts** |
| 6 | `SPORTS_AWARD_MALE` | Academic (15), Skills/Attitude (40), Participation (20), Awards (15), Interview (10) | Skills (20) + Participation (20) + Awards (15) | **55.00 pts** |
| 7 | `SOCIO_CULTURAL_AWARD_FEMALE` | Skills (20), Participation (20), Awards (15) | Skills (20) + Participation (20) + Awards (15) | **55.00 pts** |
| 8 | `SOCIO_CULTURAL_AWARD_MALE` | Skills (20), Participation (20), Awards (15) | Skills (20) + Participation (20) + Awards (15) | **55.00 pts** |
| 9 | `STUDENT_LEADER_OF_THE_YEAR` | Scholastic (15), Leadership (40), Community (10), Character (20), Interview (15) | Leadership (40) + Community (10) | **50.00 pts** |
| 10 | `MEMBER_OF_THE_YEAR` | Scholastic (15), Membership (30), Leadership (10), Character (20), Interview (15) | Membership (30) + Leadership (10) | **40.00 pts** |
| 11 | `VOLUNTEER_OF_THE_YEAR` | Scholastic (15), Volunteerism (40), Leadership (10), Character (20), Interview (15) | Volunteerism (40) + Leadership (10) | **50.00 pts** |
| 12 | `ATHLETE_OF_THE_YEAR_FEMALE` | Academic (15), Skills/Attitude (40), Participation (20), Awards (15), Interview (10) | Skills (20) + Participation (20) + Awards (15) | **55.00 pts** |
| 13 | `ATHLETE_OF_THE_YEAR_MALE` | Academic (15), Skills/Attitude (40), Participation (20), Awards (15), Interview (10) | Skills (20) + Participation (20) + Awards (15) | **55.00 pts** |
| 14 | `PERFORMER_OF_THE_YEAR_FEMALE` | Skills (20), Participation (20), Awards (15) | Skills (20) + Participation (20) + Awards (15) | **55.00 pts** |
| 15 | `PERFORMER_OF_THE_YEAR_MALE` | Skills (20), Participation (20), Awards (15) | Skills (20) + Participation (20) + Awards (15) | **55.00 pts** |

---

## 2. Detailed Component & Scoring Rule Inventory

### Award 1: Notre Dame Award (Computable: 50.00 Pts)
- **Leadership & Involvement (20 pts)**:
  - `A1. Leadership Involvement`: Max 10 pts. Rule: `HIGHEST_APPLICABLE_ONLY` (SSG 10, Collegiate 8, Club 6, Year-Level 4).
  - `A2. Awards/Citations/Seminars`: Max 10 pts. Rule: `ACCUMULATE_QUALIFIED_RECORDS` (Int/Nat Award 5, Local Citation 2, Seminar 2).
- **Church Activities (20 pts)**:
  - `B1. Church Ministry Involvement`: Max 10 pts. Rule: `COUNT_X_POINTS_PER_RECORD_CAPPED` (2 pts per involvement, 1=2, 2=4, 3=6, 4=8, 5+=10).
  - `B2. Initiated Church Activities`: Max 10 pts. Rule: `ACCUMULATE_QUALIFIED_RECORDS` (Initiator 5, Head 4, Facilitator 3, Organizer 2).
- **Non-Academic Citations (10 pts)**:
  - Max 10 pts. Rule: `COUNT_X_POINTS_PER_RECORD_CAPPED` (2 pts per citation, max 5 records).

### Award 4: Campus Journalism Award (Computable: 70.00 Pts)
- **Verified Publication Evidence (60 pts)**:
  - `News Item`: 2 pts/item, max 10 pts (5 items).
  - `Literary Work`: 2 pts/item, max 10 pts (5 items).
  - `Column`: 4 pts/item, max 20 pts (5 items).
  - `Editorial`: 4 pts/item, max 20 pts (5 items).
- **Leadership in Campus Journalism (10 pts)**:
  - `Leadership Involvement`: Officer (3 pts), Member/Staff (2 pts), max 5 pts.
  - `Awards & Recognitions`: Int/Nat (3 pts), Local (2 pts), max 5 pts. Seminars: 0 pts (supporting evidence only).

### Awards 5, 6, 12, 13: Sports Performance & Athlete of the Year (Computable: 55.00 Pts)
- **Skills Evidence (20 pts)**: Individual (10 pts max) + Team Sports (10 pts max).
- **Participation (20 pts)**: PRISAA Nat (7), PRISAA Reg (5), PRISAA Local (2), NDEA (4), INTRAMS (2).
- **Awards (15 pts)**: Gold/Silver/Bronze matrix across National (7/5/3), Regional (5/3/2), Local (3/2/1), NDEA (4/4/2), Intrams (2/1/1). Cap: 15 pts.

### Awards 7, 8, 14, 15: Socio-Cultural & Performer of the Year (Computable: 55.00 Pts)
- **Skills Evidence (20 pts)**: Individual Performance (10 pts max) + Ensemble (10 pts max).
- **Participation (20 pts)**: PRISAA Nat (7), PRISAA Reg (5), PRISAA Local (2), NDEA (4), University (2).
- **Awards (15 pts)**: Champion/Gold (7/5/3/4/2), Silver (5/3/2/3/1), Bronze (3/2/1/2/1). Cap: 15 pts.
