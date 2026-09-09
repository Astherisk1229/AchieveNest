# AchieveNest — Phase D: Student Portfolio Relationship Report

> **Domain:** Master Portfolio Taxonomy, Student Portfolio Records, and Evidence Attachments  

---

## Portfolio Relational Architecture

1. **Authoritative Taxonomy (9 Primary Categories, 57 Subcategories)**:
   - `portfolio_categories (1)` $\rightarrow$ `(N) portfolio_subcategories` via `category_id`
2. **Student Master Records**:
   - `profiles / student_profiles (1)` $\rightarrow$ `(N) student_portfolio_records`
   - `portfolio_categories (1)` $\rightarrow$ `(N) student_portfolio_records` via `category_id`
   - `portfolio_subcategories (1)` $\rightarrow$ `(N) student_portfolio_records` via `subcategory_id`
3. **Evidence Attachments (1:N)**:
   - `student_portfolio_records (1)` $\rightarrow$ `(N) student_portfolio_evidence` via `portfolio_record_id`
4. **Verification Audit Trail**:
   - `student_portfolio_records (1)` $\rightarrow$ `(N) student_portfolio_verification_events`
