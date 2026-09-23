# PLAN 11 — Phase 7 Navigation Semantics Contract
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Semantic Markup Architecture

```html
<aside id="main-sidebar" aria-label="Sidebar Navigation">
  <!-- Brand Heading -->
  <a href="/" class="...">AchieveNest NDMU Portal</a>
  
  <!-- Search Input -->
  <input type="text" aria-label="Search Portal..." />

  <!-- Navigation Region -->
  <nav aria-label="Main Navigation">
    <a href="/osad/dashboard" aria-current="page" class="...">
      <svg aria-hidden="true" ... />
      <span>OSAD Dashboard</span>
    </a>
  </nav>
</aside>
```

---

# 2. Interactive Element Invariants
- Navigational links render as semantic `<a>` (via `<Link to="...">`).
- Interactive triggers (Theme toggle, Topbar hamburger, Modal dismiss) render as native `<button type="button">`.
- Custom `role="link"` or `role="button"` on `<div>` elements: **0**.
- `role="menu"` / `role="menuitem"` on standard page navigation: **0**.
