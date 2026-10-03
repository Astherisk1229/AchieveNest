# AchieveNest — Student Portfolio & OSAD Portfolio Review Format Alignment
## Plan 05 — Canonical Portfolio Presentation Reference

---

### 1. Authoritative 9-Category Sequence

1. `Leadership Position` (`8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646`, 4 Subcategories)
2. `Organization Membership / Participation` (`dbcfc4ee-b657-418c-b038-f1c50e4ca201`, 5 Subcategories)
3. `Community Service / Volunteerism` (`121085ba-2748-433b-8e2b-fef9b6ae6cb3`, 5 Subcategories)
4. `Church / Ministry Involvement` (`eec7eec9-c89b-449e-b9ef-d6032d8471c2`, 4 Subcategories)
5. `Seminar / Training` (`802de57b-54d7-4d38-9433-052ca9636380`, 8 Subcategories)
6. `Citation / Recognition` (`cbca1c82-83b5-48ef-b593-013ba0c68940`, 8 Subcategories)
7. `Sports` (`2d20d412-bf34-46b4-a21d-d7131d4b514a`, 10 Subcategories)
8. `Socio-Cultural / Performing Arts` (`43f2187b-b0b4-4b5b-9d41-3d77d7045b80`, 7 Subcategories)
9. `Campus Journalism` (`2b09cd61-7a23-4466-be58-889398e8f201`, 6 Subcategories)

**Total Canonical Subcategories**: **57 Subcategories**.

---

### 2. Canonical Presentation DTO Structure

```json
{
  "id": "UUID (Primary Key)",
  "student_profile_id": "UUID",
  "category_id": "UUID",
  "category_name": "String",
  "category_code": "String",
  "subcategory_id": "UUID",
  "subcategory_name": "String",
  "subcategory_code": "String",
  "title": "String",
  "organizer_or_body": "String",
  "occurrence_date": "YYYY-MM-DD",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD | null",
  "description": "String (Narrative text only)",
  "status": "draft | submitted | under_review | revisions_requested | verified | rejected",
  "structured_metadata": {
    "schema_version": "1.0",
    "key": "value"
  },
  "structured_details": [
    {
      "key": "machine_key",
      "label": "Human Readable Label",
      "value": "machine_value",
      "display_value": "Human Readable Value"
    }
  ],
  "evidence": [
    {
      "id": "UUID",
      "original_filename": "String",
      "mime_type": "String",
      "file_size": 1024
    }
  ],
  "verification": {
    "status": "String",
    "submitted_at": "YYYY-MM-DD HH:MM:SS | null",
    "verified_at": "YYYY-MM-DD HH:MM:SS | null",
    "remarks": "String | null"
  }
}
```
