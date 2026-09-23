# Phase 2C — Form and API Field Map
## User Interface Elements, Server Validation Contracts, and Error Responses

**Domain:** Campus Journalism Portfolio Form & API Contract  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:35:00 UTC+08:00  

---

## 1. User Interface Form Elements (Conditional Rendering)

When a student selects **Campus Journalism / Publication** (`2b09cd61-7a23-4466-be58-889398e8f201`), the form conditionally exposes the following structured sections:

### 1.1 Step 1: Basic Details

```text
Title of Published Work *
[____________________________________________________]
Helper: Enter the exact published headline or title of the piece.

Publication Outlet / Issuing Body *
[ e.g. The NDMU Herald / Marist Gazette ____________]
Helper: Enter the official publication or outlet where the work appeared.
```

### 1.2 Step 2: Campus Journalism Classification

```text
Publication Type *
[ Select Publication Type ▼ ]
  - News Item Evidence (COMP_JOURN_NEWS)
  - Literary Evidence (COMP_JOURN_LITERARY)
  - Column Evidence (COMP_JOURN_COLUMN)
  - Editorial Evidence (COMP_JOURN_EDITORIAL)
  - Publication Officer Role (COMP_JOURN_LEAD_ROLE)
  - Member / Contributor Role (COMP_JOURN_LEAD_ROLE)
Helper: Select the type that best describes your published work or editorial role.

Authorship / Contribution Role *
[ Select Role ▼ ]
  - Writer / Author
  - Editor / Section Editor
  - Layout / Photojournalist
  - Contributor
Helper: Select your primary contribution to this published work.

Publication Date *
[ YYYY-MM-DD ]
Helper: Enter the formal date of publication (must not be a future date).
```

### 1.3 Step 3: Supporting Evidence & Proof

```text
Supporting Evidence Document (PDF/JPG/PNG) *
[ Drag & drop published clipping, scan, or certificate ]
Helper: Provide proof of publication showing the title, date, byline, and publication outlet.
```

---

## 2. API Contract Specification (`POST /api/v1/portfolio`)

### 2.1 Request Payload (JSON)
```json
{
  "category_id": "2b09cd61-7a23-4466-be58-889398e8f201",
  "subcategory_id": "40000009-0001-0000-0000-000000000004",
  "title": "Editorial: The Ethical Horizon of Generative AI in Higher Education",
  "organizer_or_body": "The NDMU Herald",
  "occurrence_date": "2025-10-15",
  "description": "Published editorial piece discussing academic integrity and AI adoption in collegiate coursework.",
  "structured_metadata": {
    "contribution_role": "writer",
    "publication_name": "The NDMU Herald",
    "issue_volume": "Vol. 42 No. 1",
    "page_number": "p. 4"
  },
  "submit_now": true,
  "evidence": [
    {
      "storage_path": "evidence/student/std_001/rec_001/herald_editorial_scan.pdf",
      "original_filename": "herald_editorial_scan.pdf",
      "mime_type": "application/pdf",
      "byte_size": 245819,
      "evidence_type": "publication_scan"
    }
  ]
}
```

### 2.2 Successful Response (`201 Created`)
```json
{
  "data": {
    "message": "Portfolio record created successfully.",
    "id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    "status": "submitted"
  }
}
```

---

## 3. Server-Side Validation Error Codes & Responses

| Error Code | HTTP Status | Validation Condition | Message |
|---|:---:|---|---|
| `MISSING_PUBLICATION_TYPE` | `422` | `isJournalism` and `subcategory_id` is empty. | `Campus Journalism achievements require a specific Publication Type or Role Subcategory before submission.` |
| `MISSING_PUBLICATION_OUTLET` | `422` | Publication type selected but `organizer_or_body` is empty. | `Publication Outlet (organizer_or_body) is mandatory for Campus Journalism publication records.` |
| `MISSING_PUBLICATION_DATE` | `422` | Publication type selected but `occurrence_date` is empty. | `Publication Date is mandatory for Campus Journalism publication records.` |
| `INVALID_PUBLICATION_DATE` | `422` | `occurrence_date` is in the future. | `Publication Date cannot be a future date.` |
| `MISSING_CONTRIBUTION_ROLE` | `422` | `structured_metadata.contribution_role` is empty. | `Student Contribution / Authorship Role (e.g., Writer, Editor, Contributor) is mandatory.` |
| `MISSING_EVIDENCE_ATTACHMENT` | `422` | `submit_now = true` with zero evidence items. | `At least one supporting evidence attachment is mandatory before submitting a Campus Journalism publication record.` |
| `INVALID_TAXONOMY_COMBINATION` | `422` | `subcategory_id` does not belong to `category_id`. | `Subcategory does not belong to the selected category.` |
| `UNAUTHORIZED` | `401` | Session token missing or invalid. | `Valid active authenticated session required.` |
| `FORBIDDEN` | `403` | Non-student account attempting to create portfolio item. | `Only student accounts can create portfolio records.` |
