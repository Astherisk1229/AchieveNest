# AchieveNest System Specification: Dean Features & Workflow

This document provides an exhaustive, highly detailed specification of all system features, layout sections, interactive controls, data models, verification workflows, self-review restrictions, and user click pathways for the **Dean** role in the **AchieveNest** application ecosystem.

---

## 1. Role Scope & Architectural Overview

### A. Role Definition & Scope Analogy
- **User Role Context**: Dean (`active_role_context: 'dean'`).
- **Target Organization Scope**: Department/College scope (e.g., *College of Engineering, Architecture, and Computing — DEP-CEAC*).
- **Core Function & Analogy**: The **Dean** is the faculty/personnel counterpart to the **Program Coordinator**. While the Program Coordinator audits student achievements within an academic program, the Dean reviews, verifies, and audits **faculty ranking and performance portfolios** for all personnel within their assigned department.
- **Primary Operational Scope**: Evaluates line-item point claims for Area A (Professional Development), Area B (Productivity & Research), and Area C (Leadership & Community Service), verifies attached documentary evidence, adjusts verified scores according to institutional category rules, and either endorses the portfolio to Institutional HR or returns it to personnel with required revision feedback.

> [!IMPORTANT]
> **Conflict of Interest & Self-Review Restriction Rule**:
> A Dean **cannot review or evaluate their own personnel portfolio**.
> - **Self-Review Prevention**: If a portfolio belongs to the logged-in Dean, the system locks evaluation controls (`isSelfPortfolio` check in `DeanVerificationController.js`).
> - **Direct HR Delegation**: The Dean's own portfolio automatically bypasses department-level secretary review and is routed directly to the **Institutional HR Director** (`HRRankingController`) for independent audit and sign-off.
> - **Separation of Contexts (Personal Achievements & Portfolio Management)**: The Dean workspace is strictly focused on department faculty score evaluation and proof verification. Personal portfolio management (`My Personal Portfolio`) and personal achievement entries (`My Achievements`) are completely excluded from the Secretary sidebar menu. To log personal accomplishments or manage their own portfolio, the Dean must switch role context to their **Personnel Portal** account (`active_role_context: 'personnel'`).

### B. Architectural Compliance (OOP & MVC)
In compliance with project architectural rules ([`AGENTS.md`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/.agents/AGENTS.md) and [`SYSTEM_ARCHITECTURE_ANALYSIS.md`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/SYSTEM_ARCHITECTURE_ANALYSIS.md)):

- **Domain Model (`src/models/PersonnelPortfolioModel.js`)**:
  - Encapsulates faculty portfolio entity schemas, academic rank metadata, department mapping (`matchesDepartment(deptId)`), line-item items array for Area A, B, and C, claimed points vs verified points, proof verification flags (`is_proof_verified`), point ceiling calculations (Area A: 70 max, Area B: 50 max, Area C: 40 max, Capped Total: 160 max), and immutable audit history state transitions (`transitionStatus`).
- **Controller (`src/controllers/DeanVerificationController.js`)**:
  - Encapsulates all business logic, department-scoped queries (`assignedDepartmentId = 'DEP-CEAC'`), search and status filter algorithms (`filterPortfolios`), self-review conflict check (`isSelfPortfolio`), line-item verification updates (`updateItemVerification`), mandatory feedback validation for returns (`returnToPersonnel`), and HR endorsement triggers (`endorseToHR`).
- **MVC Bridge Hook (`src/hooks/useDeanVerification.js`)**:
  - Connects React View components to `DeanVerificationController`, managing active portfolio selection state, search queries, status filter selections, line-item updates, and endorsement/return triggers with error handling.
- **Lightweight Views (`src/components/dean/`, `src/pages/PersonnelDashboard.jsx`)**:
  - `DeanDashboardView.jsx`: Top-level container hosting the 3-tab layout (`Overview`, `Verification Workspace`, `Personnel Roster`).
  - `DeanPortfolioRoster.jsx`: Department faculty roster table with search, filters, and self-review protection.
  - `DeanEvaluatorWorkbench.jsx`: Interactive dual-column score evaluation and document viewer workbench.

---

## 2. Overview Dashboard Section (`tab=overview`)

The **Overview Dashboard** section provides a high-level command center modeled after the Program Coordinator reference design, translated into the context of department faculty evaluation.

### A. Dark Emerald Hero Header & Interactive Summary Cards
- **Header Banner**: Dark emerald container (`#1b4332`) with page title **"Dean Dashboard"**, assigned department scope (*College of Engineering, Architecture & Computing*), and gold star badge.
- **Interactive Metric Counter Cards (4 Summary Cards)**:
  1. **`PENDING REVIEWS` Card**: Displays count of submitted portfolios awaiting evaluation (e.g., `2 Pending`). Clicking switches tab to `workspace` with `statusFilter=submitted`.
  2. **`ENDORSED TO HR` Card**: Displays total count of verified portfolios forwarded to HR (e.g., `3 Endorsed`). Clicking switches tab to `workspace` with `statusFilter=ready_for_finalization`.
  3. **`RETURNED` Card**: Displays count of portfolios sent back for revisions (e.g., `1 Returned`). Clicking switches tab to `workspace` with `statusFilter=returned_for_revision`.
  4. **`AVG REVIEW TIME` Card**: Displays SLA performance velocity metric (e.g., `1.8 hrs`). Clicking switches tab to `personnel`.

