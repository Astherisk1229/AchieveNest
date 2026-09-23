# Phase 7 — OSAD Responsive Header Matrix
## Viewport Reflow, DOM Order, and Focus Order Behavior

### 1. Viewport Reflow Rules
- **Desktop (>= 1024px)**: Single horizontal flex row (`flex-row justify-between items-center`). Eyebrow/breadcrumb, title, badge, and description on the left; action buttons aligned right.
- **Tablet (768px – 1023px)**: Flexible wrapping layout (`flex-col md:flex-row md:items-center justify-between gap-4`). Action group wraps without squishing or truncating buttons.
- **Mobile (< 768px)**: Stacked column layout (`flex-col gap-4`). Logical DOM order ensures reading order and keyboard `Tab` flow are identical: Breadcrumb/Eyebrow -> Title/Badge -> Description -> Secondary Actions -> Primary Action. Zero horizontal scroll overflow.

### 2. Cross-Page Responsive Behavior Matrix

| Page / Sub-View | Desktop Layout | Tablet Reflow | Mobile Stacked Order | Focus Order Maintained | Overflow Check | Result |
|---|---|---|---|---|---|---|
| **OSAD Dashboard / Overview** | Row flex layout | Clean row reflow | Eyebrow -> Title -> Description | PASS (Natural DOM order) | 0px overflow | PASS |
| **Academic Structure** | Row flex layout | Actions wrap cleanly | Icon/Title -> Description -> Secondary -> Primary | PASS (Natural DOM order) | 0px overflow | PASS |
| **Student Accounts** | Row flex layout | Single row reflow | Icon/Title -> Description -> Add Student CTA | PASS (Natural DOM order) | 0px overflow | PASS |
| **Student Organizations** | Row flex layout | Single row reflow | Icon/Title/Badge -> Description -> Create Org CTA | PASS (Natural DOM order) | 0px overflow | PASS |
| **Password Resets** | Row flex layout | Single row reflow | Icon/Title/Badge -> Description -> Refresh CTA | PASS (Natural DOM order) | 0px overflow | PASS |
| **Awards & Criteria** | Row flex layout | Search input wraps | Icon/Title/Badge -> Description -> Search input | PASS (Natural DOM order) | 0px overflow | PASS |
| **Award Candidate Review** | Row flex layout | Action buttons wrap | Icon/Title/Badge -> Description -> Actions dropdown | PASS (Natural DOM order) | 0px overflow | PASS |
| **Certificate Templates** | Row flex layout | Single row reflow | Icon/Title -> Description -> Create Template CTA | PASS (Natural DOM order) | 0px overflow | PASS |
| **Accreditation Reports** | Row flex layout | Single row reflow | Icon/Title -> Description | PASS (Natural DOM order) | 0px overflow | PASS |
| **OSAD Activity Log** | Row flex layout | Single row reflow | Icon/Title -> Description -> Refresh CTA | PASS (Natural DOM order) | 0px overflow | PASS |
| **Coordinator Manager Subview** | Detail flex layout | Breadcrumbs wrap | Back/Breadcrumbs -> Title/Badge | PASS (Natural DOM order) | 0px overflow | PASS |
| **College Details Subview** | Detail flex layout | Action buttons wrap | Back/Breadcrumbs -> Title -> Secondary -> Primary | PASS (Natural DOM order) | 0px overflow | PASS |
| **Organization Details Subview** | Detail flex layout | Action buttons wrap | Back/Breadcrumbs -> Title -> Secondary -> Primary | PASS (Natural DOM order) | 0px overflow | PASS |
