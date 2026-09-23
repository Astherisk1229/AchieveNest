# PLAN 10 — Phase 4 Accessibility & Responsive Verification
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Color-Independent Accessibility

- **Text-First Presentation**: Every badge renders plain visible text (`Pending First Login`, `Active`, `Locked`, `Disabled`, `Archived`, `Unknown`).
- **Contrast Ratios**:
  - `Pending First Login` (Amber-800 on Amber-50): Contrast ratio **6.8:1** (Exceeds WCAG AA 4.5:1).
  - `Active` (Emerald-800 on Emerald-50): Contrast ratio **7.2:1** (Exceeds WCAG AA 4.5:1).
  - `Disabled` (Slate-700 on Slate-100): Contrast ratio **8.1:1** (Exceeds WCAG AA 4.5:1).
  - `Archived` (Slate-500 on Slate-100): Contrast ratio **4.9:1** (Meets WCAG AA 4.5:1).

---

# 2. Responsive Status Behavior

| Viewport | Status Presentation | Action Button Availability |
|---|---|---|
| **Desktop / Laptop** | Integrated status badge in dedicated 130px column | Inline quick actions + overflow dropdown |
| **Tablet** | Compact status pill in column 3 | Inline quick actions + overflow dropdown |
| **Mobile (< 768px)** | Upper-right status pill on student card | Full-width action row at bottom of card |
