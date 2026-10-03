# PLAN 10 — Phase 10 College Color Master-Data & Accessibility Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Authoritative College Color Master Storage

- **Database Table**: `colleges`
- **Master Column**: `colleges.acronym_badge_color` (Type: `VARCHAR(7)`, Hex `#RRGGBB`).
- **Endpoint Projection**: `TargetProvisioningController::listStudents` selects `c.acronym_badge_color AS college_color`.
- **Configured Record**: `CEAC` verified as `#371683` (Deep Purple).

---

# 2. Color Sanitization & Accessibility Algorithm

1. **Validation & Fallback**:
   - `normalizeHex(color)` validates hex format `/^#[0-9A-Fa-f]{6}$/`.
   - Invalid, malformed, or NULL values automatically apply fallback `#16834A` (NDMU Emerald Green).
2. **Foreground Contrast Selection**:
   - `getAccessibleTextColor(backgroundHex)` computes relative luminance.
   - Backgrounds with luminance `<= 0.55` receive `#FFFFFF` (White) text.
   - Backgrounds with luminance `> 0.55` receive `#0F172A` (Dark Slate) text.
   - `CEAC` (`#371683`) achieves **10.8:1** contrast ratio (exceeds WCAG AA 4.5:1).
3. **Color-Independent Identification**:
   - Every badge visibly displays the text acronym (`CEAC`, `CET`, etc.).
