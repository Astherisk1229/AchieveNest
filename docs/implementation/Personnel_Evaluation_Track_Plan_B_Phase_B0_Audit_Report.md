# Personnel Evaluation Track — Plan B — Phase B0 Audit Report
## Achievement Repository & Portfolio Reflection — Data Flow Audit & Rule Freeze

**Status:** **PHASE B0 — COMPLETE — ACHIEVEMENT REPOSITORY & PORTFOLIO DATA FLOW AUDITED**  
**Date:** 2026-09-08  
**Criteria Version Reference:** `NDMU-PERSONNEL-RATING-V2`  

---

## 1. Executive Summary

Phase B0 audits the current Personnel achievement repository and portfolio reflection data flow to establish the architectural baseline for **Plan B: Portfolio Assembly & Management Track**.

Following the successful completion of **Plan A** (*where achievements and evidence are authoritatively persisted in the backend database with zero-fabrication OCR and canonical advisory scoring*), Phase B0 identifies all existing duplication, shadow stores, stale mock initializations, and point semantic conflations in the Personnel portfolio layer before implementation begins in Phase B1.

---

## 2. Current-State Data Flow Map

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PLAN A CANONICAL PERSISTENCE (Database-Backed)                                         │
│ ├─ Table: public.personnel_accomplishments (id, title, domain, date, claimed_points)   │
│ ├─ Table: public.personnel_accomplishment_evidence (id, storage_path, checksum)        │
│ └─ Service: personnelAccomplishmentService.fetchAccomplishments()                      │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ACHIEVEMENT REPOSITORY VIEW (PersonnelAchievementsPage.jsx)                            │
│ ├─ Controller: PersonnelAchievementController.loadAchievements()                       │
│ ├─ Models: AchievementModel instances (hydrated from backend)                          │
│ └─ State: Dynamic search, category filters, and live backend deletion                  │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                    ❌ CURRENT DISCONNECTION / GAP ❌
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ SHADOW LOCALSTORAGE PORTFOLIO (PersonnelPortfolioController.js)                        │
│ ├─ Key: localStorage['achievenest_personnel_portfolios']                              │
│ ├─ Mock Seeder: Static items (item_a1, item_a2, item_b1, item_b2, item_c1)             │
│ ├─ Disconnected Auto-Populate: Hard-coded defaultVaultItems                            │
│ ├─ Redundant Entry Modal: PersonnelPortfolioEditPage.jsx inline line-item creator     │
│ └─ Premature Self-Scoring: verified_points & is_proof_verified pre-seeded in draft     │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PORTFOLIO VIEWS (PersonnelPortfolioPage.jsx & PersonnelPortfolioEditPage.jsx)          │
│ ├─ Hook: usePersonnelPortfolio(employee_id)                                            │
│ ├─ Summary: PortfolioSummaryCard.jsx & PersonnelPortfolioBookletModal.jsx             │
│ └─ Presentation: Disconnected from live database changes                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Canonical Ownership Matrix

