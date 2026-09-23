# Phase 4 Deliverable: Student Portfolio Taxonomy Validation

**Document Identifier:** `docs/audits/osad-award-phase4-portfolio-taxonomy-validation.md`  
**Phase:** 4 of 8 (Verified Evidence Mapping & Students for Evaluation Engine)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **9-CATEGORY TAXONOMY AUDITED & VALIDATED**

---

## 1. Executive Summary

This deliverable verifies that AchieveNest strictly uses the **locked 9-category student portfolio taxonomy** and enforces all non-negotiable classification rules across evidence mapping.

---

## 2. The Authoritative 9 Categories

| # | Category Code | Canonical Name | Description & Usage Boundary |
|---|---|---|---|
| 1 | `LEADERSHIP_POSITION` | Leadership Position | Official leadership position held in SSG, Collegiate Council, Club, or Year-Level body. |
| 2 | `ORG_MEMBERSHIP_PARTICIPATION` | Organization Membership / Participation | General membership, committee participation, activity involvement, facilitation, organizing, or documented contributions. |
| 3 | `COMMUNITY_SERVICE_VOLUNTEERISM` | Community Service / Volunteerism | Outreach, volunteer work, community extension, environmental service, or service-oriented activities. |
| 4 | `CHURCH_MINISTRY_INVOLVEMENT` | Church / Ministry Involvement | Campus ministry, parish/church ministry, church organizations, or initiated church-related activities. |
| 5 | `SEMINAR_TRAINING` | Seminar / Training | Seminars, workshops, trainings, conferences, congresses, and certifications. |
| 6 | `CITATION_RECOGNITION` | Citation / Recognition | Verified non-academic citations, commendations, or recognitions. |
| 7 | `SPORTS` | Sports | Athletic participation, sports meets/competitions, and sports placements or medals. |
| 8 | `SOCIO_CULTURAL_PERFORMING_ARTS` | Socio-Cultural / Performing Arts | Dance, vocal, instrumental, theater, cultural performance, and related competitions or placements. |
| 9 | `CAMPUS_JOURNALISM` | Campus Journalism | News, literary works, columns, editorials, campus publication membership/contribution, or publication officer roles. |

---

## 3. Locked Classification Distinctions & Validation

1. **No "Achievement" Top-Level Category**:
   - `Achievement` is not introduced as a 10th category. Placements, awards, and medals remain structured metadata on `SPORTS`, `SOCIO_CULTURAL_PERFORMING_ARTS`, and `CITATION_RECOGNITION`.
2. **Leadership Seminar**:
   - Mapped under `SEMINAR_TRAINING -> LEADERSHIP_DEVELOPMENT`. It is strictly forbidden from being stored or mapped as a `LEADERSHIP_POSITION`.
3. **Sports Clinic / Training**:
   - Mapped under `SEMINAR_TRAINING -> SPORTS_DEVELOPMENT`. It is strictly excluded from competition skills/participation evidence.
4. **Performing Arts Workshop**:
   - Mapped under `SEMINAR_TRAINING -> SOCIO_CULTURAL_PERFORMING_ARTS_DEVELOPMENT`. It is strictly excluded from competition performance evidence.
5. **Campus Journalism Publication Rules**:
   - Only `Published` works map into publication evidence; `Draft` and `Unpublished` items are strictly excluded. Seminars carry zero point mappings.
