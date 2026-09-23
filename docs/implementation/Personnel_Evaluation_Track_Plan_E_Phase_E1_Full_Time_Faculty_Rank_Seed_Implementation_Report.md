# Personnel Evaluation Track — Plan E — Phase E1
# Full-Time Faculty Rank Seed Implementation Report

**Track:** Personnel Evaluation Track  
**Plan:** Plan E — Faculty Rank Catalog, Seeding & Progression Rules  
**Phase:** Phase E1 — Full-Time Faculty Rank Seed  
**Document Status:** Complete & Verified  
**Execution Timestamp:** 2026-09-08T23:27:00+08:00  

---

## 1. Executive Summary & Objective

Phase E1 (**Full-Time Faculty Rank Seed**) has successfully created and populated an idempotent, server-authoritative catalogue of the **26 frozen Full-Time Academic Ranks** in strict compliance with the frozen source reference `NDMU-DOC-ACAD-RANKS-2026-V1`.

This catalogue serves as a controlled reference dimension. Seeding it introduced zero mutations to `personnel_profiles.current_rank_title`, position titles, qualifications, Plan D eligibility records, Plan C evaluation roots, or submitted snapshots.

---

## 2. Database Schema & Migration Execution

- **Migration**: `2026-09-08-000064_CreateFacultyRankCatalog.php`
- **Table**: `faculty_rank_catalog`
- **Integrity Constraints**:
  - `PRIMARY KEY (id)`
  - `UNIQUE KEY uq_faculty_rank_type_code (catalog_type, rank_code)`
  - `UNIQUE KEY uq_faculty_rank_type_label (catalog_type, display_label)`
  - `INDEX idx_faculty_rank_tier (catalog_type, qualification_tier_code, display_order)`
- **Execution Result**:
  - Initial Run: 26 active rows inserted.
  - Idempotent Repeat Run: 26 rows verified without duplicate creation or unwanted updates.

---

## 3. Frozen Full-Time Faculty Rank Catalogue (26 Entities)

| Rank Code (`rank_code`) | Display Label (`display_label`) | Tier Code | Qualification Source Wording | Display Order |
| --- | --- | --- | --- | --- |
| `UNIVERSITY_PROFESSOR` | University Professor | `doctoral` | Ph.D./Ed.D. | 1 |
| `UNIVERSITY_PROFESSOR_IV` | University Professor IV | `doctoral` | Ph.D./Ed.D. | 2 |
| `UNIVERSITY_PROFESSOR_III` | University Professor III | `doctoral` | Ph.D./Ed.D. | 3 |
| `UNIVERSITY_PROFESSOR_II` | University Professor II | `doctoral` | Ph.D./Ed.D. | 4 |
| `UNIVERSITY_PROFESSOR_I` | University Professor I | `doctoral` | Ph.D./Ed.D. | 5 |
| `PROFESSOR_IV` | Professor IV | `doctoral` | Ph.D./Ed.D. | 6 |
| `PROFESSOR_III` | Professor III | `doctoral` | Ph.D./Ed.D. | 7 |
| `PROFESSOR_II` | Professor II | `doctoral` | Ph.D./Ed.D. | 8 |
| `PROFESSOR_I` | Professor I | `doctoral` | Ph.D./Ed.D. | 9 |
| `ASSOCIATE_PROFESSOR` | Associate Professor | `masters` | MA/MS/MAT/MD/LL.B./Priests or Equivalent | 10 |
| `ASSOCIATE_PROFESSOR_IV` | Associate Professor IV | `masters` | MA/MS/MAT/MD/LL.B./Priests or Equivalent | 11 |
| `ASSOCIATE_PROFESSOR_III` | Associate Professor III | `masters` | MA/MS/MAT/MD/LL.B./Priests or Equivalent | 12 |
| `ASSOCIATE_PROFESSOR_II` | Associate Professor II | `masters` | MA/MS/MAT/MD/LL.B./Priests or Equivalent | 13 |
| `ASSOCIATE_PROFESSOR_I` | Associate Professor I | `masters` | MA/MS/MAT/MD/LL.B./Priests or Equivalent | 14 |
| `ASSISTANT_PROFESSOR` | Assistant Professor | `masters` | MA/MS/MAT/MD/LL.B./Priests or Equivalent | 15 |
| `ASSISTANT_PROFESSOR_IV` | Assistant Professor IV | `masters` | MA/MS/MAT/MD/LL.B./Priests or Equivalent | 16 |
| `ASSISTANT_PROFESSOR_III` | Assistant Professor III | `masters` | MA/MS/MAT/MD/LL.B./Priests or Equivalent | 17 |
| `ASSISTANT_PROFESSOR_II` | Assistant Professor II | `masters` | MA/MS/MAT/MD/LL.B./Priests or Equivalent | 18 |
| `ASSISTANT_PROFESSOR_I` | Assistant Professor I | `masters` | MA/MS/MAT/MD/LL.B./Priests or Equivalent | 19 |
| `SENIOR_INSTRUCTOR` | Senior Instructor | `board_licensure` | CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD | 20 |
| `SENIOR_INSTRUCTOR_IV` | Senior Instructor IV | `board_licensure` | CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD | 21 |
| `SENIOR_INSTRUCTOR_III` | Senior Instructor III | `board_licensure` | CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD | 22 |
| `SENIOR_INSTRUCTOR_II` | Senior Instructor II | `board_licensure` | CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD | 23 |
| `SENIOR_INSTRUCTOR_I` | Senior Instructor I | `board_licensure` | CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD | 24 |
| `INSTRUCTOR_I` | Instructor I | `baccalaureate` | AB/BSE/BS or Equivalent | 25 |
| `ASSISTANT_INSTRUCTOR` | Assistant Instructor | `baccalaureate` | AB/BSE/BS or Equivalent | 26 |

