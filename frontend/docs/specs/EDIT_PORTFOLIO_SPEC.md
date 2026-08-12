# EDIT PORTFOLIO WORKSPACE SPECIFICATION (`EDIT_PORTFOLIO_SPEC.md`)

## Executive Summary & Architectural Verdict
The **Edit Portfolio Workspace** ([`PersonnelPortfolioEditPage.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/pages/PersonnelPortfolioEditPage.jsx)) is designed as an **Active Compliance, Auditing & Point Calculation Workbench** tailored strictly to official Notre Dame of Marbel University (NDMU) faculty evaluation rules.

> [!NOTE]
> For the complete 5-page official NDMU Rating Sheet for Ranking criteria schedule breakdown, see [`NDMU_RATING_SHEET_FOR_RANKING_SPEC.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/specs/NDMU_RATING_SHEET_FOR_RANKING_SPEC.md). For the 16-slide presentation deck structure and complete category/subcategory breakdown, see [`PORTFOLIO_BOOKLET_SPEC.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/specs/PORTFOLIO_BOOKLET_SPEC.md).

### Core Architectural Separation Principle
- **Portfolio Showcase View (`/personnel/portfolio`)**: Optimized for visual presentation, personal branding, and reading ease (resume-style overview with the 16-slide Canva booklet presenter).
- **Edit Portfolio Workspace (`/personnel/portfolio/edit`)**: Optimized for compliance auditing, Area A/B/C point ceiling calculations (70/50/40 max), proof file validation, and direct line-item mutability.

Attempting to force identical layouts across both views creates cognitive friction. Therefore, the **Edit Portfolio Workspace** uses a dedicated **Tabbed Compliance Studio** layout featuring a sticky point ceiling scoreboard, category workspace tabs, missing proof warning badges, and cap saturation indicators.

---

## 1. Comparative Analysis Matrix

| Dimension | Portfolio Showcase View (`/personnel/portfolio`) | Edit Portfolio Workspace (`/personnel/portfolio/edit`) |
| :--- | :--- | :--- |
| **User Mental Model** | *"How does my profile and dossier look to evaluators?"* (Read-only presentation deck) | *"Am I meeting NDMU point ceilings and missing any mandatory proof files?"* (Active audit workbench) |
| **Primary Focus** | Biography, career timeline, featured skills, and visual polish. | Point accumulation, Area A/B/C caps (70/50/40 pts), file proof verification, and submission pipeline. |
| **Data Density** | Medium — Spaced cards, rich media, high typography hierarchy. | High — Structured tabbed lists, status alert pills, claimed points badges, action controls. |
| **Optimal UI Layout** | Linear Storytelling: Hero Banner → Bio → Timeline → Skills → Verified Grid. | **Tabbed Audit Studio**: Top Page Ceiling Header → Category Tabs (Area A, B, C) → Dense Line-Item Manager. |

---

## 2. Structural Blueprint (Top Page Scoreboard Header + Workspace Tabs)

```
+-------------------------------------------------------------------------------------------------------+
| EDIT PORTFOLIO WORKSPACE (COMPLIANCE STUDIO ARCHITECTURE)                                             |
+-------------------------------------------------------------------------------------------------------+
| [ TOP PAGE SCOREBOARD & NDMU CEILINGS LEDGER (Static Top Placement) ]                                 |
|  - Status Pill: [ DRAFT ] | Total Capped Score: [ 120 / 160 PTS ]                                     |
|  - Actions: [ Preview Booklet (Canva) ] | [ Submit Portfolio to DepSec (Primary Emerald Button) ]    |
|  +-----------------------+ +-----------------------+ +-----------------------+ +--------------------+ |
|  | AREA A: 45 / 70 PTS   | | AREA B: 50 / 50 MAX   | | AREA C: 25 / 40 PTS   | | GRAND CAPPED TOTAL | |
|  | [█████████░░░] 64%    | | [███████████] 100%  | | [██████░░░░░] 62%   | | 120 / 160 PTS    | |
|  +-----------------------+ +-----------------------+ +-----------------------+ +--------------------+ |
+-------------------------------------------------------------------------------------------------------+
| [ FACULTY COMPACT MINI-BANNER ] (Collapsible)                                                         |
|  Dr. Maria Santos • Associate Professor • Department of Computer Studies | [ Edit Bio & Credentials ] |
+-------------------------------------------------------------------------------------------------------+
| [ WORKSPACE CATEGORY TABS ]                                                                           |
|  [ 📂 Area A: Prof. Dev (45pts) ] [ 🔬 Area B: Productivity (50pts MAX) ] [ 🤝 Area C: Service (25pts) ]|
+-------------------------------------------------------------------------------------------------------+
| [ ACTIVE TAB CONTENT AREA - e.g. AREA A ]                                                             |
|                                                                                                       |
|  Section Header & Import Toolbar:                                                                     |
|  - Title: Area A: Professional Development (Ceiling Cap: 70 Pts)                                      |
|  - Actions: [ 📥 Import Vault Entries ]  [ ➕ Add New Item to Area A ]                                |
|                                                                                                       |
|  Dense & Interactive Record List Cards:                                                               |
|  ---------------------------------------------------------------------------------------------------  |
|  📄 Ph.D. in Computer Science                                           [ Scope: Institutional ] +40 pts |
|     Proof: 📎 PhD_Diploma_Santos.pdf (Verified Attachment)                                            |
|     Actions: [ Edit Item ] [ Replace Proof ] [ Delete ]                                               |
|  ---------------------------------------------------------------------------------------------------  |
|  📄 CHED Regional Workshop on AI Ethics                                 [ Scope: National ]      +5 pts |
|     Proof: ⚠️ Missing Proof PDF! (Action Required Before Submission)                                  |
|     Actions: [ 📤 Upload Proof ] [ Edit Item ] [ Delete ]                                             |
|  ---------------------------------------------------------------------------------------------------  |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. Key Feature Specifications

### A. Sticky Top Scoreboard & Ceilings Ledger
- **Fixed Viewport Positioning**: Remains sticky at `top-0 z-30` as users scroll through workspace tabs.
- **Dynamic Cap Progress Bars**:
  - *Area A (70 Pts Max)*: Live progress bar with percentage indicator.
  - *Area B (50 Pts Max)*: Live progress bar. When 50 pts is reached, displays **`[ MAX CAP REACHED ]`** badge.
  - *Area C (40 Pts Max)*: Live progress bar.
  - *Grand Total (160 Pts Max)*: Dynamic sum capped at 160 points.

### B. Workspace Category Tabs
Eliminates endless vertical scrolling by isolating accomplishment entries into 3 focused evaluation tabs:
- **Tab 1: Area A (Professional Development)**: Educational degrees, certifications, memberships, seminars.
- **Tab 2: Area B (Productivity & Creative Work)**: Publications, Scopus articles, keynote lectures, research grants.
- **Tab 3: Area C (Service & Leadership)**: Committee leadership, faculty adviserships, community extension.

### C. Proof Completeness Alert Badges
- **Verified Attached Proof**: Displays `📎 proof_document.pdf (Attached)`.
- **Missing Proof Alert**: Highlighted rose alert pill `⚠️ Missing Proof PDF!` with direct `[ Upload Proof ]` button trigger, preventing accidental submission of unverified entries.

### E. Personnel Point Security Directive
- **Auto-Derived Criteria Points**: Personnel CANNOT manually type, alter, or manipulate numeric points. Point values are derived automatically based on official NDMU Criteria category schedules (`RankingCriteriaModel.js`).
- **Evaluator Verification**: Department Secretary and HR evaluators verify documentary proof and confirm final accepted points during audit review.
- **Scoreboard Transparency**: The NDMU Point Ceilings Ledger displays real-time score progress towards Area A (70 Max), Area B (50 Max), Area C (40 Max), and Grand Capped Total (160 Max).

---

## 4. Technical Architecture & Data Flow

```
[ PersonnelPortfolioEditPage.jsx ]
       │
       ├──► Sticky Ceiling Bar (Calculates real-time area totals vs 70/50/40/160 caps)
       │
       ├──► Area Workspace Tabs ('A' | 'B' | 'C')
       │         │
       │         ├──► Proof Validator (Checks proof_file_name for missing document warnings)
       │         │
       │         └──► Line-Item CRUD Actions (addItem, updateItem, removeItem, autoPopulateFromVault)
       │
       └──► Canva Booklet Presenter Sync (PersonnelPortfolioCanvaView.jsx)
```

---

## 5. Workflow Lifecycle

1. **Workbench Access**: Personnel navigate to `/personnel/portfolio/edit`.
2. **Sticky Ledger Inspection**: Personnel immediately see their overall score progress (e.g., *120 / 160 pts*) in the sticky header.
3. **Tabbed Area Editing**: Personnel click Area A, B, or C tabs to review specific line-items without scrolling long pages.
4. **Proof Completeness Audit**: Personnel scan for `⚠️ Missing Proof PDF!` badges and click `Upload Proof` to attach certificates.
5. **Pre-Submission Booklet Check**: Personnel click `Preview Booklet` to inspect output slides.
6. **Final Endorsement**: Personnel click `Submit Portfolio to DepSec` to lock and send the draft for evaluation.
