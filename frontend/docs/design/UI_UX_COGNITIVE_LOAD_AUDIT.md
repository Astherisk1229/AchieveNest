# AchieveNest — UI/UX Cognitive Load & Visual Density Audit

> **Scope:** Comprehensive audit of AchieveNest's React frontend across all roles and major views using the `saas-design` evaluation framework.  
> **Guiding Principle:** Quieter, lighter, more structured, easier to scan — preserving 100% of business logic, authorization, routes, and data invariants.

---

## 1. Executive Findings & Global Anti-Patterns

Across the frozen build, six key recurring anti-patterns were identified that inflate visual density and cognitive load:

1. **Massive Saturated Hero Banners:** Views often begin with heavy, saturated dark-green header cards that consume ~200–260px of vertical space, pushing operational work queues below the fold.
2. **Container-on-Container Nesting:** High frequency of `Page Card -> Section Card -> Item Card -> Pill Chip` nesting, resulting in excessive borders, rounded corners, and shadow conflicts.
3. **Competing Green Accents:** Simultaneous application of vibrant emerald/green on page titles, background containers, icons, metrics, progress bars, status pills, and buttons within the same 300px visual radius.
4. **Micro-Typography Clutter:** Proliferation of `text-[10px]` and `text-[11px]` with `uppercase tracking-wider font-extrabold`, creating visual vibrations on content that requires effortless human scanning.
5. **Passive KPI Dominance:** Static aggregate numbers (e.g., total enrolled students, total programs) share equal card size and visual weight with urgent, actionable items (e.g., unassigned coordinators, pending verifications).
6. **Heavy Toolbar Wrapping:** Merging page headers, sub-tabs, primary action buttons, search bars, and dropdown filters into a single massive container card.

---

## 2. Screen-by-Screen Cognitive Load Audit Table

| Screen / Area | Exact UX Problem | Cognitive Load Cause | Severity | Recommended Redesign | Component | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OSAD Dashboard** (`OSADOperationalSummary.jsx`) | Oversized dark-green hero + nested AY pills + large setup progress widget | 3 competing focal points before reaching any data; ~40% viewport consumed | **P1** | Replace with clean, compact page title + metadata line; move setup progress to lightweight secondary indicator | `OSADOperationalSummary.jsx` | Presentation only (0 risk) |
| **OSAD Dashboard KPIs** (`OSADOperationalSummary.jsx`) | 4 equally-sized heavy bordered cards with multiple 10px labels | Hard to identify what requires immediate action vs passive context | **P2** | Convert to balanced stat strip; elevate "Unassigned Roles" with semantic amber pill if >0 | `OSADOperationalSummary.jsx` | Presentation only |
| **OSAD Analytics Grid** (`OSADCommandCenterPage.jsx`) | High-contrast stacked progress bars with uppercase tracking | Heavy contrast distracts from actionable candidate decision list | **P2** | Lighten bar containers, use sentence case headings, reduce card padding | `OSADCommandCenterPage.jsx` | Presentation only |
| **Academic Structure** (`OSADAcademicProgramsPage.jsx`) | Nested 2-column cards inside page card; each program rendered as an individual boxed card | 3 layers of borders; high vertical scrolling; hard to compare programs | **P1** | Replace nested program cards with clean, compact structured program rows/table inside each College | `OSADAcademicProgramsPage.jsx` | Presentation only |
| **Academic Structure Header** (`OSADAcademicProgramsPage.jsx`) | Giant white card wrapping title and two equal "+ Create" buttons | Equal visual weight for College vs Program creation | **P2** | Clean page header; distinct primary vs secondary outline action button | `OSADAcademicProgramsPage.jsx` | Presentation only |
| **Student Accounts Header** (`OSADStudentAccountsPage.jsx`) | Page title, Add button, Sub-Tabs, Search bar, and Filter dropdown crammed in one mega-card | Visual clutter, toolbar competes with directory table below | **P1** | De-nest header into 2 clean rows: Title + Add Button, followed by clean Tab & Search toolbar | `OSADStudentAccountsPage.jsx` | Presentation only |
| **Student Accounts Table** (`OSADStudentAccountsPage.jsx`) | Excessively prominent green points text; heavy uppercase column titles | Eye is drawn to points rather than student identity and action items | **P2** | Standardize column header typography (12px muted medium); align points column cleanly | `OSADStudentAccountsPage.jsx` | Presentation only |
| **HR Dashboard** (`HRDashboardPage.jsx`) | Multiple prominent bento cards with saturated icon badges | High visual saturation; rankings and qualification mix together | **P2** | Restrain background accents; separate qualification reviews from administrator rankings clearly | `HRDashboardPage.jsx` | Presentation only |
| **HR Personnel Directory** (`HRPersonnelDirectoryPage.jsx`) | Heavy pill chips for both Academic/Non-Academic and College placements | Double-pill clutter per row | **P2** | Subtle badge for classification; plain text with icon for College / Admin Unit | `HRPersonnelDirectoryPage.jsx` | Presentation only |
| **Student Portfolio** (`StudentPortfolioPage.jsx`) | Category selection cards feature large colorful icons and heavy borders | Takes focus away from uploaded evidence and submission statuses | **P2** | Streamline category selector into a clean category pill/tab bar | `StudentPortfolioPage.jsx` | Presentation only |
| **Coordinator Verification** (`CoordinatorDashboardPage.jsx`) | Long explanatory paragraphs in banner card | Coordinator already knows role; paragraph wastes vertical space | **P2** | Reduce banner to single concise sentence; focus immediately on student submission queue | `CoordinatorDashboardPage.jsx` | Presentation only |
| **App Sidebar Navigation** (`Sidebar.jsx`) | Persistent Getting Started card with progress bar occupies sidebar space | Takes vertical room from navigation items even after setup complete | **P2** | Make onboarding guide collapsible or relocate to dashboard overview | `AdminSetupGuide.jsx` | Presentation only |

---

## 3. Severity Distribution

- **P0 (Blocking):** 0 (The application is fully functional and offline-certified)
- **P1 (High Cognitive Load):** 3 screens (OSAD Dashboard Header, Academic Structure Nesting, Student Accounts Toolbar)
- **P2 (Meaningful Refinement):** 8 areas (Analytics grid, table density, directory pills, category selectors, sidebar clutter)
- **P3 (Visual Polish):** General typography scale consistency, border subtle tokens, focus rings

---

## 4. Implementation Phasing Strategy

1. **Foundation (Phase 2):** Define shared design tokens (`ACHIEVENEST_UI_SYSTEM.md`) for typography, spacing, surface, borders, and buttons.
2. **Pilot (Phase 3):** Implement cognitive-load reduction on the 3 OSAD screens (`OSADOperationalSummary.jsx`, `OSADCommandCenterPage.jsx`, `OSADAcademicProgramsPage.jsx`, `OSADStudentAccountsPage.jsx`).
3. **Expansion (Phases 4–7):** Extend approved primitives to HR, Dean, Coordinator, Moderator, and Student views.
