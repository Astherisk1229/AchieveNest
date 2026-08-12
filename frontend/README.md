# AchieveNest — Student & Faculty Achievement Ecosystem

**AchieveNest** is a central university achievement, honor roll ranking, accreditation report, and portfolio management web application for **Notre Dame of Marbel University (NDMU)**.

---

## 📚 Project Documentation Index

All project documentation files have been organized into the [`docs/`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs) directory based on functional domain:

### 📋 1. Role & Portal Feature Specifications ([`docs/specs/`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/specs/))
- **[OSAD Admin Portal Specification](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/specs/OSAD_ADMIN_FEATURES_SPEC.md)** — Governance of student accounts, academic departments, student organizations, award scoring engine, & PACUCOA/CHEd reports.
- **[Program Coordinator Specification](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/specs/PROGRAM_COORDINATOR_FEATURES_SPEC.md)** — Verification workspace for student achievement submissions prior to portfolio approval.
- **[Organization Moderator Specification](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/specs/ORGANIZATION_MODERATOR_FEATURES_SPEC.md)** — Event creation, organization management, & student participation logging.
- **[Student Portal System Specification](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/specs/STUDENT_SYSTEM_FEATURES_SPEC.md)** — Student achievement submissions, public portfolio, & digital barcode ID card.
- **[Personnel Portfolio Canva View Spec](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/specs/personnel_portfolio_canva_view_spec.md)** — Specialized visual presentation specifications for personnel portfolios.

### 🏛️ 2. System Architecture & Technical Design ([`docs/architecture/`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/architecture/))
- **[System Architecture Analysis](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/architecture/SYSTEM_ARCHITECTURE_ANALYSIS.md)** — OOP & MVC architecture standards (Models, Controllers, Hooks, Views).
- **[AchieveNest System Design](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/architecture/achievenest_system_design.md)** — System component overview & data flow diagrams.
- **[Frontend Security Architecture](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/architecture/FRONTEND_SECURITY_ARCHITECTURE.md)** — Security boundaries, session timeout management, & audit logging.
- **[Responsive Breakpoints Specification](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/architecture/RESPONSIVE_BREAKPOINTS_SPEC.md)** — Layout responsiveness across mobile, tablet, and desktop screens.

### 🔄 3. User Workflows & Role Governance ([`docs/workflows/`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/workflows/))
- **[User Workflow & System Improvements](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/workflows/USER_WORKFLOW_AND_IMPROVEMENTS.md)** — Core workflow logic, HR Admin & OSAD Admin access boundaries, and department secretary rules.
- **[User Role Inputs & Transactions](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/workflows/achievenest_user_role_inputs_and_transactions.md)** — Comprehensive matrix of user inputs, actions, and transactional flows per role.
- **[Personnel Portfolio Ranking Workflow](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/workflows/personnel_portfolio_ranking_workflow.md)** — Honor roll candidate evaluation and ranking algorithms for faculty/personnel.
- **[Personnel Accomplishment Logging UX Plan](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/workflows/personnel_accomplishment_logging_ux_plan.md)** — Step-by-step submission experience for personnel accomplishments.
- **[Personnel Achievement Categories Reference](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/workflows/personnel_achievement_categories_reference.md)** — Classification reference for research, teaching, extension, and administrative achievements.

### 🛠️ 4. Project Planning & Roadmaps ([`docs/planning/`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/planning/))
- **[AchieveNest Master Plan](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/planning/achievenest_master_plan.md)** — Complete project development roadmap and architecture blueprint.
- **[Project Progress Roadmap](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/planning/PROJECT_PROGRESS_ROADMAP.md)** — Milestones, completed modules, and feature implementation schedule.
- **[Implementation Plan](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/planning/implementation_plan.md)** — Step-by-step task breakdown and technical implementation details.
- **[Bug Analysis & Solutions](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/planning/bug_analysis_and_solution.md)** — Logged diagnostic analyses and resolution strategies.

---

## ⚡ Tech Stack & Getting Started

- **Framework**: React 18 + Vite 8
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens
- **Icons**: Lucide React
- **Architecture**: ES6 Controllers (OOP/MVC), React Hooks, Glassmorphic UI

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build production bundle
npm run build
```

