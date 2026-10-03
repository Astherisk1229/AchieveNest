# Plan F Phase F1 Evidence: Assigned Scale API Verification

## Endpoints Implemented

1. `GET /api/v1/personnel/evaluation-scale`:
   - Returns the scale assignment DTO for the calling authenticated personnel.
2. `GET /api/v1/personnel/{id}/evaluation-scale`:
   - Returns the scale assignment DTO for a specific personnel member by ID.
3. `GET /api/v1/evaluation-instruments/assigned`:
   - Endpoint alias returning the assigned instrument configuration.

## DTO Structure
```json
{
  "personnel_profile_id": 101,
  "personnel_group": "faculty",
  "organizational_side": "academic",
  "evaluation_scale_code": "ADMINISTRATORS_RANKING_SCALE",
  "scale_title": "Rating Sheet for Administrators & Academic Personnel",
  "rule_version": "NDMU-PERSONNEL-RATING-V2",
  "assignment_source": "canonical_profile_matrix",
  "assignment_status": "assigned",
  "reason_code": "scale_assigned_successfully",
  "override_applied": false,
  "override_reason": null,
  "resolved_at": "2026-09-09T00:20:00+08:00"
}
```
