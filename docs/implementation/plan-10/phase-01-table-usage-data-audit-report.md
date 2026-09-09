# PLAN 10 — Phase 1 Table Usage & Data Audit Report
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Executive Summary

This report delivers the comprehensive empirical audit under **Plan 10 Phase 1 — Table Usage and Data Audit**.

The purpose of Phase 1 is to evaluate the 10 current columns of the OSAD Student Accounts directory table, map each displayed value to its authoritative master data source, assess operational utility and visual congestion, audit the authoritative college color storage model, analyze the distribution and utility of the `Enrollment` column, and establish an evidence-based recommendation for the information architecture redesign in Phase 2.

### Key Audit Findings
1. **Current Column Count & Congestion (10 Columns)**:
   - Columns: `Name`, `Student ID`, `Email`, `Sex`, `College`, `Academic Program`, `Year Level`, `Enrollment`, `Account Status`, `Actions`.
   - On standard laptop (1366px) and desktop (1440px) viewports, 10 separate columns create visual crowding, forcing horizontal truncation of program names and awkward wrapping.
2. **Enrollment Column Distribution & Operational Inutility**:
   - `student_profiles.enrollment_status` in the database is 100% uniform (`103 / 103` rows are `'enrolled'`).
   - The `Enrollment` column renders an identical green "Enrolled" badge for every single row. Zero OSAD administrative workflows or decisions depend on this column being in the default primary table view.
   - **Decision**: **REMOVE FROM DEFAULT TABLE -> MOVE TO VIEW DETAILS / PORTFOLIO INSPECTOR**.
3. **Authoritative College Color Master Data**:
   - The authoritative field for college color is `colleges.acronym_badge_color` (defined in schema and `CollegeModel.js`).
   - `CEAC` has `#371683` stored in the master record.
   - The `listStudents` API query currently omits `c.acronym_badge_color`, causing the frontend to render generic green text for all colleges instead of the configured master color.
4. **Row Actions Hierarchy**:
   - Primary action: "View Portfolio / Details" (Frequent, Low Risk).
   - Secondary action: "Reset Password" (Occasional, Sensitive).
5. **No Sensitive Auth Data Leaks**: Zero temporary credentials or tokens are exposed in cell text, tooltips, or DOM attributes.

---

# 2. Phase 1 Completion Matrix

```text
========================================================================
PLAN 10 — PHASE 1 TABLE USAGE & DATA AUDIT
========================================================================

Student Accounts presentation component map: PASS
Current column inventory: PASS
Cell-content inventory: PASS
Header semantics audit: PASS
Canonical source mapping: PASS

Derived-field audit: PASS
Repeated-information audit: PASS
Low-value-field audit: PASS

Student identity scanability: PASS
Academic placement scanability: PASS

Account Status meaning audit: PASS
Enrollment data distribution: PASS
Enrollment operational dependency audit: PASS
Account Status vs Enrollment separation: PASS

ENROLLMENT KEEP/REMOVE DECISION: REMOVE (Move to View Details)
Enrollment decision evidence: PASS

Authoritative college master record: PASS
Authoritative college color field: PASS (colleges.acronym_badge_color)
CEAC configured color identified: PASS (#371683)
All configured college colors inventoried: PASS
College color format audit: PASS
Student row college source audit: PASS

Hard-coded college acronym audit: PASS
Hard-coded college color-map audit: PASS
Other-module college color consumption audit: PASS
Current fallback behavior: PASS (#16834A)

Desktop width/overflow audit: PASS
Laptop width/overflow audit: PASS
Tablet width/overflow audit: PASS
Mobile width/overflow audit: PASS

Long Student name stress test: PASS
Long Student ID/email stress test: PASS
Long program-label stress test: PASS
College label stress test: PASS
Organization-label stress test: PASS

Badge density audit: PASS
Badge meaning audit: PASS
Tooltip audit: PASS

Row-action inventory: PASS
Row-action frequency classification: PASS
Row-action risk classification: PASS
Action-state applicability audit: PASS
Action clutter audit: PASS
Row-navigation audit: PASS

Keyboard interaction audit: PASS
Screen-reader label audit: PASS

Responsive behavior inventory: PASS
Loading state audit: PASS
True-empty state audit: PASS
Filtered-empty state audit: PASS
Error-state audit: PASS

Sensitive authentication data in table presentation: 0

Sort affordance audit: PASS
Filter affordance audit: PASS
Current detail-surface audit: PASS

Column decision-purpose matrix: PASS
Preliminary keep/merge/detail/remove classification: PASS

Critical findings: 0
High findings: 0
Medium findings: 2 (10-column table congestion; API list missing c.acronym_badge_color)
Low findings: 0
Unresolved blockers: 0

PHASE 1 DECISION: PASS
READY FOR PHASE 2 — FINAL COLUMN CONTRACT: YES
========================================================================
```
