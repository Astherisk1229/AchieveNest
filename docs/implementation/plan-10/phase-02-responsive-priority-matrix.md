# PLAN 10 — Phase 2 Responsive Priority Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Responsive Viewport Strategy

| Viewport Tier | Width Range | Layout Mode | Visible Elements | Horizontal Scroll? |
|---|---|---|---|---|
| **Large Desktop (2xl)** | `>= 1536px` | 4-Column Table | Student, Academic Placement, Account Status, Actions | **None (0px)** |
| **Standard Desktop (xl)** | `1280px - 1535px` | 4-Column Table | Student, Academic Placement, Account Status, Actions | **None (0px)** |
| **Laptop / Small Desktop (lg)** | `1024px - 1279px` | 4-Column Table | Student, Academic Placement, Account Status, Actions | **None (0px)** |
| **Tablet (md)** | `768px - 1023px` | 4-Column Table | Student, Academic Placement, Account Status, Actions (truncated program) | **None (0px)** |
| **Mobile (sm)** | `< 768px` | Mobile Card Stack | Student Card (Name, ID, College Badge, Status, Program, Actions) | **None (0px)** |

---

# 2. Small-Screen Essential Information Guarantee

On mobile cards (< 768px), each card preserves the answers to the 4 essential OSAD questions:
1. **Who?** Name + Mono Student ID.
2. **What academic unit?** Color-coded College Badge + Program Title + Year Level.
3. **Can student use account?** Account Status Badge (`ACTIVE` + `Pending First Login`).
4. **What action to take?** "Portfolio" and "Reset PWD" direct action buttons.
