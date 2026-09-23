# Plan E Part-Time Title Catalog Audit — Plan D2 Phase D2-0

### Backend Source & Non-Progression Rule
- **Database Table**: `part_time_faculty_titles`
- **Backend Service**: `PartTimeFacultyTitleService.php`
- **Frontend Service**: `partTimeFacultyTitleService.js` (`fetchPartTimeTitles`, `fetchPartTimeTitleByCode`)
- **Canonical Seed Version**: `2026.1` (`NDMU-DOC-ACAD-RANKS-2026-V1`)
- **Strict Invariant**: Part-Time Faculty receive qualification-based titles but are **strictly excluded from Full-Time rank progression and rank promotion tracks**.

### The 4 Frozen Canonical Titles
1. `PT_PROFESSORIAL_LECTURER` — **Professorial Lecturer**
   - Tier: `doctoral`
   - Qualification Requirement: `Ph.D. / Ed.D.`
2. `PT_ASSISTANT_PROFESSORIAL_LECTURER` — **Assistant Professorial Lecturer**
   - Tier: `masters`
   - Qualification Requirement: `MA / MS / MAT / MD / LL.B. / Priests or Equivalent`
3. `PT_SENIOR_LECTURER` — **Senior Lecturer**
   - Tier: `board_licensure`
   - Qualification Requirement: `CPA / ENGR. / MEDTECH / CHEMIST / NURSE / DVM / ARCHITECT / DMD`
4. `PT_LECTURER` — **Lecturer**
   - Tier: `baccalaureate`
   - Qualification Requirement: `AB / BSE / BS or Equivalent`

### Verified API Endpoints Available for Reuse
- `GET /api/v1/faculty-titles/part-time`
- `GET /api/v1/faculty-titles/part-time/{code}`
