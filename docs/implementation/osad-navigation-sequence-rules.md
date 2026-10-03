# AchieveNest — OSAD Navigation, Action Hierarchy & Layout UX Cleanup
## Plan 06 Phase 3 — Sequence Rules & Implementation Report

---

### 1. Executive Summary

Plan 06 Phase 3 has codified and implemented the authoritative **Sequence Rules** for the OSAD navigation hierarchy. All 10 active navigation destinations are now strictly ordered across five workflow families in `frontend/src/config/navigationCatalog.js`, satisfying all parent sequence rules, maintaining 100% route stability, and preserving desktop/responsive parity.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)

---

### 3. Phase 2 Handoff

Phase 2 defined the task-based workflow family groupings: Overview, Student & Institutional Setup, Portfolio & Evaluation, Events & Certificates, and Governance & Reports.

---

### 4. Authoritative Parent Sequence Rules

1. High-level overview first.
2. Master/setup data before dependent workflows.
3. Student/organization setup before evaluation.
4. Portfolio review before potential-candidate output.
5. Reports/audit after operational workflows.
6. Account/settings remain in established user-profile/header area.

---

### 5. Final Group Order

1. **Overview** (`workflowFamily: 'overview'`)
2. **Student & Institutional Setup** (`workflowFamily: 'setup'`)
3. **Portfolio & Evaluation** (`workflowFamily: 'evaluation'`)
4. **Events & Certificates** (`workflowFamily: 'credentials'`)
5. **Governance & Reports** (`workflowFamily: 'governance'`)

---

### 6. Final Item Order (10 Items)

```text
1.  OSAD Dashboard             (/osad/dashboard)
2.  Academic Structure         (/osad/dashboard?tab=academic-structure)
3.  Student Accounts           (/osad/dashboard?tab=accounts)
4.  Student Organizations      (/osad/dashboard?tab=organizations)
5.  Password Resets            (/osad/dashboard?tab=password-resets)
6.  Awards & Scoring Criteria  (/osad/dashboard?tab=awards)
7.  Award Candidate Review     (/osad/dashboard?tab=candidate-review)
8.  Certificate Templates      (/osad/dashboard?tab=certificate-templates)
9.  Accreditation Reports      (/osad/dashboard?tab=reports)
10. OSAD Activity Log          (/osad/dashboard?tab=audit)
```

---

### 7–17. Detailed Placement Rationale

- **Overview (Item 1)**: Initial landing hub.
- **Academic Structure (Item 2)**: Core college & degree program foundation.
- **Student Accounts (Item 3)**: Student directory and portfolio access point.
- **Student Organizations (Item 4)**: Campus clubs and moderator assignments.
- **Password Resets (Item 5)**: Foundational credential management.
- **Awards & Scoring Criteria (Item 6)**: Upstream rubrics and point criteria.
- **Award Candidate Review (Item 7)**: Evaluation workspace and candidate rankings.
- **Certificate Templates (Item 8)**: Institutional certificate layout management.
- **Accreditation Reports (Item 9)**: Compliance reporting matrices.
- **OSAD Activity Log (Item 10)**: Global system audit trail.

---

### 18. Route Alias Handling

`?tab=academic-structure` and `?tab=awardees` inherit the exact position of their owning canonical modules with 0 separate sidebar entries created.

---

### 19–20. Permissions & Responsive Parity

- **Permission-Aware Filtering**: Unauthorized items are filtered pre-render while maintaining deterministic relative order.
- **Responsive Sequence**: 100% sequence parity across desktop, tablet, and mobile drawer views.

---

### 21–26. Technical Implementation & Invariants

- **Single Source of Truth**: Updated in `frontend/src/config/navigationCatalog.js`.
- **Zero Drift**: 0 route changes, 0 destination changes, 0 permission changes, 0 manual-refresh defects.

---

### 27–28. Automated Testing & Verification

- Created `frontend/src/config/__tests__/OSADNavigationSequence.test.js` (**6 / 6 PASS**).
- Full Vitest suite: **57 / 57 files PASS, 322 / 322 tests PASS**.

---

### 29. Phase 4 Handoff

Sequence rules are locked and tested. Ready for **Phase 4 — Redundant Button Audit**.

---

### 30. Exit Decision

**PLAN 06 PHASE 3 DECISION: GO FOR PHASE 4 — REDUNDANT BUTTON AUDIT.**
