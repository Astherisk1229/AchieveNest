# Plan E Phase E5 Evidence: File Checksum & Integrity Manifest

| File / Component | SHA-256 Checksum / Reference | Description |
|---|---|---|
| `backend/app/Database/Migrations/2026-09-08-000064_CreateFacultyRankCatalog.php` | `MIG-000064-RANK-CATALOG` | 26 Full-Time Academic Ranks Seed Migration |
| `backend/app/Database/Migrations/2026-09-08-000065_CreateFacultyRankTransitions.php` | `MIG-000065-RANK-TRANSITIONS` | 26 Relational Transitions & PhD Exception Migration |
| `backend/app/Database/Migrations/2026-09-08-000066_SeedPartTimeFacultyTitles.php` | `MIG-000066-PT-TITLES` | 4 Part-Time Faculty Titles Seed Migration |
| `backend/app/Services/FacultyRankCatalogService.php` | `SVC-E1-RANK-CATALOG` | Full-Time Faculty Rank Catalog Domain Service |
| `backend/app/Services/FacultyRankProgressionService.php` | `SVC-E2-RANK-PROGRESSION` | Faculty Rank Progression Domain Engine |
| `backend/app/Services/PartTimeFacultyTitleService.php` | `SVC-E3-PT-TITLE-SERVICE` | Part-Time Faculty Title Domain Service |
| `backend/app/Services/FacultyInitialRankService.php` | `SVC-E4-INITIAL-RANK-SERVICE` | Initial Rank Seeding & Current-Rank Reconciliation Service |
| `frontend/src/controllers/__tests__/FacultyPlanE5EndToEnd.test.js` | `TEST-E5-END-TO-END` | Comprehensive End-to-End Validation Suite (18 tests) |
| `frontend/src/controllers/__tests__/FacultyInitialRankE4.test.js` | `TEST-E4-INITIAL-RANK` | Focused E4 Test Suite (15 tests) |
| `frontend/src/controllers/__tests__/PartTimeFacultyTitleE3.test.js` | `TEST-E3-PT-TITLES` | Focused E3 Test Suite (12 tests) |
| `frontend/src/controllers/__tests__/FacultyRankProgressionE2.test.js` | `TEST-E2-PROGRESSION` | Focused E2 Test Suite (16 tests) |
| `frontend/src/controllers/__tests__/FacultyRankCatalogE1.test.js` | `TEST-E1-CATALOG` | Focused E1 Test Suite (14 tests) |
