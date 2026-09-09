# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Phase 7: 15-Award Normalization & Threshold Matrix

> **Document:** `osad-award-phase7-threshold-matrix.md`  
> **Phase:** 7 of 8  
> **Universal Threshold:** `80.00%`  
> **Status:** AUDITED & VERIFIED  

---

## 1. 15-Award Computable Maximums & 80% Raw Score Equivalents

| # | Award Code | Award Name | Computable Max | Threshold (%) | 80% Raw Equivalent (Pass) | 1 Step Below (Fail) |
|---|---|---|---:|---:|---:|---:|
| 1 | `NOTRE_DAME_AWARD` | Notre Dame Award | 50.00 | 80.00% | **40.00** | 39.00 |
| 2 | `SMC_AWARD` | Saint Marcellin Champagnat Award | 60.00 | 80.00% | **48.00** | 47.00 |
| 3 | `LEADERSHIP_AWARD` | Leadership Award | 50.00 | 80.00% | **40.00** | 39.00 |
| 4 | `CAMPUS_JOURNALISM_AWARD` | Campus Journalism Award | 70.00 | 80.00% | **56.00** | 55.00 |
| 5 | `SPORTS_AWARD_FEMALE` | Outstanding Performance in Sports (Female) | 55.00 | 80.00% | **44.00** | 43.00 |
| 6 | `SPORTS_AWARD_MALE` | Outstanding Performance in Sports (Male) | 55.00 | 80.00% | **44.00** | 43.00 |
| 7 | `SOCIO_CULTURAL_AWARD_FEMALE` | Outstanding Performance in Socio-Cultural (Female) | 55.00 | 80.00% | **44.00** | 43.00 |
| 8 | `SOCIO_CULTURAL_AWARD_MALE` | Outstanding Performance in Socio-Cultural (Male) | 55.00 | 80.00% | **44.00** | 43.00 |
| 9 | `STUDENT_LEADER_OF_THE_YEAR` | Outstanding Student Leader of the Year | 50.00 | 80.00% | **40.00** | 39.00 |
| 10 | `MEMBER_OF_THE_YEAR` | Outstanding Member of the Year | 40.00 | 80.00% | **32.00** | 31.00 |
| 11 | `VOLUNTEER_OF_THE_YEAR` | Outstanding Volunteer of the Year | 50.00 | 80.00% | **40.00** | 39.00 |
| 12 | `ATHLETE_OF_THE_YEAR_FEMALE` | Outstanding Athlete of the Year (Female) | 55.00 | 80.00% | **44.00** | 43.00 |
| 13 | `ATHLETE_OF_THE_YEAR_MALE` | Outstanding Athlete of the Year (Male) | 55.00 | 80.00% | **44.00** | 43.00 |
| 14 | `PERFORMER_OF_THE_YEAR_FEMALE` | Outstanding Performer of the Year (Female) | 55.00 | 80.00% | **44.00** | 43.00 |
| 15 | `PERFORMER_OF_THE_YEAR_MALE` | Outstanding Performer of the Year (Male) | 55.00 | 80.00% | **44.00** | 43.00 |

---

## 2. Invariant Rules
1. **Universal 80% Rule**: Every active institutional award enforces `candidate_threshold_percent = 80.00`.
2. **Formula Integrity**: Classification evaluates $(raw / max) \times 100 \ge 80.00$, never hardcoded raw constants.
3. **Inclusive Boundary**: An exact $80.00\%$ normalized score qualifies as `POTENTIAL_CANDIDATE`.
