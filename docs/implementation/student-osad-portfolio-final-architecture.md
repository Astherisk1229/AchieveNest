# AchieveNest — Student Portfolio & OSAD Portfolio Review Format Alignment
## Plan 05 — Final Architecture Specification

---

### 1. One Master Portfolio Principle

```text
[One Student Profile]
        │
        ▼
[One Master Portfolio] (student_portfolio_records)
        │
        ├── 9 Canonical Categories (portfolio_categories)
        │       └── 57 Subcategories (portfolio_subcategories)
        │
        ├── Canonical Serializer (StudentPortfolioController)
        │       │
        │       ├── [Student-Safe View] ──────> Canonical facts + Evidence + Status (No OSAD scores)
        │       │
        │       └── [OSAD Review View] ───────> Canonical facts + Evidence + Status
        │                                             +
        │                                       [osad_evaluation Overlay]
        │                                             │
        │                                             ▼
        │                                     (Dynamic Award Lens)
```

**Foundational Rule**: A student has exactly **one master portfolio**. Institutional award evaluations, coordinator reviews, and administrative scoring never duplicate, mutate, or create a second portfolio.

---

### 2. Canonical Data Model Authorities

- **Master Records Authority**: `student_portfolio_records` table (Key: `id` UUID).
- **Evidence Authority**: `student_portfolio_evidence` table (Key: `id` UUID, FK: `portfolio_record_id`).
- **Verification Authority**: `student_portfolio_records.status` and `student_portfolio_verification_events`.
- **Primary Category Authority**: `portfolio_categories` (9 active categories, ordered 1 to 9).
- **Subcategory Authority**: `portfolio_subcategories` (57 authoritative subcategories).
- **Metadata Schema Version**: `"schema_version": "1.0"`.

---

### 3. Canonical Presentation Pipeline

```text
Database Entities (spr, pc, ps, spe)
        ↓
StudentPortfolioController (Single Canonical Serializer Authority)
        ↓
CanonicalPortfolioRecord Base DTO
        ├── id, title, organizer_or_body, occurrence_date, dates
        ├── category (id, name, code, order 1-9)
        ├── subcategory (id, name, code)
        ├── structured_details (Human-readable label/display pairs)
        ├── evidence (Universal UUID references)
        └── verification (status, timestamps, public remarks)
        ↓
Role Projection Engine:
  • If Actor == 'student': Returns Student-safe payload (0 OSAD score fields).
  • If Actor == 'osad_staff' | 'dean': Appends authorized 'osad_evaluation' decorator overlay.
```

---

### 4. Award Evaluation Lens Architecture

- **Role of Award Lens**: Non-destructive analytical projection powered by `AwardEvidenceMappingService.php`.
- **Zero Mutation Invariant**: Switching awards does not mutate record IDs, categories, subcategories, titles, dates, or evidence.
- **Multi-Award Support**: A single verified accomplishment can qualify for multiple awards without database record duplication.
- **Same-Subsection Deduplication**: Duplicate counting within the same criteria subsection is strictly blocked by composite key deduplication.