| Data Domain / Field | Current Actual Source | Intended Authoritative Source | Consuming Views | Duplication / Mutation Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Achievement Facts** (`title`, `date`, `issuer`, `category`, `scope_level`, `description`) | Duplicated in `localStorage` portfolio items (`area_a_items`, etc.) | **Plan A Achievement Record** (`personnel_accomplishments`) | `PersonnelAchievementsPage`, `PersonnelPortfolioPage`, `PersonnelPortfolioEditPage`, `BookletModal` | **HIGH**: Edits/deletions in repository do not propagate to portfolio. |
| **Evidence Linkage** (`evidence_id`, `original_filename`, `storage_path`) | Copied as `proof_file_name` string in local item | **Plan A Evidence Record** (`personnel_accomplishment_evidence`) | Evidence download, Portfolio proof inspection | **HIGH**: Filename string only; misses authentic backend stream ID. |
| **OCR Metadata** (`confidence_score`, `warnings`, `matched_keywords`) | Plan A modal only; discarded in portfolio item | **Plan A Achievement Record** (`ocr_metadata` payload) | Repository audit preview | **MEDIUM**: Lost upon portfolio line-item creation. |
| **Advisory Claimed Points** | Calculated via `AchievementClassificationService` in Plan A; duplicated in local item | **Plan A Canonical Advisory Calculation** (`claimed_points`) | Repository badges, Portfolio Area totals | **MEDIUM**: Local item manual editing can cause point drift. |
| **Evaluator Accepted Points** (`verified_points`) | Prematurely seeded as `40`, `8`, etc. in local draft items | **Plan G Reviewer Workspace** (Evaluator Action) | Reviewer workspace (downstream) | **CRITICAL**: Self-scoring in Personnel draft violates reviewer boundary. |
| **Personnel Profile Data** (`name`, `rank`, `college`, `program`, `years_service`) | Hard-coded fallback in `PersonnelPortfolioPage.jsx` | **Auth User Session / HR Master Data (Plan D)** | Portfolio Header, Booklet Modal, Dean Endorsement | **LOW-MEDIUM**: Inconsistent rank/college when user logs in with real session. |
| **Portfolio Assembly State** (`portfolio_id`, `status`, `attached_items`) | LocalStorage array in `PersonnelPortfolioController` | **Plan B Working Portfolio Controller** (backed by canonical links) | `PersonnelPortfolioPage`, `PersonnelPortfolioEditPage` | **HIGH**: LocalStorage wiped on different machine/browser. |

---

## 4. Duplication & Shadow Structure Findings

### 4.1 Shadow LocalStorage Store
- `PersonnelPortfolioController.js` currently stores all portfolio structures under `localStorage['achievenest_personnel_portfolios']`.
- If a user opens the app in a new browser, incognito session, or clears cache, the portfolio reverts to static mock items (`item_a1`, `item_a2`, etc.).

### 4.2 Hard-Coded Auto-Populate Seeder
- `PersonnelPortfolioController.autoPopulateFromVault()` injects fixed mock items (`Ph.D. in Computer Science`, `National AI & Cloud Summit 2025`, `Deep Learning Algorithms`, `Keynote Speaker`, `Moderator: CS Society`) instead of fetching genuine records from `personnelAccomplishmentService.fetchAccomplishments()`.

### 4.3 Redundant Inline Achievement Modal
- `PersonnelPortfolioEditPage.jsx` implements its own manual line-item entry modal with duplicate file upload and OCR scan routines (lines 96–120), creating duplicate line items disconnected from the primary achievement repository.

---

## 5. Portfolio Inclusion Rule Findings

| Achievement State | Current Behavior | Intended Plan B Baseline Behavior | Status |
| :--- | :--- | :--- | :--- |
| **Draft / Active Accomplishment** | Not auto-reflected unless manually added or auto-populated | Automatically available for inclusion in active academic year portfolio | Confirmed |
| **Pending Review Accomplishment** | Disconnected | Included in working portfolio reflection | Confirmed |
| **Verified Accomplishment** | Disconnected | Included in working portfolio reflection | Confirmed |
| **Returned Accomplishment** | Disconnected | Visible in portfolio with correction flag | Confirmed |
| **Deleted Accomplishment** | Retained in local portfolio | Immediately removed from active working portfolio | Confirmed |
| **Missing Evidence** | Guard prevents submission if proof filename is empty | Evidence ID verification required before portfolio submission | Confirmed |

---

## 6. Point Semantics Matrix

