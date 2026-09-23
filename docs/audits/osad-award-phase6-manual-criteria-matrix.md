# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Phase 6: 15-Award Manual & Non-Computable Criteria Matrix

> **Document:** `osad-award-phase6-manual-criteria-matrix.md`  
> **Phase:** 6 of 8  
> **Scope:** All 15 Authoritative Awards  
> **Status:** AUDITED & VERIFIED  

---

## 1. 15-Award Criterion Computability Classification

| Award Code | Award Name | Computed Criteria (Pts) | Manual / Panel Criteria (Pts) | Official Total |
|---|---|---|---|---|
| `NOTRE_DAME_AWARD` | Notre Dame Award | Leadership (20), Church (20), Citations (10) = **50** | Scholastic (30), Character (20) = **50** | 100.00 pts |
| `SMC_AWARD` | Saint Marcellin Champagnat Award | Leadership (20), Community (30), Citations (10) = **60** | Scholastic (20), Character (20) = **40** | 100.00 pts |
| `LEADERSHIP_AWARD` | Leadership Award | Leadership (30), Community (20) = **50** | Scholastic (20), Character (20), Interview (10) = **50** | 100.00 pts |
| `CAMPUS_JOURNALISM_AWARD` | Campus Journalism Award | Publication Quality (60), Leadership (10) = **70** | Character (20), Interview (10) = **30** | 100.00 pts |
| `SPORTS_AWARD_FEMALE` | Sports Performance Award (Female) | Skills (20), Participation (20), Awards (15) = **55** | Academic (15), Attitude (20), Interview (10) = **45** | 100.00 pts |
| `SPORTS_AWARD_MALE` | Sports Performance Award (Male) | Skills (20), Participation (20), Awards (15) = **55** | Academic (15), Attitude (20), Interview (10) = **45** | 100.00 pts |
| `SOCIO_CULTURAL_AWARD_FEMALE` | Socio-Cultural Performance (Female) | Skills (20), Participation (20), Awards (15) = **55** | Proposed Portfolio Model | 55.00 pts |
| `SOCIO_CULTURAL_AWARD_MALE` | Socio-Cultural Performance (Male) | Skills (20), Participation (20), Awards (15) = **55** | Proposed Portfolio Model | 55.00 pts |
| `STUDENT_LEADER_OF_THE_YEAR` | Student Leader of the Year | Leadership (40), Community (10) = **50** | Scholastic (20), Character (20), Interview (10) = **50** | 100.00 pts |
| `MEMBER_OF_THE_YEAR` | Outstanding Member of the Year | Membership (30), Leadership (10) = **40** | None (100% Portfolio Computed) | 40.00 pts |
| `VOLUNTEER_OF_THE_YEAR` | Outstanding Volunteer of the Year | Volunteerism (40), Leadership (10) = **50** | None (100% Portfolio Computed) | 50.00 pts |
| `ATHLETE_OF_THE_YEAR_FEMALE` | Athlete of the Year (Female) | Skills (20), Participation (20), Awards (15) = **55** | Academic (15), Attitude (20), Interview (10) = **45** | 100.00 pts |
| `ATHLETE_OF_THE_YEAR_MALE` | Athlete of the Year (Male) | Skills (20), Participation (20), Awards (15) = **55** | Academic (15), Attitude (20), Interview (10) = **45** | 100.00 pts |
| `PERFORMER_OF_THE_YEAR_FEMALE` | Performer of the Year (Female) | Skills (20), Participation (20), Awards (15) = **55** | Proposed Portfolio Model | 55.00 pts |
| `PERFORMER_OF_THE_YEAR_MALE` | Performer of the Year (Male) | Skills (20), Participation (20), Awards (15) = **55** | Proposed Portfolio Model | 55.00 pts |

---

## 2. Manual Score Validation Rules

1. **Non-Negativity**: $score \ge 0.00$.
2. **Ceiling Invariance**: $score \le official\_max\_points$.
3. **Immutability of Computable Criteria**: Any attempt to submit a manual score for an automated criterion ($is\_portfolio\_computable = 1$) is rejected with HTTP `422 Unprocessable Entity`.
4. **Finalization Gate**: `Finalize Evaluation` requires that every configured non-computable criterion has a non-null, reviewed score.
