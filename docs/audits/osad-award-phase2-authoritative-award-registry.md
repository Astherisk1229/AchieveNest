# Phase 2 Deliverable: Authoritative 15-Award Registry

**Document Identifier:** `docs/audits/osad-award-phase2-authoritative-award-registry.md`  
**Phase:** 2 of 8 (Authoritative Award Definitions, Eligibility Metadata & Rubric Seeding)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **AUTHORITATIVE REGISTRY LOCKED**

---

## 1. Executive Summary

This registry defines the authoritative set of **15 institutional awards** seeded in AchieveNest. All 15 awards adhere strictly to the candidate qualifying threshold ($80.00\%$ normalized Portfolio Potential Score), eligibility gates (graduating-only vs open-pool), sex-specific variants, and authoritative source-fidelity metadata.

---

## 2. Authoritative 15-Award Registry Matrix

| # | Award Code | Official Award Name | Canonical ID | Eligibility Pool | Sex Requirement | Computable Max | Raw Pts for 80% | Source Fidelity Status | Version | Status |
|---|---|---|---|---|:---:|---:|---:|:---:|:---:|:---:|
| 1 | `NOTRE_DAME_AWARD` | Notre Dame Award | `50000001-0000-0000-0000-000000000001` | Graduating only | None | 50.00 | 40.00 | `OFFICIAL` | 1.0 | `active` |
| 2 | `SMC_AWARD` | Saint Marcellin Champagnat (SMC) Award | `50000001-0000-0000-0000-000000000021` | Graduating only | None | 60.00 | 48.00 | `OFFICIAL` | 1.0 | `active` |
| 3 | `LEADERSHIP_AWARD` | Leadership Award | `50000001-0000-0000-0000-000000000022` | Graduating only | None | 50.00 | 40.00 | `OFFICIAL` | 1.0 | `active` |
| 4 | `CAMPUS_JOURNALISM_AWARD` | Campus Journalism Award | `50000001-0000-0000-0000-000000000023` | Graduating only | None | 70.00 | 56.00 | `OFFICIAL` | 1.0 | `active` |
| 5 | `SPORTS_AWARD_FEMALE` | Outstanding Performance in Sports - Female | `50000001-0000-0000-0000-000000000024` | Graduating only | Female | 55.00 | 44.00 | `OFFICIAL` | 1.0 | `active` |
| 6 | `SPORTS_AWARD_MALE` | Outstanding Performance in Sports - Male | `50000001-0000-0000-0000-000000000025` | Graduating only | Male | 55.00 | 44.00 | `OFFICIAL` | 1.0 | `active` |
| 7 | `SOCIO_CULTURAL_AWARD_FEMALE` | Outstanding Performance in Socio-Cultural - Female | `50000001-0000-0000-0000-000000000026` | Graduating only | Female | 55.00 | 44.00 | `PROPOSED` | 1.0 | `active` |
| 8 | `SOCIO_CULTURAL_AWARD_MALE` | Outstanding Performance in Socio-Cultural - Male | `50000001-0000-0000-0000-000000000027` | Graduating only | Male | 55.00 | 44.00 | `PROPOSED` | 1.0 | `active` |
| 9 | `STUDENT_LEADER_OF_THE_YEAR` | Outstanding Student Leader of the Year | `50000001-0000-0000-0000-000000000028` | Open pool (Grad + Non-Grad) | None | 50.00 | 40.00 | `OFFICIAL` | 1.0 | `active` |
| 10 | `MEMBER_OF_THE_YEAR` | Outstanding Member of the Year | `50000001-0000-0000-0000-000000000029` | Open pool (Grad + Non-Grad) | None | 40.00 | 32.00 | `OFFICIAL` | 1.0 | `active` |
| 11 | `VOLUNTEER_OF_THE_YEAR` | Outstanding Volunteer of the Year | `50000001-0000-0000-0000-000000000030` | Open pool (Grad + Non-Grad) | None | 50.00 | 40.00 | `OFFICIAL` | 1.0 | `active` |
| 12 | `ATHLETE_OF_THE_YEAR_FEMALE` | Outstanding Athlete of the Year - Female | `50000001-0000-0000-0000-000000000031` | Open pool (Grad + Non-Grad) | Female | 55.00 | 44.00 | `OFFICIAL` | 1.0 | `active` |
| 13 | `ATHLETE_OF_THE_YEAR_MALE` | Outstanding Athlete of the Year - Male | `50000001-0000-0000-0000-000000000032` | Open pool (Grad + Non-Grad) | Male | 55.00 | 44.00 | `OFFICIAL` | 1.0 | `active` |
| 14 | `PERFORMER_OF_THE_YEAR_FEMALE` | Outstanding Performer of the Year - Female | `50000001-0000-0000-0000-000000000033` | Open pool (Grad + Non-Grad) | Female | 55.00 | 44.00 | `PROPOSED` | 1.0 | `active` |
| 15 | `PERFORMER_OF_THE_YEAR_MALE` | Outstanding Performer of the Year - Male | `50000001-0000-0000-0000-000000000034` | Open pool (Grad + Non-Grad) | Male | 55.00 | 44.00 | `PROPOSED` | 1.0 | `active` |

---

## 3. Structural Summary Totals

- **Authoritative Awards:** 15 active definitions
- **Graduating-Only Awards:** 8 awards
- **Open-Pool (All Year Levels) Awards:** 7 awards
- **Female Variants:** 4 awards
- **Male Variants:** 4 awards
- **Non-Sex-Gated Awards:** 7 awards
- **Universal Candidate Threshold:** $80.00\%$ Potential Score across all 15 awards
- **Legacy Quarantined Definitions:** Historical awards (`50000001-0000-0000-0000-000000000002` through `...0015`) safely marked `archived` / `LEGACY_QUARANTINED` for historical audit preservation.
