# Plan E Full-Time Rank Catalog Audit — Plan D2 Phase D2-0

### Backend Source & Architecture
- **Database Table**: `faculty_rank_catalog`
- **Model / Service**: `FacultyRankCatalog.php` / `FacultyRankCatalogService.php`
- **Frontend Service**: `facultyRankCatalogService.js` (`fetchFullTimeFacultyRanks`, `fetchRankByCode`, `fetchRankHierarchy`)
- **Canonical Seed Version**: `2026.1` (`NDMU-DOC-ACAD-RANKS-2026-V1`)
- **Total Catalog Size**: Exactly 26 Full-Time Academic Ranks across 4 Qualification Tiers:
  1. **Doctoral Tier** (Orders 1–9):
     - `UNIVERSITY_PROFESSOR` (University Professor)
     - `UNIVERSITY_PROFESSOR_IV` to `I`
     - `PROFESSOR_IV` to `I`
  2. **Master's Tier** (Orders 10–19):
     - `ASSOCIATE_PROFESSOR` (Associate Professor)
     - `ASSOCIATE_PROFESSOR_IV` to `I`
     - `ASSISTANT_PROFESSOR` (Assistant Professor)
     - `ASSISTANT_PROFESSOR_IV` to `I`
  3. **Board Licensure Tier** (Orders 20–24):
     - `SENIOR_INSTRUCTOR` (Senior Instructor)
     - `SENIOR_INSTRUCTOR_IV` to `I`
  4. **Baccalaureate Tier** (Orders 25–26):
     - `INSTRUCTOR_I` (Instructor I)
     - `ASSISTANT_INSTRUCTOR` (Assistant Instructor)

### Verified API Endpoints Available for Reuse
- `GET /api/v1/faculty-ranks` (Accepts query parameter `tier` for filtering)
- `GET /api/v1/hr/faculty-ranks`
- `GET /api/v1/faculty-ranks/{code}`
- `GET /api/v1/faculty-ranks/hierarchy`
