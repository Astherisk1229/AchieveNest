# Plan 05 Phase 7 — Portfolio API Contract Specification
## Request / Response Envelopes for Canonical Portfolio Endpoints

### 1. Canonical Index Endpoint: `GET /api/v1/portfolio`

#### Query Parameters
- `student_profile_id` (UUID, Optional): Scopes portfolio to a specific student (Restricted to `osad_staff`, `program_coordinator`, `dean`; ignored for `student` role).
- `category_id` (UUID, Optional): Filters by primary category.
- `status` (String, Optional): Filters by status (`draft`, `submitted`, `verified`, etc.).
- `award_id` (UUID, Optional): For authorized reviewers, attaches the `osad_evaluation` overlay for the specified award.

#### Response Envelope (HTTP 200)
```json
{
  "data": {
    "records": [
      {
        "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "student_profile_id": "stu-uuid-001",
        "category_id": "2d20d412-bf34-46b4-a21d-d7131d4b514a",
        "category_name": "Sports",
        "category_code": "SPORTS",
        "subcategory_id": "40000007-0001-0000-0000-000000000001",
        "subcategory_name": "Basketball",
        "subcategory_code": "SPORTS_BASKETBALL",
        "title": "PRISAA Regional Basketball Championship",
        "organizer_or_body": "PRISAA Region XII",
        "occurrence_date": "2026-02-14",
        "start_date": "2026-02-14",
        "end_date": "2026-02-18",
        "description": "Team captain during regional finals.",
        "status": "verified",
        "structured_metadata": {
          "schema_version": "1.0",
          "competition_type": "prisaa",
          "placement": "champion",
          "event_level": "regional"
        },
        "evidence": [
          {
            "id": "ev-01",
            "original_filename": "prisaa_cert.pdf",
            "mime_type": "application/pdf"
          }
        ],
        "evidence_count": 1
      }
    ]
  }
}
```