---

## 4. Backend Services & REST APIs

1. **[`FacultyRankCatalogService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/FacultyRankCatalogService.php)**:
   - `getFullTimeFacultyRanks(?string $tierCode)`: Lists active Full-Time ranks in display order.
   - `getRankByCode(string $rankCode)`: Queries rank by stable code.
   - `getRankByLabel(string $label)`: Queries rank by verbatim display label.
   - `getRankHierarchy()`: Returns structured tier hierarchy with source metadata.
   - `getCatalogMetadata()`: Returns active counts and tier distribution summary.
2. **[`FacultyRankCatalogController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/FacultyRankCatalogController.php)**:
   - `GET /api/v1/faculty-ranks`: Active rank list with tier breakdown.
   - `GET /api/v1/faculty-ranks/{code}`: Single rank detail.
   - `GET /api/v1/faculty-ranks/hierarchy`: Grouped hierarchy DTO.
   - `GET /api/v1/hr/faculty-ranks`: HR catalogue query endpoint.
   - `POST/PUT/DELETE /api/v1/faculty-ranks`: Returns `403 CATALOG_MUTATION_RESTRICTED`.

---

## 5. Frontend Service & Verification

- **[`facultyRankCatalogService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/facultyRankCatalogService.js)**: Full-featured frontend client with static constants and API methods.
- **Dedicated Test Suite**: [`FacultyRankCatalogE1.test.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/FacultyRankCatalogE1.test.js) (14/14 passed):
  - 26 rank count & 4-tier distribution validation.
  - Verbatim string fidelity for all tiers.
  - API endpoint invocation and response mapping.
  - Strict exclusion of Part-Time titles and unverified ranks.

---

## 6. Evidence Package

Consolidated in [`docs/implementation/evidence/plan-e-e1-seed/`](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-e-e1-seed/):
- [`plan-e-e1-code-map.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-e-e1-seed/plan-e-e1-code-map.md)
- [`plan-e-e1-idempotency-and-rollback-evidence.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-e-e1-seed/plan-e-e1-idempotency-and-rollback-evidence.md)
- [`checksum-manifest.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-e-e1-seed/checksum-manifest.md)

---

## 7. Exit Gate Declaration

Phase E1 is fully satisfied: the 26 Full-Time Academic Ranks are seeded idempotently, source-traceability is verified, read-only APIs are operational, and no personnel or Plan C data was mutated.

$$\mathbf{PHASE\ E1\ COMPLETE\ —\ FULL-TIME\ FACULTY\ RANK\ SEED\ VERIFIED}$$

**Ready for Next Phase**: **Phase E2 — Part-time Faculty Title Seed**.
