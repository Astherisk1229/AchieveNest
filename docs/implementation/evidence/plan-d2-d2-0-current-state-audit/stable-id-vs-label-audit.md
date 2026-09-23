# Stable ID vs Display Name Persistence Audit — Plan D2 Phase D2-0

| Concept | Frontend Submission | Backend Payload Accepted | Database Column | Storage Format | Conformance Status | Action for D2 Execution |
|---|---|---|---|---|---|---|
| **College** | `college_id` (Number/ID) | `college_id` | `personnel_profiles.college_id` | Integer / FK ID | **COMPLIANT** | Retain stable ID binding |
| **Administrative Unit** | `administrative_unit_id` (ID) | `administrative_unit_id` | `personnel_profiles.administrative_unit_id` | Integer / FK ID | **COMPLIANT** | Retain stable ID binding |
| **Academic Rank** | `currentRankTitle` (Text) | `current_rank_title` | `personnel_profiles.current_rank_title` | String Display Title | **NON-COMPLIANT** | Connect to Plan E catalog `code` + canonical title |
| **Part-Time Title** | `currentRankTitle` (Text) | `current_rank_title` | `personnel_profiles.current_rank_title` | String Display Title | **NON-COMPLIANT** | Connect to Plan E Part-Time title catalog `code` + title |
| **Qualification** | `qualificationSummary` (Text) | `qualification_summary` | `personnel_profiles.qualification_summary` | Free-text String | **PARTIAL** | Link with `qualification_reviews` structured metadata |
| **Position / Job Title** | `positionTitle` (Text) | `position_title` | `personnel_profiles.position_title` | Free-text String | **UNRESOLVED** | No authoritative catalog exists |