| Point Concept | Plan Owner | Definition & Usage | Mutability in Plan B |
| :--- | :--- | :--- | :--- |
| **Suggested Points** | **Plan A / Plan F** | System-generated advisory value derived from canonical NDMU criteria rules (`NDMU-PERSONNEL-RATING-V2`). | Read-only advisory indicator. |
| **Claimed Points** | **Plan A / Plan B** | Personnel-submitted provisional points for an accomplishment line item. | Editable by Personnel before submission. |
| **Accepted Points** | **Plan G / Plan F** | Official reviewer-approved points recorded by Dean / Evaluator using Plan F scoring rules. | **STRICTLY IMMUTABLE in Plan B** (Cannot be self-assigned). |
| **Area Ceiling Caps** | **Plan F** | Area A: 70 pts max, Area B: 50 pts max, Area C: 40 pts max (Total: 160 max). | Evaluated by `RankingCriteriaModel` / Plan F rules. |

---

## 7. Synchronization & Deletion Propagation Findings

1. **Repository Deletion Propagation Failure:**
   - Deleting an accomplishment via `PersonnelAchievementController.deleteAchievement(id)` removes it from the backend database and repository view.
   - However, `PersonnelPortfolioController` retains the item in `area_a_items`/`area_b_items`/`area_c_items` in localStorage, causing ghost records in the portfolio.
2. **Repository Edit Propagation Failure:**
   - Editing an accomplishment title or date in `PersonnelAchievementsPage` updates the database record.
   - The portfolio line item in `PersonnelPortfolioEditPage` remains stale with the old title.
3. **Target Resolution for Phase B1–B2:**
   - Establish a unified reflection mechanism where portfolio areas dynamically resolve their line items from canonical `AchievementModel` instances.

---

## 8. Cleanup Ownership Matrix

| Identified Defect / Duplication | Resolution Action | Target Phase |
| :--- | :--- | :--- |
| Mock portfolio items seeded on load in `PersonnelPortfolioController.js` | Remove static seeder; load dynamically from canonical repository | **Phase B1** |
| Hard-coded `defaultVaultItems` in `autoPopulateFromVault` | Replace with live fetch from `personnelAccomplishmentService` | **Phase B1** |
| Premature `verified_points` self-scoring in Personnel draft | Remove evaluator scoring fields from Personnel working portfolio model | **Phase B2** |
| Redundant line-item creation modal in `PersonnelPortfolioEditPage.jsx` | Align with canonical `PersonnelSubmissionModal` / repository selector | **Phase B2** |
| Stale portfolio ghost items upon achievement deletion | Implement dynamic synchronization or cascade removal in portfolio controller | **Phase B3** |
| Hard-coded user profile fallback data in portfolio views | Bind directly to authenticated `useAuth()` session and profile state | **Phase B4** |

---

## 9. Rule Freeze (Invariants for Plan B)

The following architectural rules are frozen and must govern all Plan B phases:

1. **Single Source of Achievement Truth:**
   - All achievement facts (titles, dates, evidence references, advisory points) originate from Plan A backend records (`personnel_accomplishments`).
2. **Dynamic Reflection:**
   - The Personnel portfolio reflects genuine achievements from the repository without requiring manual re-entry or storing duplicate disconnected copies.
3. **Strict Scoring Separation:**
   - Plan B calculates and displays only **Claimed / Suggested Points** and Area Totals.
   - Plan B must never generate evaluator-accepted points, passed/retained outcomes, or promotion decisions.
4. **Personnel Profile Independence:**
   - Employee group, rank, and departmental metadata are consumed as read-only context from Plan D / Auth state.
5. **Deletion Integrity:**
   - Deleting an achievement in the repository must immediately reflect in the working portfolio.

---

## 10. Explicitly Unresolved Rules (Deferred / Non-Blocking)

- **Multi-Portfolio Academic Year Versioning:** Whole-portfolio submission locking and multi-year snapshots belong to **Plan C**.
- **Evaluator Scoring Workspace:** Dean and HR evaluation sheets and accepted-point overrides belong to **Plan G**.
- **Administrators Ranking Scale Mapping:** Awaiting downstream Plan F criteria definition.

---

## 11. Final Phase Status

**PHASE B0 — COMPLETE — ACHIEVEMENT REPOSITORY & PORTFOLIO DATA FLOW AUDITED**
