# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Phase 6: UI Information Architecture & Review Workspace

> **Document:** `osad-award-phase6-ui-information-architecture.md`  
> **Phase:** 6 of 8  
> **Component:** `OSADStudentAwardReviewWorkspace.jsx`  
> **Status:** AUDITED & OPERATIONAL  

---

## 1. Three-Level Information Architecture

```text
Level 1: Award Catalog / Cards
    └── 15 Authoritative Awards (Badges, Computable Max, Source Status)
        ↓
Level 2: Students for Evaluation
    └── Eligible Student Pool with Verified Evidence Count & Review Status
        ↓
Level 3: Student Review Workspace (Two-Panel Layout)
    ├── Header: Student context, Award context, Review Status, Portfolio Score Summary
    ├── Left Panel: Relevant Verified Evidence Cards
    └── Right Panel: Award-Specific Evaluation Sheet
         ├── Portfolio-Computable Criteria (Progressive Disclosure, View Breakdown)
         ├── Panel & Institutional Criteria (Controlled Manual Entry, Bound Validation)
         └── Reviewer & Committee Notes
```

---

## 2. Progressive Disclosure Specification

- **Closed State**: Displays criterion name, code, earned points / max points, and a clickable `View Breakdown` toggle.
- **Expanded State**:
  1. Component-level point breakdown.
  2. Scoring rule type identifier.
  3. Evidence trace items: selected records ($+X\text{ pts}$) vs qualified superseded records ($0\text{ pts}$).
  4. Applied caps and duplicate suppression notices.
- **Depth Limit**: Strictly 1 level of expansion (Criterion $\rightarrow$ Component Details) to minimize cognitive load.

---

## 3. Responsive & Two-Panel Layout

- **Desktop ($\ge 1024\text{px}$)**: Two-column grid (5 cols Left Evidence Panel, 7 cols Right Scoring Sheet).
- **Mobile / Narrow screens ($< 1024\text{px}$)**: Stacked single-column layout preserving full accessibility, focus management, and readable touch targets.
