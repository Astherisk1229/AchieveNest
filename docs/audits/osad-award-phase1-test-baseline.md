# Phase 1 Test Baseline & Characterization Notes

**Document Identifier:** `docs/audits/osad-award-phase1-test-baseline.md`  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Phase:** 1 of 8 (Repository Audit & Legacy Isolation)  
**Status:** **TEST SUITE AUDITED**

---

## 1. Executive Summary

This document surveys existing automated tests across frontend and backend, identifying tests that characterize legacy behaviors, tests that protect shared utilities, and test suites that validate the new 15-award foundation.

---

## 2. Test Suite Classification Matrix

| Test Suite / File | Scope / Target | Legacy Fixtures Asserted | Classification | Action in Later Phases |
|---|---|---|:---:|---|
| `frontend/src/services/__tests__/AwardPortfolioReviewService.test.js` | Service unit tests | Asserts `min_points: 50` and `min_points: 60` on mock categories (`cat-deans-list`, `cat-leadership`) | **KEEP as Characterization** | Migrate assertions in Phase 5 to test normalized 80% threshold across 15 awards |
| `frontend/src/pages/osad-admin/__tests__/OSADAwardsUX.test.jsx` | Awards & Criteria UI | Renders awards catalog and criteria cards | **KEEP** | Extend in Phase 6 to test subcriteria accordion interactions |
| `frontend/src/pages/osad-admin/__tests__/CreateCollegeModal.test.jsx` | College administration | None (Academic structure) | **OUT OF SCOPE** | Keep as-is |
| `frontend/src/pages/osad-admin/__tests__/CreateProgramModal.test.jsx` | Program administration | None (Academic structure) | **OUT OF SCOPE** | Keep as-is |
| `backend/tests/` (Phase 1–7 validation suites) | Full Campus Journalism lifecycle (132 test cases) | None (Tests exact 70-pt computable rules, 80% threshold, immutable snapshots) | **KEEP** | Maintain 100% pass invariant |

---

## 3. Characterization Rule

- Existing characterization tests in `AwardPortfolioReviewService.test.js` are retained to document legacy client-side assumptions during migration.
- No tests were deleted during Phase 1.
