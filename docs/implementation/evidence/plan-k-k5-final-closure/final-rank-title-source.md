# Final Rank & Title Source Summary

## 1. Full-Time Faculty Rank Catalog
- **Authoritative Source**: `facultyRankCatalogService.js` (Plan E — Phase E1), `faculty_rank_catalog` database table.
- **Canonical Count**: Exactly **26 ranks** organized into 4 qualification tiers:
  1. **Doctoral Tier** (Orders 1–9): University Professor, University Professor IV–I, Professor IV–I
  2. **Master's Tier** (Orders 10–19): Associate Professor, Associate Professor IV–I, Assistant Professor, Assistant Professor IV–I
  3. **Board Licensure Tier** (Orders 20–24): Senior Instructor, Senior Instructor IV–I
  4. **Baccalaureate Tier** (Orders 25–26): Instructor I, Assistant Instructor
- **Progression**: Sequential rank-by-rank advancement upon `Passed` evaluation + HR `Approved` promotion decision. Verified PhD fast-track exception supported via explicit authorized workflow.

## 2. Part-Time Faculty Title Catalog
- **Authoritative Source**: `partTimeFacultyTitleService.js` (Plan E — Phase E3), `part_time_faculty_titles` table.
- **Canonical Count**: Exactly **4 titles**:
  1. **Professorial Lecturer** (`PT_PROFESSORIAL_LECTURER`, Order 1, Doctoral tier)
  2. **Assistant Professorial Lecturer** (`PT_ASSISTANT_PROFESSORIAL_LECTURER`, Order 2, Master's tier)
  3. **Senior Lecturer** (`PT_SENIOR_LECTURER`, Order 3, Board Licensure tier)
  4. **Lecturer** (`PT_LECTURER`, Order 4, Baccalaureate tier)
- **Strict Non-Progression**: Part-Time titles are qualification-driven only and are strictly excluded from ranking progression and promotional review.
