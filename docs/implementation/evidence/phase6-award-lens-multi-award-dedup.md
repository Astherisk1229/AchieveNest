# Plan 05 Phase 6 — Multi-Award Support & Subsection Deduplication
## Verification of Multi-Award Mapping & Double-Count Prevention

### 1. Multi-Award Support Model
- One master portfolio record (e.g. `PRISAA Regional Basketball Championship`) can be evaluated across multiple awards:
  - *Athlete of the Year (Sports)* -> Evaluated against tournament champion criteria (30 pts).
  - *Special Citation for Sports* -> Evaluated against regional representation criteria (15 pts).
- Underlying record is never duplicated in the database.

### 2. Same-Subsection Deduplication
- Composite Deduplication Key: `"{subsection_id}:{portfolio_record_id}"`.
- Result: Even if multiple mapping rules resolve to the same record within one criteria subsection, the scoring engine counts it exactly once.
- Double-Counting within the same subsection: **BLOCKED (0 instances)**.
