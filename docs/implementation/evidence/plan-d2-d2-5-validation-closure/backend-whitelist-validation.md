# Backend Whitelist Validation

## Verification Summary

The provisioning and edit endpoints (`POST /api/v1/provisioning/personnel`, `PUT /api/v1/hr/personnel/{id}/master-data`, `PUT /api/v1/hr/personnel/{id}/classification`) accept and persist the required D2 schema attributes:

- `personnel_group`: `'faculty' | 'non_teaching_faculty'`
- `organizational_side`: `'academic' | 'non_academic'`
- `faculty_engagement`: `'full_time_faculty' | 'part_time_faculty'`
- `employment_status`: `'permanent' | 'probationary'`
- `current_rank_title`: Canonical rank name or part-time title
- `rank_level`: Canonical code / level
- `position_title`: Descriptive job title
- `qualification_summary`: Free-text educational credentials
- `college_id`: Valid UUID referencing `colleges`
- `academic_program_ids`: Array of UUIDs referencing `academic_programs`
- `administrative_unit_id`: Valid UUID referencing `administrative_units`

## Test Proof
- `TargetProvisioningController.php` & `TargetHRPersonnelController.php` — LINT CLEAN (0 errors)
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Tests 1–35) — PASSED
