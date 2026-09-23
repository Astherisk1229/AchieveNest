# Master Seed Source & Service Map

| Catalog | Table | Migration | Seeder / Constant | Service | API Route |
|---|---|---|---|---|---|
| Full-Time Rank Catalog | `faculty_ranks` | `2026-09-08-000065_SeedFacultyRankCatalog.php` | `FacultyRankCatalogService.php` / `facultyRankCatalogService.js` | `FacultyRankCatalogService` | `GET /api/faculty-ranks` |
| Part-Time Title Catalog | `part_time_faculty_titles` | `2026-09-08-000066_SeedPartTimeFacultyTitles.php` | `PartTimeFacultyTitleService.php` / `partTimeFacultyTitleService.js` | `PartTimeFacultyTitleService` | `GET /api/part-time-faculty-titles` |
| Initial Rank Recommendations | N/A (Rule Engine) | N/A | `FacultyInitialRankService.php` / `facultyInitialRankService.js` | `FacultyInitialRankService` | `POST /api/hr/recommend-rank` |
| Rank Progression & Transitions | `faculty_rank_transitions` | `2026-09-08-000065_SeedFacultyRankCatalog.php` | `FacultyRankProgressionService.php` | `FacultyRankProgressionService` | `POST /api/hr/apply-rank-progression` |
