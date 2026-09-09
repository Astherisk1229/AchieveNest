# Reusable Services & Endpoints Matrix — Plan D2 Phase D2-0

| Requirement | Existing Service / API Endpoint | Reusable? | Modification Needed? | Owner Plan / Domain |
|---|---|---|---|---|
| **Full-Time Rank List (26 ranks)** | `GET /api/v1/faculty-ranks`<br>`facultyRankCatalogService.js` | **YES** | None (Direct reuse in modal dropdown) | Plan E |
| **Part-Time Title List (4 titles)** | `GET /api/v1/faculty-titles/part-time`<br>`partTimeFacultyTitleService.js` | **YES** | None (Direct reuse in modal dropdown) | Plan E |
| **Initial Rank Recommendation** | `POST /api/v1/faculty-ranks/resolve-initial`<br>`facultyInitialRankService.js` | **YES** | Wire advisory suggestion badge/helper into modal | Plan E |
| **Part-Time Title Recommendation** | `partTimeFacultyTitleService.resolvePartTimeTitleSync` | **YES** | Wire advisory suggestion into modal | Plan E |
| **Institutional Colleges List** | `GET /api/v1/colleges`<br>`collegeAdminService.js` | **YES** | Replace personnel-scraping logic with direct API call | Institutional / Academic Structure |
| **Non-Academic Units / Offices** | `administrative_units` table | **YES** | Seed missing non-academic offices in later phase | Institutional Structure |
| **Personnel Provisioning (Create)** | `POST /api/v1/provisioning/manual-personnel`<br>`TargetProvisioningController.php` | **PARTIAL** | Whitelist `faculty_engagement`, `employment_status`, `current_rank_title`, `position_title`, `qualification_summary` | Plan D / D2 |
| **Personnel Master Data Edit** | `PUT /api/v1/hr/personnel/{id}/master-data`<br>`TargetHRPersonnelController.php` | **YES** | Support canonical rank code validation | Plan D / D2 |
