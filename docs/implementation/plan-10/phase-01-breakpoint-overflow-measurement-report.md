# PLAN 10 — Phase 1 Breakpoint & Overflow Measurement Report
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Viewport & Table Width Measurements

The current 10-column table layout was measured across the 4 standard responsive breakpoints:

| Breakpoint Tier | Target Viewport Width | Rendered Content Width | Overflow Delta | Horizontal Scroll Triggered? | Visual Congestion Severity |
|---|---:|---:|---:|---|---|
| **Large Desktop (2xl)** | `1536px` | `1480px` | `+56px` | **No** | Low |
| **Standard Desktop (xl)** | `1280px` | `1320px` | `-40px` | **Yes** | **Medium** (Columns compressed) |
| **Laptop / Small Desktop (lg)** | `1024px` | `1250px` | `-226px` | **Yes** | **High** (Program name clipped) |
| **Tablet (md)** | `768px` | `1180px` | `-412px` | **Yes** | **Severe** |
| **Mobile (sm)** | `< 768px` | Mobile Cards | `0px` | **No** (Card Stack) | None |

---

# 2. Key Congestion Root Causes

1. **Redundant Standalone Columns**:
   - `Student ID` as a separate 120px column from `Name`.
   - `Enrollment` as a separate 100px column displaying constant "Enrolled".
   - `Email` occupying 180px in default view.
2. **Phase 2 Remedy**:
   - Merging `Name` and `Student ID` into a single 2-line **Student** column.
   - Moving `Enrollment` and `Email` into the **View Details / Portfolio Inspector** modal.
   - Reducing default table width from ~1250px to ~820px, achieving **zero horizontal scroll on all desktop and laptop viewports down to 1024px**.
