# AchieveNest — Student Portfolio & OSAD Portfolio Review Format Alignment
## Plan 05 — Student Owner View vs OSAD Evaluation View Differences

---

### 1. View Comparison Matrix

| Functional Concept | Student Owner View (`StudentPortfolioPage`) | OSAD Evaluation View (`OSADStudentAwardReviewWorkspace`) | Alignment Classification |
|---|---|---|---|
| **Underlying Record Model** | `student_portfolio_records` | `student_portfolio_records` | **IDENTICAL (100% Match)** |
| **Record IDs** | UUID | UUID | **IDENTICAL (100% Match)** |
| **9-Category Taxonomy** | Fixed Rank 1–9 | Fixed Rank 1–9 | **IDENTICAL (100% Match)** |
| **57 Subcategories** | Authoritative Subcategories | Authoritative Subcategories | **IDENTICAL (100% Match)** |
| **Structured Details** | Human-readable pairs | Human-readable pairs | **IDENTICAL (100% Match)** |
| **Evidence Entities** | `spe.id` list | `spe.id` list | **IDENTICAL (100% Match)** |
| **Verification State** | Status badge (`verified`, etc.) | Status badge (`verified`, etc.) | **IDENTICAL (100% Match)** |
| **Permitted User Actions** | Add, Edit, Delete, Resubmit | Verify, Request Revisions, Reject, Score | **Role-Appropriate Actions** |
| **Verification Audit Log** | Summary feedback only | Full chronological event history | **Authorized Extension** |
| **Award Lens Selector** | **OMITTED (Student-Safe)** | **PRESENT (Dynamic Selector)** | **Authorized Extension** |
| **Award Relevance Badges**| **OMITTED** | **PRESENT (`is_relevant`, `reason`)** | **Authorized Extension** |
| **Criteria & Score Breakdown**| **OMITTED** | **PRESENT (Stage 1 point trace)** | **Authorized Extension** |
| **Deliberation Remarks** | **OMITTED** | **PRESENT (Committee notes)** | **Authorized Extension** |

---

### 2. Zero Leakage Security Guarantee
- Students never see award selection menus, criteria weightings, point scores, or potential candidate indicators.
- Server-side scope policy completely excludes `osad_evaluation` and internal logs from all Student API responses.
