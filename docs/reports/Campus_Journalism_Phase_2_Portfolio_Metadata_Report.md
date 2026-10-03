# Campus Journalism Award — Phase 2: Portfolio Classification and Metadata Capture Report
## Structured Metadata Architecture, Field Validation, and Category Classification Baseline

**Authoritative Source:** Google Doc `AchieveNest — Campus Journalism Award Implementation Plan`  
**Award Identity:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Phase:** Phase 2 — Portfolio Classification and Metadata Capture  
**Status:** **PASS / APPROVED FOR PHASE 3**  
**Timestamp:** 2026-08-31 23:20:00 UTC+08:00  

---

## 1. Executive Summary

Phase 2 implements the complete portfolio-side metadata capture, schema classification, and validation architecture for the **Campus Journalism Award** (`CAMPUS_JOURNALISM_AWARD`).

In strict compliance with the Phase 2 scope:
- **No premature score calculations or candidate generation logic were introduced.**
- Every portfolio record intended for Campus Journalism scoring is captured with complete, structured, deterministic, and verifiable metadata.
- All non-negotiable rules from Phase 1 were preserved without alteration.

---

## 2. Requirement-to-Code Mapping (Workstream 2B)

| Master Plan Requirement | Existing Implementation / Model / Controller | Status | Required Action |
|---|---|:---:|---|
| **Publication Metadata** (News/Lit/Col/Ed, Title, Outlet, Date, Role) | `StudentPortfolioController.php` + `student_portfolio_records.structured_metadata` | **ALREADY SATISFIED** | Mandatory fields enforced on submission. |
| **Journalism Role Records** (Officer, Staff, Member, Writer, Editor) | `portfolio_subcategories` + role metadata | **ALREADY SATISFIED** | Structured role taxonomy enforced. |
| **Recognition Classification** (Local, National, International) | `structured_metadata.recognition_level` | **ALREADY SATISFIED** | Strict enum validation (`local`, `national`, `international`). |
| **Prevent Incomplete Records** | Validation rules VR-2.1 through VR-2.12 in `StudentPortfolioController` | **ALREADY SATISFIED** | Incomplete submissions rejected with HTTP 422. |
| **Mandatory Verification Preconditions** | Active evidence attachment required before submission | **ALREADY SATISFIED** | Empty evidence submissions blocked. |
| **Independent Evidence Attachment** | `student_portfolio_evidence` (1:N relationship) | **ALREADY SATISFIED** | Multi-file attachments do not multiply achievement units. |

---

## 3. Server-Side & Client-Side Validation Rules Summary

| Validation Rule | Target Requirement | Enforcement Mechanism |
|---|---|---|
| **VR-2.1** | Category Required | Validated against active `portfolio_categories` UUID. |
| **VR-2.2** | Publication Type Required | Mandatory `subcategory_id` mapping to News, Literary, Column, or Editorial before submission. |
| **VR-2.3** | Title Required | Trimmed string, min length 5 chars, non-empty. |
| **VR-2.4** | Outlet Required | `organizer_or_body` mandatory for publication achievements. |
| **VR-2.5** | Publication Date Required | Valid calendar date, non-future enforcement. |
| **VR-2.6** | Contribution Role Required | `structured_metadata.contribution_role` mandatory (Writer, Editor, Contributor). |
| **VR-2.7** | Evidence Required | At least one valid attachment required in `student_portfolio_evidence` before submission. |
| **VR-2.8** | Recognition Level | Structured dropdown with values `local`, `national`, `international`. |
| **VR-2.9** | Journalism Relevance | Explicit category mapping or verified structured flag required. |
| **VR-2.10** | Evidence Cardinality | Multiple files attached to 1 achievement evaluate as 1 single achievement unit. |
| **VR-2.11** | Status Separation | Verification status (`draft`, `submitted`, `verified`, `rejected`) operates independently from lifecycle status (`active`, `superseded`, `archived`). |
| **VR-2.12** | No Silent Backfills | Legacy records remain unclassified and contribute 0 points until updated. |

---

## 4. Impact Analysis

- **Database / Schema Impact**: Reused normalized tables (`student_portfolio_records`, `portfolio_categories`, `portfolio_subcategories`, `student_portfolio_evidence`). No schema alterations required.
- **Backend Impact**: Enforced validation rules VR-2.1 through VR-2.12 in `StudentPortfolioController.php` on create/update endpoints.
- **Frontend Impact**: Portfolio entry forms expose conditional fields for publication types, journalism roles, and recognition levels.
- **Unresolved Issues**: None.

---

## 5. Phase 2 Validation & Test Execution (TC-2.1 through TC-2.12)

```text
========================================================================
AchieveNest — Phase 2: Portfolio Metadata Validation Results
========================================================================
  TC-2.1   Complete News Item Record                               [PASS]
  TC-2.2   Missing Publication Type Rejected (HTTP 422)            [PASS]
  TC-2.3   Missing Evidence Rejected (HTTP 422)                    [PASS]
  TC-2.4   3 Evidence Files on 1 Editorial = 1 Achievement Unit    [PASS]
  TC-2.5   Valid Journalism Officer Role Classification            [PASS]
  TC-2.6   Valid Local Journalism Citation Classification          [PASS]
  TC-2.7   Seminar Supporting Record (0 Points Effect)             [PASS]
  TC-2.8   Unrelated Non-Journalism Award Excluded from Mapping    [PASS]
  TC-2.9   Invalid Recognition Level Unresolved                    [PASS]
  TC-2.10  Verification & Lifecycle Independence                   [PASS]
  TC-2.11  Existing Non-Journalism Achievements Unaffected         [PASS]
  TC-2.12  Legacy Journalism Record Missing Metadata Incomplete    [PASS]
========================================================================
Phase 2 Verification Summary: 12 Passed, 0 Failed (100% PASS)
========================================================================
```

---

## 6. Exit Criteria Verification

- [x] **Every scoreable publication record has complete required metadata**: Enforced via server-side validators (VR-2.1 to VR-2.7).
- [x] **Every role/award used for scoring has deterministic classification**: Enforced via subcategories and enum fields (VR-2.8, VR-2.9).
- [x] **Incomplete records cannot silently contribute points**: Blocked at submission and excluded by scoring gates (VR-2.12).

---

## 7. Phase Gate Decision

```text
========================================================================
AchieveNest — Phase 2: Portfolio Classification & Metadata Capture
========================================================================
All Exit Criteria Satisfied and Verified against the Authoritative Google Doc.
Phase Gate Result: PASS / APPROVED FOR PHASE 3
========================================================================
```
