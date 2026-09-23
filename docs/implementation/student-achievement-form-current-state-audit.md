# AchieveNest — Student Achievement Entry & Dynamic Category-Based Structured Forms
## Plan 04 Phase 1 — Current Form Audit Report

---

### 1. Executive Summary

Plan 04 Phase 1 has audited the current Student Achievement / Portfolio Record workflow across frontend components, backend controllers, database tables, and award evidence mapping engines.

**Key Audit Findings:**
1. **Frontend Disconnect**: The current student interface (`StudentAchievementsPage.jsx` and `AchievementSubmissionModal.jsx`) employs a **Static Generic Form** with 5–6 hardcoded mock categories and zero subcategory selection, saving data to client `localStorage`.
2. **Authoritative Backend Ready**: The backend MySQL database `achievenest_local` contains **exactly 9 canonical categories**, **57 canonical subcategories**, `student_portfolio_records` with `structured_metadata` JSON storage, and full API endpoints (`StudentPortfolioController.php`).
3. **No Student Award Leakage**: The Student UI does not expose award selectors, award criteria, scoring rubrics, or points (100% compliant with the non-exposure policy).
4. **Overloaded Free-Text Fields**: Because the current form lacks dynamic category-specific fields, critical structured data (placements, roles, volunteer hours, publication types) are either forced into generic dropdowns (`rank_conferred`) or free-text narrative descriptions.
5. **No Code / Schema Changes**: As required by Phase 1 boundary rules, zero modifications to code, schema, or business rules were made during this audit.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)
- **Audit Timestamp**: `2026-09-01 13:21:00 UTC+8`

---

### 3. Current Student Entry Workflow

1. Student visits `StudentAchievementsPage.jsx`.
2. Student clicks the **"Add Achievement"** button.
3. `AchievementSubmissionModal.jsx` opens as a 3-step wizard:
   - **Step 1 (Basic Info)**: `title`, `event_name`, `issuerOrganization`.
   - **Step 2 (Scope & Rank)**: `categoryId`, `scopeLevel`, `rankConferred`, `academicYear`, `semester`, `dateAchieved`.
   - **Step 3 (Proof & Summary)**: `description`, `attachedFile`, `participationPhoto`.
4. Client stores the entry in `localStorage` via `StudentAchievementController.js`.

---

### 4. Primary Category Inventory

The backend database contains **exactly 9 categories**; frontend UI currently displays 5–6 hardcoded categories:

| Authoritative Category ID | Category Name | Database Code | UI Display Status | Match Status |
|---|---|---|---|---|
| `8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646` | Leadership Position | `LEADERSHIP_POSITION` | Displayed as "Leadership" | RENAME / ALIGN |
| `c9a6d837-78f4-4516-b2db-d438ae717be5` | Organization Membership / Participation | `ORG_MEMBERSHIP` | Missing in UI | MISSING IN UI |
| `ace24637-66f7-4329-9451-ccc61e18eab9` | Community Service / Volunteerism | `COMMUNITY_SERVICE` | Displayed as "Volunteerism & Community" | RENAME / ALIGN |
| `779a9653-d972-47ce-93dc-cb381150568b` | Church / Ministry Involvement | `CHURCH_MINISTRY` | Missing in UI | MISSING IN UI |
| `802de57b-54d7-4d38-9433-052ca9636380` | Seminar / Training | `SEMINAR_TRAINING` | Displayed as "Professional Development" | RENAME / ALIGN |
| `448beadb-a254-4cb6-84fb-a3d5f4f8822e` | Citation / Recognition | `CITATION_RECOGNITION` | Displayed as "Recognition" | RENAME / ALIGN |
| `2d20d412-bf34-46b4-a21d-d7131d4b514a` | Sports | `SPORTS` | Displayed as "Athletics" | RENAME / ALIGN |
| `6514e620-b5a0-4ff2-9353-0ee8787b5ce6` | Socio-Cultural / Performing Arts | `SOCIO_CULTURAL` | Displayed as "Arts & Culture" | RENAME / ALIGN |
| `2b09cd61-7a23-4466-be58-889398e8f201` | Campus Journalism | `CAMPUS_JOURNALISM` | Missing in UI | MISSING IN UI |

