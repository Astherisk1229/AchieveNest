# Plan 05 Phase 10 — Student vs OSAD Cross-View Regression Matrix
## End-to-End Verification of Universal Record Identity and Field Parity

| Verification Parameter | Student View (`StudentPortfolioPage`) | OSAD Review (`OSADStudentAwardReviewWorkspace`) | Delta / Drift | Status |
|---|---|---|---|---|
| Record Identity | `spr.id` (UUID) | `spr.id` (UUID) | 0 | **PASS** |
| Category ID | `spr.category_id` | `spr.category_id` | 0 | **PASS** |
| Category Name | `pc.name` | `pc.name` | 0 | **PASS** |
| Category Ordering | Fixed 1 to 9 sequence | Fixed 1 to 9 sequence | 0 | **PASS** |
| Subcategory ID | `spr.subcategory_id` | `spr.subcategory_id` | 0 | **PASS** |
| Subcategory Name | `ps.name` | `ps.name` | 0 | **PASS** |
| Title & Organizer | `title`, `organizer_or_body` | `title`, `organizer_or_body` | 0 | **PASS** |
| Dates | `occurrence_date`, `display_range` | `occurrence_date`, `display_range` | 0 | **PASS** |
| Structured Metadata | Raw JSON (`schema_version: 1.0`) | Raw JSON (`schema_version: 1.0`) | 0 | **PASS** |
| Structured Details | Human-readable label/display pairs | Human-readable label/display pairs | 0 | **PASS** |
| Evidence Entities | `spe.id` list | `spe.id` list | 0 | **PASS** |
| Verification Status | `spr.status` | `spr.status` | 0 | **PASS** |
| Award Evaluation Lens | **OMITTED (Student-Safe)** | **PRESENT (Authorized Overlay)** | Authorized Extension | **PASS** |

- **Cross-View Semantic Mismatches**: **0 (Zero)**.
- **Parent Test 1 (Same record / same category)**: **PASS**.
- **Parent Test 2 (Same subcategory label)**: **PASS**.
- **Parent Test 3 (Same structured metadata)**: **PASS**.