### B. Department Scope Sub-header & Mode Indicator
- **Scope Banner Card**: Pinned bar displaying assigned department scope (*DEP-CEAC*) and subtext (*"You can only view and evaluate faculty ranking portfolios submitted within your assigned department."*).
- **Mode Badge**: High-visibility `● Dean Mode` emerald badge.

### C. Dashboard Two-Column Grid
1. **Left Column — Recent Verification Activity Log**:
   - Real-time audit stream detailing recent evaluation actions (Endorsements, Returns, Started Reviews, HR Direct Bypasses) with timestamp labels and status pills.
2. **Right Column — Dean Guidelines**:
   - Standardized policy cards outlining **Review SLA Commitment** (48-72 hrs turnaround), **Score Ceiling & Cap Rules** (Area A: 70 max, Area B: 50 max, Area C: 40 max, Total: 160 max), and **Conflict of Interest Rules**.

---

## 3. Verification Workspace Section (`tab=workspace`)

The **Verification Workspace** is the core operational workbench for line-item score evaluation, proof document auditing, and endorsement decisions.

### A. Evaluator Workbench & Score Cards
- **Score Counter Cards**: Dynamically updates accepted vs claimed scores for Area A, Area B, and Area C, enforcing area ceiling caps.
- **Area Selection Tabs**: Smoothly switches line-item inspection between Area A (Professional Development), Area B (Productivity & Research), and Area C (Leadership & Service).
- **Line-Item Verification Cards**:
  - Point input field allowing secretary to adjust verified score based on attached proof.
  - `Proof Verified` checkbox control.
  - **`Inspect Proof`** trigger to render target certificate/document in the right panel.
- **Interactive Evidence Viewer (Right Panel)**: Displays attached evidence PDF/image with full preview and download triggers.

### B. Decision Modals
- **Endorse Portfolio to HR Modal (`showEndorseModal`)**: Finalizes evaluation, records audit entry, and pushes portfolio state to `ready_for_finalization`.
- **Request Revision Modal (`showReturnModal`)**: Enforces mandatory feedback remarks and returns portfolio state to `returned_for_revision`.

---

## 4. Personnel Roster Section (`tab=personnel`)

The **Personnel Roster** section presents all faculty members under the department scope.

### A. Roster Controls & Data Table
- **Real-Time Search**: Filters by Faculty Name, Faculty ID, or Academic Rank.
- **Status Filter**: Dropdown menu isolating portfolios by review stage (`All`, `Submitted for Review`, `Under Review`, `Endorsed to HR`, `Returned`, `HR Approved`).
- **Data Table Columns**:
  - Faculty Member Avatar, Name, ID, Academic Year.
  - Academic Rank.
  - Semantic Status Badge + **Self-Portfolio Indicator** (`Self-Portfolio — HR Direct`).
  - Verified Score Total (`X / 160`).
  - Area A/B/C Sub-score Pills.
  - Action: **"Evaluate"** button (disabled with *"Bypasses to HR"* for self-portfolios).

---

## 5. Cross-Role Lifecycle Integration & Self-Review Bypass Matrix

```
  +-------------------------------------------------------------------+
  |                  FACULTY PORTFOLIO SUBMISSION                    |
  +---------------------------------+---------------------------------+
                                    |
          Is submitted by Department|Is submitted by Department
          Faculty (Standard Flow)   |Secretary (Self-Portfolio)
                                    |
                                    v
            +-----------------------+-----------------------+
            |  Standard Flow        |  Self-Portfolio Flow  |
            +-----------+-----------+-----------+-----------+
                        |                       |
                        v                       v
            (submitted)       (SUBMITTED_DIRECT_TO_HR)
                        |                       |
                        v                       v
            +-----------+-----------+  +--------+----------+
            | Dean  |  | HR Director       |
            | Reviews & Endorses    |  | Audits Directly   |
            +-----------+-----------+  +--------+----------+
                        |                       |
                        v                       v
            (ready_for_finalization)             (completed)
                        |                       |
                        +----------->+<---------+
                                     |
                                     v
                        +------------+------------+
                        | Official Capped Score   |
                        | Locked for Ranking      |
                        +-------------------------+
```

---

## 6. Summary of Key Files & Architectural Modules

- **Specification File**: [`docs/specs/DEPARTMENT_SECRETARY_FEATURES_SPEC.md`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/docs/specs/DEPARTMENT_SECRETARY_FEATURES_SPEC.md)
- **Domain Model**: [`src/models/PersonnelPortfolioModel.js`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/src/models/PersonnelPortfolioModel.js)
- **MVC Controller**: [`src/controllers/DeanVerificationController.js`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/src/controllers/DeanVerificationController.js)
- **Bridge Hook**: [`src/hooks/useDeanVerification.js`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/src/hooks/useDeanVerification.js)
- **Dashboard Container**: [`src/components/dean/DeanDashboardView.jsx`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/src/components/dean/DeanDashboardView.jsx)
- **Roster View**: [`src/components/dean/DeanPortfolioRoster.jsx`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/src/components/dean/DeanPortfolioRoster.jsx)
- **Evaluator Workbench View**: [`src/components/dean/DeanEvaluatorWorkbench.jsx`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/src/components/dean/DeanEvaluatorWorkbench.jsx)
- **Main Page Host**: [`src/pages/PersonnelDashboard.jsx`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/src/pages/PersonnelDashboard.jsx)
