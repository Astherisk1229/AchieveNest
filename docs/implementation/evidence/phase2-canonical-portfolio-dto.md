# Plan 05 Phase 2 — Canonical Portfolio DTO Specification
## Canonical Representation of Student Portfolio Records Across Views

```json
{
  "record_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "student_profile_id": "550e8400-e29b-41d4-a716-446655440000",
  "category": {
    "id": "2d20d412-bf34-46b4-a21d-d7131d4b514a",
    "code": "SPORTS",
    "label": "Sports",
    "order": 7
  },
  "subcategory": {
    "id": "40000007-0001-0000-0000-000000000001",
    "code": "SPORTS_BASKETBALL",
    "label": "Basketball"
  },
  "title": "PRISAA Regional Basketball Championship 2026",
  "organizer_or_body": "Private Schools Athletic Association (PRISAA) Region XII",
  "dates": {
    "start_date": "2026-02-14",
    "end_date": "2026-02-18",
    "occurrence_date": "2026-02-14",
    "display_range": "Feb 14, 2026 – Feb 18, 2026"
  },
  "description": "Starting point guard representing NDMU Varsity Team during the regional qualifying tournament.",
  "schema_version": "1.0",
  "structured_metadata": {
    "schema_version": "1.0",
    "competition_type": "prisaa",
    "event_level": "regional",
    "placement": "champion",
    "individual_team": "team",
    "team_role": "Starting Point Guard / Team Captain",
    "academic_year": "2025-2026",
    "semester": "2nd_semester"
  },
  "structured_details": [
    {
      "key": "competition_type",
      "label": "Competition Tier",
      "value": "prisaa",
      "display_value": "PRISAA (Private Schools Athletic Association)"
    },
    {
      "key": "event_level",
      "label": "Event Level",
      "value": "regional",
      "display_value": "Regional (Region XII)"
    },
    {
      "key": "placement",
      "label": "Placement / Result",
      "value": "champion",
      "display_value": "Champion / 1st Place"
    },
    {
      "key": "individual_team",
      "label": "Participation Mode",
      "value": "team",
      "display_value": "Team Event"
    },
    {
      "key": "team_role",
      "label": "Team Role / Designation",
      "value": "Starting Point Guard / Team Captain",
      "display_value": "Starting Point Guard / Team Captain"
    },
    {
      "key": "academic_year",
      "label": "Academic Year",
      "value": "2025-2026",
      "display_value": "2025-2026"
    },
    {
      "key": "semester",
      "label": "Semester",
      "value": "2nd_semester",
      "display_value": "2nd Semester"
    }
  ],
  "evidence": [
    {
      "id": "e891c102-6712-4211-8e99-441122334455",
      "original_filename": "PRISAA_Gold_Medal_Certificate.pdf",
      "mime_type": "application/pdf",
      "byte_size": 245760,
      "evidence_type": "certificate",
      "uploaded_at": "2026-02-20 09:30:00",
      "status": "active"
    }
  ],
  "verification": {
    "status": "verified",
    "submitted_at": "2026-02-20 10:00:00",
    "verified_at": "2026-02-22 14:15:00",
    "remarks": "Official PRISAA certificate verified against varsity roster."
  },
  "capabilities": {
    "can_edit": false,
    "can_delete": false,
    "can_resubmit": false,
    "can_view_evidence": true
  }
}
```
