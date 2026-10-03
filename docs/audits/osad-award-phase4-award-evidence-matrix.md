# Phase 4 Deliverable: 15-Award Evidence Mapping Matrix

**Document Identifier:** `docs/audits/osad-award-phase4-award-evidence-matrix.md`  
**Phase:** 4 of 8 (Verified Evidence Mapping & Students for Evaluation Engine)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **15-AWARD EVIDENCE MATRIX VALIDATED**

---

## 1. Complete 15-Award Evidence Mapping Matrix

| # | Award Code | Award Name | Computable Criteria | Feeding Portfolio Categories & Subcategories | Required Structured Metadata | Duplicate Boundary |
|---|---|---|---|---|---|---|
| 1 | `NOTRE_DAME_AWARD` | Notre Dame Award | Leadership (20), Church (20), Citations (10) | `LEADERSHIP_POSITION`, `SEMINAR_TRAINING` (Leadership), `CHURCH_MINISTRY_INVOLVEMENT`, `CITATION_RECOGNITION` | `leadership_level`, `role`, `church_activity_type`, `scope` | Same subsection |
| 2 | `SMC_AWARD` | Saint Marcellin Champagnat Award | Leadership (20), Community/Church (30), Citations (10) | `LEADERSHIP_POSITION`, `CHURCH_MINISTRY_INVOLVEMENT`, `CITATION_RECOGNITION` | `leadership_level`, `role` (Initiator/Lead), `scope` | Same subsection |
| 3 | `LEADERSHIP_AWARD` | Leadership Award | Leadership (30), Community (20) | `LEADERSHIP_POSITION`, `SEMINAR_TRAINING` (Leadership), `COMMUNITY_SERVICE_VOLUNTEERISM`, `CITATION_RECOGNITION` | `leadership_level`, `civic_level`, `scope` | Same subsection |
| 4 | `CAMPUS_JOURNALISM_AWARD` | Campus Journalism Award | Publication (60), Leadership/Awards (10) | `CAMPUS_JOURNALISM` (News, Lit, Col, Edit), `LEADERSHIP_POSITION` (Pub role), `CITATION_RECOGNITION` (Journalism) | `publication_type`, `publication_status = 'published'`, `role`, `scope` | Same publication/article |
| 5 | `SPORTS_AWARD_FEMALE` | Sports Performance - Female | Skills (20), Participation (20), Awards (15) | `SPORTS` | `competition_type` (Individual/Team), `event_level`, `placement` | Same competition event |
| 6 | `SPORTS_AWARD_MALE` | Sports Performance - Male | Skills (20), Participation (20), Awards (15) | `SPORTS` | `competition_type` (Individual/Team), `event_level`, `placement` | Same competition event |
| 7 | `SOCIO_CULTURAL_AWARD_FEMALE` | Socio-Cultural Performance - Female | Skills (20), Participation (20), Awards (15) | `SOCIO_CULTURAL_PERFORMING_ARTS` | `performance_type` (Individual/Group), `event_level`, `placement` | Same performance event |
| 8 | `SOCIO_CULTURAL_AWARD_MALE` | Socio-Cultural Performance - Male | Skills (20), Participation (20), Awards (15) | `SOCIO_CULTURAL_PERFORMING_ARTS` | `performance_type` (Individual/Group), `event_level`, `placement` | Same performance event |
| 9 | `STUDENT_LEADER_OF_THE_YEAR` | Student Leader of the Year | Leadership (40), Community (10) | `LEADERSHIP_POSITION`, `SEMINAR_TRAINING` (Leadership), `COMMUNITY_SERVICE_VOLUNTEERISM`, `CITATION_RECOGNITION` | `leadership_level`, `scope`, `organization_type` | Same subsection |
| 10 | `MEMBER_OF_THE_YEAR` | Member of the Year | Involvement (20), Contribution (10), Leadership (10) | `ORG_MEMBERSHIP_PARTICIPATION`, `LEADERSHIP_POSITION`, `CITATION_RECOGNITION` | `participation_type`, `contribution_type`, `leadership_level` | Same subsection |
| 11 | `VOLUNTEER_OF_THE_YEAR` | Volunteer of the Year | Volunteerism (40), Leadership (10) | `CHURCH_MINISTRY_INVOLVEMENT`, `COMMUNITY_SERVICE_VOLUNTEERISM`, `LEADERSHIP_POSITION`, `CITATION_RECOGNITION` | `service_scope`, `role` (Initiator/Lead), `leadership_level` | Same subsection |
| 12 | `ATHLETE_OF_THE_YEAR_FEMALE` | Athlete of the Year - Female | Skills (20), Participation (20), Awards (15) | `SPORTS` | `competition_type`, `event_level`, `placement` | Same competition event |
| 13 | `ATHLETE_OF_THE_YEAR_MALE` | Athlete of the Year - Male | Skills (20), Participation (20), Awards (15) | `SPORTS` | `competition_type`, `event_level`, `placement` | Same competition event |
| 14 | `PERFORMER_OF_THE_YEAR_FEMALE` | Performer of the Year - Female | Skills (20), Participation (20), Awards (15) | `SOCIO_CULTURAL_PERFORMING_ARTS` | `performance_type`, `event_level`, `placement` | Same performance event |
| 15 | `PERFORMER_OF_THE_YEAR_MALE` | Performer of the Year - Male | Skills (20), Participation (20), Awards (15) | `SOCIO_CULTURAL_PERFORMING_ARTS` | `performance_type`, `event_level`, `placement` | Same performance event |
