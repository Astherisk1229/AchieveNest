# Phase D2-2: Plan E Resolver Endpoint Integration

## Reused Plan E Resolvers
Phase D2-2 directly consumes the canonical Plan E backend resolvers without duplicating qualification-to-rank mapping logic in React components:

1. **Full-Time Initial Rank Resolver**:
   - **Backend Service**: `backend/app/Services/FacultyInitialRankService.php` (`resolveInitialRank`)
   - **Endpoint**: `POST /api/v1/faculty-ranks/resolve-initial`
   - **Payload**:
     ```json
     {
       "qualification": "PhD in Computer Science",
       "faculty_status": "Full-time Faculty",
       "has_verified_licensure": false,
       "personnel_group": "Faculty"
     }
     ```
   - **Response Format**:
     ```json
     {
       "success": true,
       "data": {
         "recommended_code": "PROFI_1",
         "recommended_label": "Professor I",
         "base_rank_code": "PROF_1",
         "reason_code": "DOCTORAL_DEGREE",
         "source": "plan_e"
       }
     }
     ```

2. **Part-Time Faculty Title Resolver**:
   - **Backend Service**: `backend/app/Services/PartTimeFacultyTitleService.php` (`resolveTitleFromQualification`)
   - **Endpoint**: `POST /api/v1/faculty-titles/part-time/resolve`
   - **Payload**:
     ```json
     {
       "qualification": "Doctor of Education",
       "is_board_passer": false
     }
     ```
   - **Response Format**:
     ```json
     {
       "success": true,
       "data": {
         "title_code": "PROF_LECTURER",
         "title_name": "Professorial Lecturer",
         "source": "plan_e"
       }
     }
     ```

## Orchestration Layer
The frontend service `frontend/src/services/personnelRankRecommendationService.js`:
- Selects the appropriate resolver based on `faculty_status`.
- Normalizes response payloads into a standardized `recommendationState` DTO.
- Validates the returned rank/title against the active catalog.
- Attaches incrementing sequence IDs to prevent asynchronous out-of-order state corruption.
