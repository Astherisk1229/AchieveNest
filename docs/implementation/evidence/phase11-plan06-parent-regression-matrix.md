# Phase 11 Evidence: Plan 06 Parent Regression Matrix

| # | Authoritative Requirement | Verification Method | Automated Evidence Test | Manual Refresh Needed | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Every sidebar item navigates correctly without manual refresh | Full 10/10 destination client-routing audit | `OSADPlan06FullRegression.test.jsx` (Test 1) | **NO** (0 defects) | **PASS** |
| **2** | Active route is highlighted correctly | Canonical route, alias & detail route check | `OSADPlan06FullRegression.test.jsx` (Test 2) | **NO** (0 defects) | **PASS** |
| **3** | No duplicate sidebar destinations remain without justification | Single catalog registry audit (`navigationCatalog.js`) | `OSADPlan06FullRegression.test.jsx` (Test 3) | **NO** (0 defects) | **PASS** |
| **4** | Primary buttons execute only one clear action | Action zone inventory & submission handler check | `OSADPlan06FullRegression.test.jsx` (Test 4) | **NO** (0 defects) | **PASS** |
| **5** | Redundant actions removed | Page header & toolbar action audit | `OSADPlan06FullRegression.test.jsx` (Test 5) | **NO** (0 defects) | **PASS** |
| **6** | Organization/entity cards open expected detail pages | Entity card whole-card navigation & isolation check | `OSADPlan06FullRegression.test.jsx` (Test 6) | **NO** (0 defects) | **PASS** |
| **7** | Modals and page actions remain accessible | ARIA dialog, focus trap, and keyboard audit | `OSADPlan06FullRegression.test.jsx` (Test 7) | **NO** (0 defects) | **PASS** |
| **8** | Responsive sidebar works | Desktop expanded/collapsed, tablet & mobile drawer | `OSADPlan06FullRegression.test.jsx` (Test 8) | **NO** (0 defects) | **PASS** |
| **9** | Role changes refresh navigation state correctly | Auth context in-memory update audit | `OSADPlan06FullRegression.test.jsx` (Test 9) | **NO** (0 defects) | **PASS** |
| **10**| Loading/error/empty states are distinguishable | OSADStateBlock semantic differentiation audit | `OSADPlan06FullRegression.test.jsx` (Test 10) | **NO** (0 defects) | **PASS** |
