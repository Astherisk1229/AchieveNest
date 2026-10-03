# PLAN 10 — Phase 2 Final Column Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Executive Summary

This contract establishes the formal, frozen 4-column information architecture for the OSAD Student Accounts directory table in AchieveNest.

Transitioning from the congested 10-column layout of Phase 1 to this streamlined 4-column hierarchy reduces default table width from ~1250px to ~820px, eliminating persistent horizontal scroll on all desktop and laptop viewports down to 1024px while preserving complete operational decision support for OSAD administrators.

---

# 2. Final 4-Column Table Architecture

```text
+---------------------------------------------------------------------------------------------------------+
| STUDENT                   | ACADEMIC PLACEMENT              | ACCOUNT STATUS       | ACTIONS            |
| (Who is the student?)     | (What academic unit?)           | (Is account usable?) | (What action?)     |
+---------------------------+---------------------------------+----------------------+--------------------+
| Faderes, Sean Asther      | BS Computer Science             | ACTIVE               | [View Details] [:] |
| 2026315391                | 3rd Year • [CEAC]               | Pending First Login  |                    |
+---------------------------+---------------------------------+----------------------+--------------------+
```

### 2.1 Column 1: Student (Identity)
- **Primary Content**: Full Name (`Last, First` formatted).
- **Secondary Content**: Student Institutional ID (mono font).
- **Email Placement**: Moved to View Details / Portfolio Inspector modal (searchable via toolbar).

### 2.2 Column 2: Academic Placement (Unit & Level)
- **Primary Content**: Academic Program Name (`BS Computer Science` / `BS Accountancy`).
- **Secondary Content**: Canonical Year Level (`1st Year` - `5th Year`) + Color-Coded College Pill Badge (`[CEAC]`).
- **College Master Color**: Bound to `colleges.acronym_badge_color` (CEAC = `#371683`, fallback `#16834A`).

### 2.3 Column 3: Account Status (Lifecycle State)
- **Primary Content**: Account Lifecycle Status badge (`ACTIVE`, `SUSPENDED`, `ARCHIVED`).
- **Secondary Sub-Badge**: `Pending First Login` (Amber badge rendered when `must_change_password === 1`).
- **Semantic Separation**: Strictly reflects access and auth status; distinct from academic enrollment status.

### 2.4 Column 4: Actions (Management)
- **Primary Action**: "View Portfolio / Details" (Quick eye button / row trigger).
- **Secondary Action**: Overflow menu `...` containing "Reset Password" (and future status actions).

---

# 3. Field Removal & Relocation Matrix

| Field | Previous Presentation | New Location | Justification |
|---|---|---|---|
| **Enrollment Status** | Separate 100px column | **View Details Modal** | 100% constant (`'enrolled'`) across 103/103 rows; zero default table utility. |
| **Institutional Email**| Separate 180px column | **View Details Modal** | Retains searchability via toolbar; declutters default row width. |
| **Sex** | Separate 80px column | **View Details Modal** | Secondary demographic; remains filterable in toolbar. |
| **Organization** | Standalone column/metadata | **View Details Modal** | Optional extracurricular placement; not needed for baseline account administration. |
| **College Name** | Separate 90px text column | **Academic Placement Badge**| Consolidates into compact color pill next to Year Level. |
