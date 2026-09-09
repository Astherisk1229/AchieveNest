# AchieveNest — Student Portfolio Category Finalization Report

> **Database:** `achievenest_local` (MySQL `8.4.7`)  
> **Git Revision:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
> **Audit Timestamp:** `2026-08-31 19:35:48 UTC`  

---

## 1. Executive Summary
- **Primary Portfolio Categories**: Exactly **9 Authoritative Categories** (Locked & Confirmed).
- **Portfolio Subcategories**: Exactly **57 Structured Subcategories** across all 9 primary domains.
- **Forbidden Primary Categories**: **0 Active Rows** (Zero 'Achievement', 'Placement', or 'Competition' top-level categories).
- **Legacy Portfolio Category Rows**: 0.
- **Portfolio Records Requiring Manual Remap**: 0 (100% Deterministic & Compatible).
- **Category / Subcategory Pair Consistency**: **PASS (0 Mismatches)**.

## 2. Authoritative 9 Primary Categories Breakdown

| # | Code | Category Name | Description | Subcategories | Status |
|---|---|---|---|---:|:---:|
| 1 | `LEADERSHIP_POSITION` | **Leadership Position** | Use this only for an official leadership position held in SSG, a College/Collegiate Council, a Club/Organization, or a Year-Level body. | 4 | **AUTHORITATIVE** |
| 2 | `ORG_MEMBERSHIP_PARTICIPATION` | **Organization Membership / Participation** | Use this for organization membership, committee participation, activity involvement, facilitation, organizing, or documented contributions when the record is not primarily a leadership position. | 5 | **AUTHORITATIVE** |
| 3 | `COMMUNITY_SERVICE_VOLUNTEERISM` | **Community Service / Volunteerism** | Use this for outreach, volunteer work, community extension, environmental service, or other service-oriented involvement. | 5 | **AUTHORITATIVE** |
| 4 | `CHURCH_MINISTRY_INVOLVEMENT` | **Church / Ministry Involvement** | Use this for campus ministry, parish/church ministry, church organizations, church-related service, or an initiated church-related activity. | 4 | **AUTHORITATIVE** |
| 5 | `SEMINAR_TRAINING` | **Seminar / Training** | Use this for seminars, workshops, trainings, conferences, congresses, certifications, and similar development activities. | 8 | **AUTHORITATIVE** |
| 6 | `CITATION_RECOGNITION` | **Citation / Recognition** | Use this for verified non-academic citations, commendations, or recognitions that are not already captured as a sports or socio-cultural competition placement. | 8 | **AUTHORITATIVE** |
| 7 | `SPORTS` | **Sports** | Use this for athletic participation, sports meets or competitions, and sports placements or medals. | 10 | **AUTHORITATIVE** |
| 8 | `SOCIO_CULTURAL_PERFORMING_ARTS` | **Socio-Cultural / Performing Arts** | Use this for dance, vocal, instrumental, theater, cultural performance, and related competitions or placements. | 7 | **AUTHORITATIVE** |
| 9 | `CAMPUS_JOURNALISM` | **Campus Journalism** | Use this for news, literary works, columns, editorials, campus publication membership/contribution, or publication officer roles. | 6 | **AUTHORITATIVE** |

## 3. Subcategory Inventory (All 57 Subcategories)

