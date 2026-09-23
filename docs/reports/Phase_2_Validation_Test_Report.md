# Phase 2 — Validation Test Report
## Test Case Execution and Verification Results (TC-2.1 through TC-2.12)

**Domain:** Campus Journalism Portfolio Classification & Metadata Validation  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Execution Timestamp:** 2026-08-31 22:35:00 UTC+08:00  
**Overall Status:** **12 / 12 PASSED (100%)**  

---

## 1. Test Execution Matrix

| Test ID | Test Scenario Description | Input Fixture / Condition | Expected Behavior | Result |
|---|---|---|---|:---:|
| **TC-2.1** | Complete News Item Record | Valid title, outlet, valid publication date, contribution role = `writer`, 1 evidence attachment. | Record saves successfully with status `submitted`. Structurally complete. No points calculated. | **PASS** |
| **TC-2.2** | Missing Publication Type | Complete publication record except `subcategory_id` is null. | Rejects submission with HTTP 422 (`MISSING_PUBLICATION_TYPE`). Blocks verification transition. | **PASS** |
| **TC-2.3** | Missing Evidence Attachment | Complete editorial record with zero evidence files. | Rejects submission with HTTP 422 (`MISSING_EVIDENCE_ATTACHMENT`). Record remains incomplete. | **PASS** |
| **TC-2.4** | Three Evidence Files on One Editorial | 1 Editorial record with 3 attached PDF evidence files. | Database establishes 1 portfolio record row and 3 evidence rows. Count of achievements remains exactly 1. | **PASS** |
| **TC-2.5** | Valid Journalism Officer Role | Officer role with position title, organization, academic year, and appointment evidence. | Deterministically routes to `COMP_JOURN_LEAD_ROLE` (Officer family, 3 pts future limit). No points calculated. | **PASS** |
| **TC-2.6** | Valid Local Journalism Citation | Citation record with `recognition_level = 'local'` and certificate attachment. | Deterministically routes to `COMP_JOURN_LEAD_AWARDS` (Local award, 2 pts future limit). No points calculated. | **PASS** |
| **TC-2.7** | Seminar Supporting Record | Journalism training record with certificate proof. | Routes to `COMP_JOURN_LEAD_AWARDS` as supporting evidence only with 0.0 points effect. | **PASS** |
| **TC-2.8** | Unrelated Non-Journalism Award | National athletic/academic award. | Valid in general portfolio, but excluded from Campus Journalism evidence mappings. | **PASS** |
| **TC-2.9** | Invalid Recognition Level | Recognition record with invalid level `Regional`. | Unresolved for Campus Journalism awards component; no guessing or automatic conversion. | **PASS** |
| **TC-2.10** | Verification & Lifecycle Independence | Record in `status = 'verified'` has its lifecycle updated to `archived`. | Verification status remains `verified`; lifecycle status is tracked independently. | **PASS** |
| **TC-2.11** | Existing Non-Journalism Achievements | Standard Sports / Community achievements. | No Campus Journalism fields become mandatory; existing flows operate unaffected. | **PASS** |
| **TC-2.12** | Legacy Journalism Record Missing Metadata | Pre-existing journalism record lacking publication type. | Record remains accessible in portfolio; marked incomplete for scoring until classified. | **PASS** |

---

## 2. Detailed Test Case Evaluations

### TC-2.1: Complete News Item
- **Payload:**
  ```json
  {
    "category_id": "2b09cd61-7a23-4466-be58-889398e8f201",
    "subcategory_id": "40000009-0001-0000-0000-000000000001",
    "title": "NDMU Students Excel in National Programming Contest",
    "organizer_or_body": "The NDMU Herald",
    "occurrence_date": "2025-09-20",
    "structured_metadata": { "contribution_role": "writer" },
    "submit_now": true,
    "evidence": [{ "storage_path": "evidence/news_clipping.pdf", "original_filename": "news_clipping.pdf" }]
  }
  ```
- **Assertion:** HTTP `201 Created`, record `status = 'submitted'`, mapped to `COMP_JOURN_NEWS`. **[PASS]**

### TC-2.2: Missing Publication Type
- **Payload:** Category `2b09cd61-7a23-4466-be58-889398e8f201`, `subcategory_id = null`, `submit_now = true`.
- **Assertion:** HTTP `422 Unprocessable Entity`, error code `MISSING_PUBLICATION_TYPE`. **[PASS]**

### TC-2.3: Missing Evidence Attachment
- **Payload:** Category `2b09cd61-7a23-4466-be58-889398e8f201`, `subcategory_id = ...0004` (Editorial), `evidence = []`, `submit_now = true`.
- **Assertion:** HTTP `422 Unprocessable Entity`, error code `MISSING_EVIDENCE_ATTACHMENT`. **[PASS]**

### TC-2.4: Evidence Cardinality Guarantee
- **Database Query:**
  ```sql
  SELECT spr.id, COUNT(spe.id) AS evidence_count 
  FROM student_portfolio_records spr 
  JOIN student_portfolio_evidence spe ON spe.portfolio_record_id = spr.id 
  WHERE spr.id = 'test-editorial-001' GROUP BY spr.id;
  ```
- **Result:** `spr.id = 'test-editorial-001'`, `evidence_count = 3`. `student_portfolio_records` count is exactly `1`. **[PASS]**

---

## 3. Summary of Validation Pass

All 12 validation test cases executed with 100% compliance against the Phase 2 specification.
