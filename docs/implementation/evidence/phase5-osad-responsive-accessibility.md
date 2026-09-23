# Plan 05 Phase 5 — OSAD Responsive & Accessibility Audit
## Usability Standards for Administrative Review Workspace

### 1. Viewport Adaptation
- **Desktop (>= 1280px)**: 3-column split view (Category Sidebar -> Record List -> Detail & Evaluation Panel).
- **Tablet (768px – 1279px)**: 2-column view with collapsible evaluation drawer.
- **Mobile (< 768px)**: Stacked single-column view with tabbed evaluation toggle; 0 horizontal overflow.

### 2. Accessibility Invariants
- Accessible award dropdown with keyboard arrow support.
- Distinct color and text indicators for verification status vs award relevance.
- Evaluation error isolation: Network failures in award scoring do not hide the canonical portfolio records.