| # | Primary Category | Subcategory Code | Subcategory Name | Status |
|---|---|---|---|:---:|
| 1 | Leadership Position | `SSG_UNIVERSITY_GOVERNMENT` | SSG / University Student Government | **AUTHORITATIVE** |
| 2 | Leadership Position | `COLLEGIATE_COLLEGE_COUNCIL` | Collegiate / College Council | **AUTHORITATIVE** |
| 3 | Leadership Position | `CLUB_ORGANIZATION` | Club / Organization | **AUTHORITATIVE** |
| 4 | Leadership Position | `YEAR_LEVEL_LEADERSHIP` | Year-Level Leadership | **AUTHORITATIVE** |
| 5 | Organization Membership / Participation | `GENERAL_MEMBER` | General Member | **AUTHORITATIVE** |
| 6 | Organization Membership / Participation | `COMMITTEE_MEMBER` | Committee Member | **AUTHORITATIVE** |
| 7 | Organization Membership / Participation | `ACTIVITY_PARTICIPANT` | Activity Participant | **AUTHORITATIVE** |
| 8 | Organization Membership / Participation | `FACILITATOR_ORGANIZER` | Facilitator / Organizer | **AUTHORITATIVE** |
| 9 | Organization Membership / Participation | `PROJECT_CONTRIBUTOR` | Project Contributor | **AUTHORITATIVE** |
| 10 | Community Service / Volunteerism | `UNIVERSITY_BASED_SERVICE` | University-Based Service | **AUTHORITATIVE** |
| 11 | Community Service / Volunteerism | `COMMUNITY_BASED_SERVICE` | Community-Based Service | **AUTHORITATIVE** |
| 12 | Community Service / Volunteerism | `CHURCH_BASED_SERVICE` | Church-Based Service | **AUTHORITATIVE** |
| 13 | Community Service / Volunteerism | `ENVIRONMENTAL_SERVICE` | Environmental Service | **AUTHORITATIVE** |
| 14 | Community Service / Volunteerism | `PEOPLE_DEVELOPMENT_EDUCATIONAL_SERVICE` | People Development / Educational Service | **AUTHORITATIVE** |
| 15 | Church / Ministry Involvement | `CAMPUS_MINISTRY` | Campus Ministry | **AUTHORITATIVE** |
| 16 | Church / Ministry Involvement | `PARISH_CHURCH_MINISTRY` | Parish / Church Ministry | **AUTHORITATIVE** |
| 17 | Church / Ministry Involvement | `CHURCH_ORGANIZATION` | Church Organization | **AUTHORITATIVE** |
| 18 | Church / Ministry Involvement | `INITIATED_CHURCH_RELATED_ACTIVITY` | Initiated Church-Related Activity | **AUTHORITATIVE** |
| 19 | Seminar / Training | `LEADERSHIP_DEVELOPMENT` | Leadership Development | **AUTHORITATIVE** |
| 20 | Seminar / Training | `PERSONAL_PROFESSIONAL_DEVELOPMENT` | Personal / Professional Development | **AUTHORITATIVE** |
| 21 | Seminar / Training | `CAMPUS_JOURNALISM_DEVELOPMENT` | Campus Journalism Development | **AUTHORITATIVE** |
| 22 | Seminar / Training | `SPORTS_DEVELOPMENT` | Sports Development | **AUTHORITATIVE** |
| 23 | Seminar / Training | `SOCIO_CULTURAL_PERFORMING_ARTS_DEVELOPMENT` | Socio-Cultural / Performing Arts Development | **AUTHORITATIVE** |
| 24 | Seminar / Training | `COMMUNITY_SERVICE_VOLUNTEER_DEVELOPMENT` | Community Service / Volunteer Development | **AUTHORITATIVE** |
| 25 | Seminar / Training | `SPIRITUAL_FORMATION_DEVELOPMENT` | Spiritual / Formation Development | **AUTHORITATIVE** |
| 26 | Seminar / Training | `OTHER_SEMINAR_TRAINING` | Other Seminar / Training | **AUTHORITATIVE** |
| 27 | Citation / Recognition | `LEADERSHIP` | Leadership | **AUTHORITATIVE** |
| 28 | Citation / Recognition | `ORGANIZATION_MEMBERSHIP` | Organization / Membership | **AUTHORITATIVE** |
| 29 | Citation / Recognition | `COMMUNITY_SERVICE_VOLUNTEERISM` | Community Service / Volunteerism | **AUTHORITATIVE** |
| 30 | Citation / Recognition | `CHURCH_MINISTRY` | Church / Ministry | **AUTHORITATIVE** |
| 31 | Citation / Recognition | `CAMPUS_JOURNALISM` | Campus Journalism | **AUTHORITATIVE** |
| 32 | Citation / Recognition | `SPORTS` | Sports | **AUTHORITATIVE** |
| 33 | Citation / Recognition | `SOCIO_CULTURAL_PERFORMING_ARTS` | Socio-Cultural / Performing Arts | **AUTHORITATIVE** |
| 34 | Citation / Recognition | `OTHER_NON_ACADEMIC_RECOGNITION` | Other Non-Academic Recognition | **AUTHORITATIVE** |
| 35 | Sports | `BASKETBALL` | Basketball | **AUTHORITATIVE** |
| 36 | Sports | `VOLLEYBALL` | Volleyball | **AUTHORITATIVE** |
| 37 | Sports | `ATHLETICS` | Athletics | **AUTHORITATIVE** |
| 38 | Sports | `SWIMMING` | Swimming | **AUTHORITATIVE** |
| 39 | Sports | `BADMINTON` | Badminton | **AUTHORITATIVE** |
| 40 | Sports | `TABLE_TENNIS` | Table Tennis | **AUTHORITATIVE** |
| 41 | Sports | `CHESS` | Chess | **AUTHORITATIVE** |
| 42 | Sports | `FOOTBALL` | Football | **AUTHORITATIVE** |
| 43 | Sports | `SEPAK_TAKRAW` | Sepak Takraw | **AUTHORITATIVE** |
| 44 | Sports | `OTHER_APPROVED_SPORT` | Other Approved Sport | **AUTHORITATIVE** |
| 45 | Socio-Cultural / Performing Arts | `DANCE` | Dance | **AUTHORITATIVE** |
| 46 | Socio-Cultural / Performing Arts | `VOCAL_SINGING` | Vocal / Singing | **AUTHORITATIVE** |
| 47 | Socio-Cultural / Performing Arts | `INSTRUMENTAL` | Instrumental | **AUTHORITATIVE** |
| 48 | Socio-Cultural / Performing Arts | `THEATER` | Theater | **AUTHORITATIVE** |
| 49 | Socio-Cultural / Performing Arts | `CULTURAL_PERFORMANCE` | Cultural Performance | **AUTHORITATIVE** |
| 50 | Socio-Cultural / Performing Arts | `PERFORMING_ARTS` | Performing Arts | **AUTHORITATIVE** |
| 51 | Socio-Cultural / Performing Arts | `OTHER_APPROVED_DISCIPLINE` | Other Approved Discipline | **AUTHORITATIVE** |
| 52 | Campus Journalism | `NEWS_ITEM` | News Item | **AUTHORITATIVE** |
| 53 | Campus Journalism | `LITERARY_WORK` | Literary Work | **AUTHORITATIVE** |
| 54 | Campus Journalism | `COLUMN` | Column | **AUTHORITATIVE** |
| 55 | Campus Journalism | `EDITORIAL` | Editorial | **AUTHORITATIVE** |
| 56 | Campus Journalism | `PUBLICATION_MEMBER_CONTRIBUTOR` | Publication Member / Contributor | **AUTHORITATIVE** |
| 57 | Campus Journalism | `PUBLICATION_OFFICER` | Publication Officer | **AUTHORITATIVE** |
