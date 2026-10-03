# AchieveNest — Student Achievement Entry & Dynamic Category-Based Structured Forms
## Final Architecture Specification

---

### 1. Architectural Overview

The AchieveNest Student Achievement Entry architecture provides a configuration-driven, category-adaptive structured form that captures co-curricular and extra-curricular student accomplishments without exposing internal OSAD award-scoring criteria, points, or rubrics.

```text
+-------------------------------------------------------------------------------+
|                             STUDENT FRONTEND                                  |
|                                                                               |
|  [AchievementSubmissionModal.jsx] (Single Form-State Authority)               |
|      ├── [SharedAchievementFields.jsx] (Title, Organizer, Dates, Description) |
|      ├── [Category & Subcategory Selectors] (Authoritative 9/57 Taxonomy)     |
|      ├── [StructuredDetailsFields.jsx] (Dynamic Schema-Driven Form Renderer)  |
|      └── [EvidenceUploadSection.jsx] (Canonical Single Upload Path)           |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼ POST /api/v1/portfolio
+-------------------------------------------------------------------------------+
|                             BACKEND API LAYER                                 |
|                                                                               |
|  [StudentPortfolioController.php]                                             |
|      ├── Actor Authorization & Profile Scoping                                |
|      ├── [PortfolioStructuredMetadataValidator.php] (17 Controlled Sets)      |
|      ├── DB Transaction Boundary (transStart / transComplete)                 |
|      └── [LocalEvidenceStorageService.php] (File Validation & Compensation)   |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼
+-------------------------------------------------------------------------------+
|                            DATABASE PERSISTENCE                               |
|                                                                               |
|  [student_portfolio_records]                                                  |
|      ├── Root Columns (title, organizer, dates, description, status)          |
|      ├── FKs (category_id, subcategory_id, student_profile_id)                |
|      └── JSON Column (structured_metadata with schema_version = "1.0")        |
|  [student_portfolio_evidence] (Child FK Rows)                                 |
|  [student_portfolio_verification_events] (Audit Trail)                        |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼ (On Verification)
+-------------------------------------------------------------------------------+
|                      INTERNAL OSAD AWARD EVALUATION                           |
|                                                                               |
|  [AwardEvidenceMappingService.php] (Verified-Only Direct JSON Mapping)        |
|  (0 Free-Text Dependency, 0 Student Award Selectors, 0 Scoring Exposure)       |
+-------------------------------------------------------------------------------+
```

---

### 2. Canonical Ownership & Component Authority

| System Concern | Authoritative Component / Store | Description |
|---|---|---|
| Primary Categories | `portfolio_categories` (DB) | 9 Authoritative Active Primary Categories |
| Subcategories | `portfolio_subcategories` (DB) | 57 Authoritative Active Subcategories |
| Schema Configuration | `portfolioFormSchemaRegistry.js` | Frontend Schema Registry defining dynamic inputs |
| Backend Validation | `PortfolioStructuredMetadataValidator.php` | Server validation enforcing taxonomy & vocabularies |
| Student Form Container | `AchievementSubmissionModal.jsx` | Single form-state authority |
| Shared Root Fields | `SharedAchievementFields.jsx` | Basic information UI & root DB columns |
| Dynamic Details UI | `StructuredDetailsFields.jsx` | Category-specific dynamic field renderer |
| Evidence Attachments | `EvidenceUploadSection.jsx` & `LocalEvidenceStorageService` | Canonical file attachment and storage engine |
| Portfolio Persistence | `student_portfolio_records` | Root database entity |
| Structured Data Storage | `student_portfolio_records.structured_metadata` | Clean single-encoded JSON metadata |
| Award Mapping Engine | `AwardEvidenceMappingService.php` | Internal verified-record evidence mapper |
| Verification Workflow | `VerificationQueueController` / `StudentPortfolioController` | Program Coordinator & OSAD verification |

---

### 3. Core Invariants

1. **Exact 9 Primary Categories & 57 Subcategories**: No mock categories, no forbidden top-level categories.
2. **Placement is Structured Metadata**: Placement / result is captured in `structured_metadata.placement`, never as a top-level category.
3. **Training & Development Classification Boundary**: Leadership, sports, and socio-cultural training are placed strictly under `Seminar / Training`.
4. **Zero Student Award Exposure**: 0 award selectors, 0 points, 0 rubrics, 0 scoring hints in student UI or API responses.
5. **Verified-Only Award Mapping**: Only records with `status = 'verified'` are eligible for internal OSAD evaluation.
6. **Zero Text Dependency for New Records**: Award scoring reads canonical structured JSON keys directly without parsing descriptions.