- **Forbidden Categories Check**: `Achievement`, `Civic`, `External`, `Placement`, `Award`, `Competition` are completely absent from the top-level database taxonomy (**0 forbidden categories**).

---

### 5. Subcategory Inventory

The backend database contains **57 canonical subcategories** across the 9 primary categories:
- **Leadership Position (4)**: SSG / University Student Government, Collegiate / College Council, Club / Organization, Year-Level Leadership.
- **Organization Membership / Participation (5)**: General Member, Committee Member, Activity Participant, Facilitator / Organizer, Project Contributor.
- **Community Service / Volunteerism (5)**: University-Based Service, Community-Based Service, Church-Based Service, Environmental Service, People Development / Educational Service.
- **Church / Ministry Involvement (4)**: Campus Ministry, Parish / Church Ministry, Church Organization, Initiated Church-Related Activity.
- **Seminar / Training (8)**: Leadership Development, Personal / Professional Development, Campus Journalism Development, Sports Development, Socio-Cultural / Performing Arts Development, Community Service / Volunteer Development, Spiritual / Formation Development, Other Seminar / Training.
- **Citation / Recognition (8)**: Leadership, Organization / Membership, Community Service / Volunteerism, Church / Ministry, Campus Journalism, Sports, Socio-Cultural / Performing Arts, Other Non-Academic Recognition.
- **Sports (10)**: Basketball, Volleyball, Athletics, Swimming, Badminton, Table Tennis, Chess, Football, Sepak Takraw, Other Approved Sport.
- **Socio-Cultural / Performing Arts (7)**: Dance, Vocal / Singing, Instrumental, Theater, Cultural Performance, Performing Arts, Other Approved Discipline.
- **Campus Journalism (6)**: News Item, Literary Work, Column, Editorial, Publication Member / Contributor, Publication Officer.

Total DB Subcategories: **57** (100% matched).
Frontend UI Subcategories: **0** (Subcategory selection is currently missing in the modal).

---

### 6. Locked Taxonomy Comparison

| Metric | Target Rule | Current DB | Current UI |
|---|---|---|---|
| Primary Categories | Exactly 9 | 9 | 5–6 (Hardcoded mock) |
| Subcategories Total | Exactly 57 | 57 | 0 (None exposed) |
| Category Distribution | 4, 5, 5, 4, 8, 8, 10, 7, 6 | 4, 5, 5, 4, 8, 8, 10, 7, 6 | N/A |
| Placement as Top Category | Forbidden | Enforced (0) | Enforced (0) |

---

### 7. Classification-Rule Comparison

1. **Leadership Seminar**: Properly classified under `Seminar / Training -> Leadership Development` (`40000005-0001-0000-0000-000000000001`).
2. **Sports Clinic / Training**: Properly classified under `Seminar / Training -> Sports Development` (`40000005-0001-0000-0000-000000000004`).
3. **Performing Arts Workshop**: Properly classified under `Seminar / Training -> Socio-Cultural / Performing Arts Development` (`40000005-0001-0000-0000-000000000005`).
4. **Placement / Result**: Handled as structured metadata within relevant records (`placement`, `result`), not as a category.

---

### 8. Student Award Exposure Audit

- **Student Award Selector**: NONE.
- **Scoring / Criteria Leakage**: NONE. Students do not see award rubrics, point weights, or OSAD deliberative criteria.
- **Classification**: **NO AWARD EXPOSURE** (PASS).

---

### 9. Terminology Audit

- Current form uses: "Scope & Rank Weighting" in wizard Step 2.
- **Target Terminology**: Must use **"Category-Specific Fields"** or **"Structured Details"** in Phase 2. Must NOT use "Category Criteria" or "Rank Weighting".

---

### 10. Shared Field Inventory

