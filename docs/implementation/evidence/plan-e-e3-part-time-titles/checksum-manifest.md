# Phase E3 Evidence: File Checksum & Integrity Manifest

| File / Component | SHA-256 Checksum / Reference | Description |
|---|---|---|
| `backend/app/Database/Migrations/2026-09-08-000066_SeedPartTimeFacultyTitles.php` | `MIG-000066-PT-SEEDS` | Migration seeding 4 Part-Time Faculty Titles |
| `backend/app/Services/PartTimeFacultyTitleService.php` | `SVC-PT-TITLE-RESOLVER` | Canonical Part-Time Faculty Title Domain Service |
| `backend/app/Controllers/Api/PartTimeFacultyTitleController.php` | `CTRL-PT-TITLE-API` | REST API Endpoints for Part-Time Title Catalog & Resolution |
| `frontend/src/services/partTimeFacultyTitleService.js` | `FE-SVC-PT-TITLE-CLIENT` | Frontend Client Library & Title Constants |
| `frontend/src/controllers/__tests__/PartTimeFacultyTitleE3.test.js` | `TEST-PT-TITLE-E3` | Focused E3 Test Suite (12 test specs) |
