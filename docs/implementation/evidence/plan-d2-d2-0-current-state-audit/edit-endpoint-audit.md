# Backend Edit Endpoint Audit — Plan D2 Phase D2-0

### Master Data Mutation Endpoint
- **Route**: `PUT /api/v1/hr/personnel/{id}/master-data`
- **Controller**: `TargetHRPersonnelController.php` (Method: `updateMasterData`)
- **Accepted Payload Fields**:
  - `employment_status` (`permanent`, `probationary`, `temporary`, etc.)
  - `position_title` (`string`)
  - `current_rank_title` (`string`)
  - `qualification_summary` (`string`)
  - `faculty_engagement` (`full_time_faculty`, `part_time_faculty` — optional)
  - `reason` (`string` — mandatory audit justification)

### Audit & Behavior Findings
1. **Audit Logging**: Successful updates append an immutable event to `account_lifecycle_events` capturing actor ID, timestamp, before/after values, and the mandatory `reason`.
2. **Rank Mutation Guard**: Endpoint updates `current_rank_title` strictly with the explicitly supplied value; it does NOT automatically overwrite or recalculate rank based on `qualification_summary`.
3. **Classification & Placement Endpoints**:
   - `PUT /api/v1/hr/personnel/{id}/classification` updates `personnel_group` and `organizational_side`.
   - `PUT /api/v1/hr/personnel/{id}/assignment` updates `college_id`, `academic_program_ids`, and `administrative_unit_id`.
