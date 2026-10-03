# Phase 1D — Required Campus Journalism Metadata Mapping
## Canonical Field Storage, Schema Location, and Lifecycle Separation

**Domain:** Campus Journalism Portfolio Records & Supporting Evidence  
**Scope:** Workstream 1D Field Mapping and Schema Integrity  
**Timestamp:** 2026-08-31 22:30:00 UTC+08:00  

---

## 1. Executive Objective

Phase 1 requires authoritative mapping for all required Campus Journalism data fields before introducing additional columns or tables. In accordance with the non-negotiable design principles:
1. Normalized fields are reused when semantics match.
2. Existing taxonomy and reference structures are leveraged.
3. Verification state is strictly separated from record lifecycle / deletion state.
4. No unstructured or ambiguous free text is used for deterministic scoring classifications.

---

## 2. Publication Metadata Field Mapping Matrix

| Required Logical Field | Target Database Entity | Target Column / Path | Data Type | Permitted Domain / Enumeration | Authoritative Meaning & Scoring Effect |
|---|---|---|---|---|---|
| **Portfolio Category** | `student_portfolio_records` | `category_id` | UUID / CHAR(36) | `2b09cd61-7a23-4466-be58-889398e8f201` (`Campus Journalism / Publication`) | Identifies record as belonging to the Campus Journalism taxonomy. |
| **Publication Type / Subcategory** | `student_portfolio_records` | `subcategory_id` | UUID / CHAR(36) | - `40000009-0001-0000-0000-000000000001` (News Item)<br>- `40000009-0001-0000-0000-000000000002` (Literary)<br>- `40000009-0001-0000-0000-000000000003` (Column)<br>- `40000009-0001-0000-0000-000000000004` (Editorial)<br>- `40000009-0001-0000-0000-000000000005` (Member/Contributor)<br>- `40000009-0001-0000-0000-000000000006` (Publication Officer) | Deterministic classifier routing records to components via `award_evidence_mapping_rules`. |
| **Title of Published Work** | `student_portfolio_records` | `title` | TEXT / VARCHAR(255) | Non-empty string | Human-readable title of the article, editorial, column, or literary work. |
| **Publication Outlet / Publisher** | `student_portfolio_records` | `organizer_or_body` | TEXT / VARCHAR(255) | Official campus publication outlet name (e.g. *The Beacon*, *Marist Gazette*) | Verified publishing body or editorial board. |
| **Publication Date** | `student_portfolio_records` | `occurrence_date` (or `start_date`) | DATE | Valid ISO 8601 Date (`YYYY-MM-DD`) | Date when work was formally published in print or verified institutional media. |
| **Student Role / Contribution** | `student_portfolio_records` | `structured_metadata->>'role'` or `subcategory_id` | VARCHAR(50) | `officer`, `staff`, `member`, `contributor`, `writer`, `editor` | Distinguishes leadership tiers (Officer = 3 pts vs. Member/Contributor = 2 pts). |
| **Recognition Level** | `student_portfolio_records` | `structured_metadata->>'recognition_level'` | VARCHAR(50) | `international`, `national`, `local`, `institutional` | Evaluated under Journalism Awards component (`international`/`national` = 3 pts, `local` = 2 pts). |
| **Supporting Evidence Files** | `student_portfolio_evidence` | `storage_path`, `original_filename`, `mime_type`, `byte_size` | Relational 1:N Table | One or more file rows linked via `portfolio_record_id` | Verifiable files (PDF, scan, URL proof). Files do NOT multiply achievement score. |
| **Verification Status** | `student_portfolio_records` | `status` | VARCHAR(30) | `draft`, `submitted`, `revision_requested`, `verified`, `rejected` | Only records in `status = 'verified'` contribute to scoring. |
| **Record Lifecycle State** | `student_portfolio_records` | `status` (or archive flag) | VARCHAR(30) | `archived`, `active` | Soft deletion / archival state is independent of verification outcome. |

---

## 3. Strict Separation of Verification Status vs. Lifecycle State

A critical requirement of the system architecture is preventing the semantic confusion of verification states with lifecycle or deletion states.

```text
Student Portfolio Record Lifecycle
┌───────────────────────────────────────────────────────────┐
│ Lifecycle: Active (Normal)                                │
│   ├─ Verification: draft (Unsubmitted)                    │
│   ├─ Verification: submitted (Under Review)               │
│   ├─ Verification: revision_requested (Pending Student)   │
│   ├─ Verification: verified (Eligible for Scoring)        │
│   └─ Verification: rejected (Ineligible for Scoring)      │
└───────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────┐
│ Lifecycle: Archived / Superseded (Removed by User/Admin)  │
│   └─ Scoring Effect: 0 points (Excluded from queries)     │
└───────────────────────────────────────────────────────────┘
```

### Key Storage Invariants:
1. `student_portfolio_records.status` contains:
   - `draft`
   - `submitted`
   - `revision_requested`
   - `verified` (Only status eligible for point computation)
   - `rejected`
   - `archived` (Lifecycle removal)
2. `student_portfolio_evidence.status` contains:
   - `active`
   - `superseded`
   - `removed`
3. Archiving or superseding an evidence file updates `student_portfolio_evidence.status` without altering the parent achievement's existence or duplicating records.

---

## 4. Structured Metadata JSON Schema (`structured_metadata`)

For extended journalistic attributes that do not warrant separate physical table columns, `student_portfolio_records.structured_metadata` enforces the following validated JSON schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CampusJournalismMetadata",
  "type": "object",
  "properties": {
    "publication_name": {
      "type": "string",
      "description": "Name of the campus publication outlet or journal."
    },
    "issue_volume": {
      "type": "string",
      "description": "Volume/Issue number of the publication."
    },
    "page_number": {
      "type": "string",
      "description": "Page or column location of published piece."
    },
    "journalism_role": {
      "type": "string",
      "enum": ["officer", "staff", "member", "contributor", "editor_in_chief", "section_editor"],
      "description": "Student's official editorial board or staff role."
    },
    "recognition_level": {
      "type": "string",
      "enum": ["international", "national", "regional", "local", "institutional"],
      "description": "Scope of journalism award/citation if applicable."
    },
    "is_seminar_training": {
      "type": "boolean",
      "description": "Flag for non-scoring supporting journalism training."
    }
  },
  "additionalProperties": true
}
```

---

## 5. Conclusion & Phase 2 Handoff Guidance

All 9 required fields have authoritative, unambiguous relational and indexed JSON storage locations. Phase 2 (Portfolio Classification and Metadata Capture) can safely render student input forms and admin verification interfaces against this exact schema.
