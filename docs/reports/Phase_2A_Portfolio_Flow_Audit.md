# Phase 2A — Audit of Existing Portfolio Entry Flow
## AchieveNest Campus Journalism Portfolio Classification & Metadata Capture

**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Audit Scope:** Student Portfolio Submission Flow, UI Components, Controllers, and Database Mappings  
**Audit Timestamp:** 2026-08-31 22:35:00 UTC+08:00  

---

## 1. Executive Objective

Workstream 2A audits the existing user interfaces, API endpoints, and database entry points where student portfolio achievements are created, edited, and submitted. The goal is to determine where Phase 2 Campus Journalism metadata must be captured, validate existing fields for reuse, and prevent duplicate data entry forms or divergent schema definitions.

---

## 2. Inventory of Existing Portfolio Entry Interfaces and Controllers

### 2.1 User Interfaces & Modals

| UI Artifact | Path / Location | Purpose / Scope | Reusability Assessment |
|---|---|---|---|
| **`AchievementSubmissionModal.jsx`** | `frontend/src/pages/student/modals/AchievementSubmissionModal.jsx` | 3-Step Wizard for student achievement submission (Basic Details, Scope/Rank, Proof/Summary). | **Core Entry Point**: Reusable. Augmented with conditional Campus Journalism publication and role fields. |
| **`StudentAchievementsPage.jsx`** | `frontend/src/pages/student/StudentAchievementsPage.jsx` | Student overview page showing achievements list, filter by category/status, statistics, and submission triggers. | **Overview & Filter Point**: Reused. Exposes category and status filters. |
| **`StudentPortfolioPage.jsx`** | `frontend/src/pages/student/StudentPortfolioPage.jsx` | Student portfolio view with experience timeline, verified accomplishments, and export preview. | **Presentation View**: Reused. Renders verified accomplishments with supporting evidence. |
| **`StudentAchievementPreviewModal.jsx`** | `frontend/src/pages/student/modals/StudentAchievementPreviewModal.jsx` | Preview modal inspecting achievement details, evidence files, and verification timeline. | **Detail View**: Reused. Displays structured metadata fields and attached files. |

### 2.2 Backend Controllers & Services

| Backend Artifact | Path / Location | Purpose / Scope | Reusability Assessment |
|---|---|---|---|
| **`StudentPortfolioController.php`** | `backend/app/Controllers/Api/StudentPortfolioController.php` | REST API handling `POST /api/v1/portfolio` (create), `POST /api/v1/portfolio/{id}/evidence` (upload), `POST /api/v1/portfolio/{id}/resubmit`, and Program Coordinator queue. | **Authoritative API**: Enforces strict server-side validation (VR-2.1 to VR-2.12). |
| **`EvidenceMappingService.php`** | `backend/app/Services/EvidenceMappingService.php` | Evaluates verified records against award mapping rules and structured metadata conditions. | **Engine Bridge**: Reused to route qualifying structured metadata to scoring components. |
| **`LocalEvidenceStorageService.php`** | `backend/app/Services/LocalEvidenceStorageService.php` | Validates MIME types, file sizes, SHA256 checksums, and manages physical storage paths. | **Evidence Engine**: Reused for file storage and metadata formatting. |

---

## 3. Required Campus Journalism Field Reconciliation Table

| Required Campus Journalism Field | Existing UI Field | Existing DB Field / Column | Reusable? | Change Needed / Adaptation |
|---|---|---|:---:|---|
| **Portfolio Category** | Category Dropdown (`categoryId`) | `student_portfolio_records.category_id` | **Yes** | Reused. Resolves to `Campus Journalism / Publication` (`2b09cd61-7a23-4466-be58-889398e8f201`). |
| **Publication Type** | Subcategory / Classification | `student_portfolio_records.subcategory_id` | **Yes** | Reused. Maps to News Item (`...0001`), Literary (`...0002`), Column (`...0003`), Editorial (`...0004`). |
| **Title of Published Work** | Achievement Title (`title`) | `student_portfolio_records.title` | **Yes** | Reused. Required non-empty string. |
| **Publication Outlet / Publisher** | Issuing Body (`issuerOrganization`) | `student_portfolio_records.organizer_or_body` | **Yes** | Reused. Captures campus newspaper / publication outlet name. |
| **Publication Date** | Date Conferred (`dateAchieved`) | `student_portfolio_records.occurrence_date` (or `start_date`) | **Yes** | Reused. Validated calendar date, non-future. |
| **Contribution / Authorship Role** | Rank / Position Conferred | `structured_metadata->>'contribution_role'` | **Yes** | Reused & Structured. Captures `writer`, `editor`, `contributor`, etc. |
| **Leadership Involvement Role** | Rank / Position Conferred | `student_portfolio_records.subcategory_id` + `structured_metadata` | **Yes** | Reused. Maps to Officer (`...0006`) vs Member/Contributor (`...0005`). |
| **Recognition Level** | Geographic Scope / Level (`scopeLevel`) | `structured_metadata->>'recognition_level'` | **Yes** | Reused. Normalized to `Local`, `National`, `International`. |
| **Supporting Evidence Files** | Evidence Document & Photo Uploader | `student_portfolio_evidence` (1:N table) | **Yes** | Reused. 1 achievement $\rightarrow$ $N$ evidence files. Mandatory on submission. |
| **Verification State** | Status (`status`) | `student_portfolio_records.status` | **Yes** | Reused. Transitions `draft` $\rightarrow$ `submitted` $\rightarrow$ `verified` / `rejected`. |
| **Lifecycle State** | Archive / Active flag | `student_portfolio_records.status` / evidence status | **Yes** | Reused. Independent from verification outcome. |

---

## 4. Gate 2A Conclusion

- **Gate Status:** **PASSED**
- The existing portfolio creation flow, UI wizard, and backend database schema contain all necessary entry points and storage columns. No redundant tables or parallel forms are required.
- All Phase 2 metadata is captured through structured schema validation on `student_portfolio_records`, `portfolio_subcategories`, `structured_metadata`, and `student_portfolio_evidence`.
