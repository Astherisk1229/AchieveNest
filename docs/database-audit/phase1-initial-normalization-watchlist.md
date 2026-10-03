# AchieveNest — Phase 1: Initial Normalization Watchlist

> **Phase:** 1 Baseline Watchlist for Subsequent 1NF/2NF/3NF Analysis  

---

| Item | Tables / Columns | Reason Flagged | Phase 1 Status | Later Phase Action |
|---|---|---|---|---|
| **Year Level** | `student_profiles.year_level`, `student_program_enrollments.year_level` | Possible duplicate source of truth | **REVIEW REQUIRED** | Functional dependency analysis (Phase B/E) |
| **Designation** | `profiles.designation_title` | May be personnel-specific attribute | **REVIEW REQUIRED** | Identity 3NF analysis (Phase E) |
| **Account Type** | `profiles.account_type`, `profile_roles` | Possible overlapping semantics | **REVIEW REQUIRED** | Role/source-of-truth analysis |
| **Sex** | `profiles.sex` | Single authoritative award eligibility source | **VERIFIED** | Constraint/integrity review |
| **Category Taxonomy** | `portfolio_categories`, `portfolio_subcategories` | Compare to locked 9 OSAD categories | **CAPTURED / LOCKED** | Category finalization verification |
| **Portfolio Metadata** | `student_portfolio_records.metadata` | Structured JSON metadata vs atomic columns | **VERIFIED** | Portfolio normalization audit |
