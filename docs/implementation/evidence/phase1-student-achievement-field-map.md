# AchieveNest — Plan 04 Phase 1
## Evidence: Student Achievement Field & Overload Map

---

### 1. Current Frontend Form Fields vs Authoritative Backend Fields

| Field | Current UI Label | Form Step | Structured or Free Text? | DB Column / Storage | Overload Status |
|---|---|---|---|---|---|
| `title` | Award / Achievement Title | Step 1 | Free Text | `student_portfolio_records.title` | Title only |
| `event_name` | Event / Competition Name | Step 1 | Free Text | `student_portfolio_records.title` (overloaded) | MIXED USE |
| `issuer` / `location` | Issuing Body / Organization | Step 1 | Free Text | `student_portfolio_records.organizer_or_body` | Standard |
| `category` | Category | Step 2 | Enum (5 hardcoded) | `student_portfolio_records.category_id` | Mismatched Taxonomy |
| `scope_level` | Geographic Scope / Level | Step 2 | Enum | `structured_metadata.event_level` / `scope` | Needs JSON normalization |
| `rank_conferred` | Rank / Position Conferred | Step 2 | Enum (7 options) | `structured_metadata.placement` / `role` | OVERLOADED STRUCTURED DATA |
| `academic_year` | Academic Year | Step 2 | Enum | `structured_metadata.academic_year` | Structured Metadata |
| `semester` | Term / Semester | Step 2 | Enum | `structured_metadata.semester` | Structured Metadata |
| `dateAchieved` | Date Conferred | Step 2 | Date Picker | `student_portfolio_records.occurrence_date` | Date |
| `description` | Narrative Description | Step 3 | Free Text | `student_portfolio_records.description` | OVERLOADED STRUCTURED DATA |
| `attachedFile` | Supporting Evidence Document | Step 3 | File (PDF/PNG) | `student_portfolio_evidence` table | Evidence Attachment |
| `participationPhoto`| Photo Evidence of Participation | Step 3 | File (JPG/PNG) | `student_portfolio_evidence` table | Evidence Attachment |

---

### 2. Overloaded Generic Fields Analysis

- **`rank_conferred`**: Currently lumps together Academic Honors (*Dean's Lister*), Competition Outcomes (*Champion / 1st Place*, *2nd Place*, *Finalist*), and Leadership Positions (*Leadership Officer / Lead*).
- **`description`**: Students are forced to enter leadership responsibilities, volunteer hours, publication types, and competition details into free text description because no category-specific structured fields exist in the UI.
