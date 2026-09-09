# Plan 04 Phase 8 — Double-Count and Deduplication Audit
## Multi-Award Capability vs Subsection Exclusivity

### 1. Multi-Award Support Architecture
- A single verified portfolio record (e.g. `PRISAA Regional Basketball Championship`) can legitimately serve as evidence for both `Athlete of the Year` and `Most Outstanding Student`.
- Mapping occurs via distinct evaluation association records referencing the single canonical `portfolio_record_id`.
- The database record in `student_portfolio_records` is never cloned or duplicated.

### 2. Subsection Deduplication Rule
- Within any single award scoring subsection (e.g., `sports_regional_champion`), duplicate submissions of the exact same event/result are detected and only scored once.
- Submissions sharing the same subcategory and event identity within a single award criteria subsection are deduplicated using composite keys (`subsection_key:portfolio_record_id`).
