# PLAN 11 — Phase 10 Accessibility & Focus Contract
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Semantic & Assistive Technology Contracts

1. **Landmarks**:
   - Primary container: `<aside id="main-sidebar" aria-label="Sidebar Navigation">`
   - Navigation group: `<nav aria-label="Main Navigation">`
2. **Topbar Mobile Trigger**:
   - `aria-expanded={mobileOpen}`
   - `aria-controls="main-sidebar"`
   - `aria-label="Toggle Navigation Sidebar"`
3. **Escape Key Handling**:
   - `Escape` key closes the mobile off-canvas drawer on `< 1024px`, leaving the desktop persistent sidebar completely unaffected.
4. **Active Item Semantics**:
   - `aria-current="page"` + bold typography + green container pill + border outline.
5. **Clean Tab Order**:
   - `Positive tabindex values`: **0**
   - `Closed mobile drawer links tabbable`: **NO**
