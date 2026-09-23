# Plan 05 Phase 5 — OSAD Record Detail Alignment
## Field Alignment Between Student View Details and OSAD Record Inspection

| Section | Concept / Field | Student View Details | OSAD Record Inspector | Match Status |
|---|---|---|---|---|
| **Overview** | Record ID | `record_id` (UUID) | `record_id` (UUID) | **PASS** |
| | Title | `title` | `title` | **PASS** |
| | Category | `category.label` | `category.label` | **PASS** |
| | Subcategory | `subcategory.label` | `subcategory.label` | **PASS** |
| | Organizer / Body | `organizer_or_body` | `organizer_or_body` | **PASS** |
| | Date Range | `dates.display_range` | `dates.display_range` | **PASS** |
| | Description | Contextual narrative | Contextual narrative | **PASS** |
| **Structured Details** | Key-Value Presentation | Human-readable list | Human-readable list | **PASS** |
| | schema_version | `"1.0"` | `"1.0"` | **PASS** |
| **Evidence** | Attached Files | `student_portfolio_evidence` | `student_portfolio_evidence` | **PASS** |
| | Evidence IDs | Same UUIDs | Same UUIDs | **PASS** |
| **Verification** | Status Badge | `draft`, `verified`, etc. | `draft`, `verified`, etc. | **PASS** |
| | History Timeline | Summary remarks | Full chronological log | **PASS** (Authorized) |
| **Evaluation** | Award Relevance | Omitted (Student-safe) | Overlay extension | **PASS** (OSAD only) |
| | Points / Criteria | Omitted (Student-safe) | Overlay extension | **PASS** (OSAD only) |
| | Deliberation Notes | Omitted (Student-safe) | Overlay extension | **PASS** (OSAD only) |