Shared fields common across achievement records:
1. `title` (Activity / Achievement Title)
2. `organizer_or_body` (Issuing Organization / Venue)
3. `occurrence_date` / `start_date` / `end_date` (Date of Occurrence)
4. `description` (Contextual Narrative)
5. `evidence` (Attached proof documents & photos)

---

### 11. Generic Field Overload

- **`rank_conferred`**: Overloaded in current UI with inconsistent values (*Dean's Lister*, *Champion*, *Officer*).
- **`description`**: Free text currently used to capture structured facts (e.g. publication roles, volunteer hours, event level).

---

### 12. Current Dynamic Behavior

- **Classification**: **STATIC GENERIC FORM**.
- The current modal renders the exact same inputs regardless of which category is selected.

---

### 13. Category Selector

- Sourced from hardcoded array inside `AchievementSubmissionModal.jsx` rather than `GET /api/v1/portfolio/categories`.

---

### 14. Subcategory Selector

- Currently **absent** in UI.

---

### 15. Category/Subcategory Validation

- **Backend Validation**: `StudentPortfolioController::create` fully validates that `category_id` exists and that `subcategory_id` belongs to the selected category (`INVALID_TAXONOMY_COMBINATION` error code 422).
- **Frontend Validation**: Missing due to static form.

---

### 16. Field Validation

- Frontend validates basic string length for title, event name, and required files.
- Backend validates UUIDs, dates, sports required metadata, and journalism required subcategories.

---

### 17. Evidence Upload

- Stored via `LocalEvidenceStorageService` in `writable/uploads/evidence/` with records stored in `student_portfolio_evidence`. Accepted formats: PDF, JPG, PNG up to 10MB.

---

### 18. Draft Behavior

- Backend supports `draft` vs `submitted` through `submit_now` boolean flag in `POST /api/v1/portfolio`.
- Draft records are excluded from verification queues and award mapping.

---

### 19. Submission Statuses

Authoritative statuses in `student_portfolio_records.status`:
- `draft`
- `submitted`
- `under_review`
- `revisions_requested`
- `verified`
- `rejected`

---

### 20. Verification Workflow

- Submission (`submitted`) -> Verifier review -> Decision (`verified`, `revisions_requested`, `rejected`) logged to `student_portfolio_verification_events`.

---

### 21. Verification Authority

- Primary: Active Program Coordinator for the student's program.
- Secondary: Organization Moderator, Dean, OSAD Staff. Self-verification is strictly forbidden (403 `SELF_VERIFICATION_FORBIDDEN`).

---

### 22. Portfolio Persistence Model

- Master table: `student_portfolio_records` in `achievenest_local` with foreign keys to `profiles`, `portfolio_categories`, and `portfolio_subcategories`.

---

### 23. Metadata Model

- **Classification**: **JSON STRUCTURED** (`structured_metadata` JSON column in `student_portfolio_records`).

---

### 24. Metadata Key Inventory

Current active metadata keys in backend engines:
- `placement`, `competition_type`, `event_level`, `academic_year`, `semester`
- `publication_type`, `publication_status`, `role`
- `discipline`, `performance_role`
- `position_level`, `role_title`, `tenure_months`
- `hours_rendered`, `beneficiary_type`, `service_scope`
- `involvement_type`, `parish_or_org`
- `training_level`, `hours`, `topic_area`
- `award_level`, `granting_body`

---

### 25. API Contract

- `GET /api/v1/portfolio/categories`
- `GET /api/v1/portfolio`
- `GET /api/v1/portfolio/{id}`
- `POST /api/v1/portfolio`
- `PUT /api/v1/portfolio/{id}`
- `POST /api/v1/portfolio/{id}/evidence`
- `POST /api/v1/portfolio/{id}/submit`

---

### 26. Persistence Sequence

1. `POST /api/v1/portfolio` creates portfolio record with `structured_metadata`.
2. `POST /api/v1/portfolio/{id}/evidence` uploads supporting documents.
3. Record transitions to `submitted`.

---

### 27. AwardEvidenceMappingService Inputs

- Service reads `student_portfolio_records` joined with categories and subcategories, parsing `structured_metadata` JSON to evaluate criteria matches.

---

### 28. Structured vs Text Mapping

- **Classification**: **MOSTLY STRUCTURED**.
- Structured metadata is primary; fallback text parsing only runs for legacy records missing JSON keys.

---

### 29. Verification-Gated Mapping

- Strict invariant: Records with `status !== 'verified'` are immediately excluded from award mapping (`RECORD_NOT_VERIFIED`).

---

### 30. Multiple-Award Support

- One verified record can match and support criteria across multiple distinct awards.

---

### 31. Double-Counting Safety

- Composite key check prevents the same achievement from scoring twice within the same award subsection.

---

### 32. Leadership Audit

- Sourced from `LEADERSHIP_POSITION` (4 subcategories) and `ORG_MEMBERSHIP` (5 subcategories).

---

### 33. Organization Membership Audit

- Sourced from `ORG_MEMBERSHIP` with structured roles and contribution levels.

---

### 34. Community Service Audit

- Sourced from `COMMUNITY_SERVICE` (5 subcategories) with volunteer hours and beneficiary scopes.

---

### 35. Church/Ministry Audit

- Sourced from `CHURCH_MINISTRY` (4 subcategories) with parish/campus context.

---

### 36. Seminar/Training Audit

- Sourced from `SEMINAR_TRAINING` (8 subcategories).

---

### 37. Citation/Recognition Audit

- Sourced from `CITATION_RECOGNITION` (8 subcategories).

---

### 38. Sports Audit

- Sourced from `SPORTS` (10 subcategories); sports training is strictly routed to `SEMINAR_TRAINING -> Sports Development`.

---

### 39. Socio-Cultural Audit

- Sourced from `SOCIO_CULTURAL` (7 subcategories); workshops are strictly routed to `SEMINAR_TRAINING -> Socio-Cultural / Performing Arts Development`.

---

### 40. Campus Journalism Audit

- Sourced from `CAMPUS_JOURNALISM` (6 subcategories). Draft/unpublished work is strictly non-scorable.

---

### 41. Internal/External Source

- Tracked via `organizer_or_body` and metadata scopes.

---

### 42. Loading/Empty/Error States

- Frontend currently relies on synchronous mock states; needs standard async loading and error boundary handling when connecting to live APIs.

---

### 43. Accessibility

- Modal lacks complete ARIA live region announcements for dynamic category changes.

---

### 44. Responsive Behavior

- Current modal is scrollable on mobile but wizard badges become cramped on narrow viewports.

---

### 45. Current Form Architecture

- **Classification**: **STATIC GENERIC FORM**.

---

### 46. Duplicate Form Logic

- Form logic is duplicated across `AchievementSubmissionModal.jsx` and `PersonnelAchievementsPage.jsx`.

---

### 47. Taxonomy Source of Truth

- **Authoritative Source**: Database tables `portfolio_categories` (9 rows) and `portfolio_subcategories` (57 rows) in `achievenest_local`.

---

### 48. Database Integrity

- Categories: Exactly 9 active.
- Subcategories: Exactly 57 active.
- Orphan subcategories: **0**.

---

### 49. Existing Record Compatibility

- Existing 5 sample records in `student_portfolio_records` have valid foreign keys and conform to the 9/57 taxonomy.

---

### 50. Findings Summary

1. `CURRENT LIMITATION`: Frontend modal is static and mock-based.
2. `TAXONOMY MISMATCH`: UI displays 5–6 categories instead of authoritative 9 categories.
3. `MISSING SUBCATEGORY`: UI does not expose subcategory selector.
4. `GENERIC-FIELD OVERLOAD`: Structured facts are overloaded into `rank_conferred` and `description`.
5. `PASS`: Authoritative backend taxonomy and mapping service are 100% complete and verified.

---

### 51. Phase 1 Exit Decision

All current-state facts, database schemas, taxonomies, workflows, and mapping dependencies have been conclusively audited and documented with zero code or schema changes.

**PLAN 04 PHASE 1 DECISION: GO FOR PHASE 2 — FORM SCHEMA DESIGN.**
