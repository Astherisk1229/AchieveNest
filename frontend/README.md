# AchieveNest — Student & Faculty Achievement Ecosystem

**AchieveNest** is a central university achievement, honor roll ranking, accreditation report, and portfolio management web application for **Notre Dame of Marbel University (NDMU)**.

---

## 📚 Project Documentation Index

All project documentation files are organized under [`docs/`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs):

### 📋 1. Role & Portal Feature Specifications ([`docs/specs/`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/specs/))
- **[OSAD Admin Features Spec](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/specs/osad-admin-features-spec.md)** — Governance of student accounts, academic departments, student organizations, award scoring engine, & accreditation reports.
- **[Program Coordinator Features Spec](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/specs/program-coordinator-features-spec.md)** — Verification workspace for student achievement submissions prior to portfolio approval.
- **[Dean Features Spec](docs/specs/dean-features-spec.md)** — College-scoped portfolio review and evaluator workbench.
- **[HR Admin Features Spec](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/specs/hr-admin-features-spec.md)** — Personnel directory, onboarding, evaluation studio, and ranking logs.

### 🏛️ 2. System Architecture & Technical Design ([`docs/architecture/`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/architecture/))
- **[Frontend Architecture & Readiness](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/architecture/frontend-architecture-and-readiness.md)** — OOP & MVC layer architecture standards (Models, Controllers, Hooks, Views).
- **[Frontend Security Architecture](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/architecture/FRONTEND_SECURITY_ARCHITECTURE.md)** — Security boundaries, session timeout management, & audit logging.
- **[Responsive Breakpoints Specification](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/architecture/RESPONSIVE_BREAKPOINTS_SPEC.md)** — Layout responsiveness across mobile, tablet, and desktop screens.

### 🔄 3. User Workflows & Role Governance ([`docs/workflows/`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/workflows/))
- **[User Role Workflows & Governance](docs/workflows/user-role-workflows-and-governance.md)** — Core workflow logic and HR Admin, OSAD Admin, and Dean access boundaries.
- **[User Role Inputs & Transactions](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/workflows/achievenest_user_role_inputs_and_transactions.md)** — Comprehensive matrix of user inputs, actions, and transactional flows per role.

### 🛠️ 4. Project Planning & Roadmaps ([`docs/planning/`](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/planning/))
- **[Project Progress Roadmap](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/planning/project-progress-roadmap.md)** — Authoritative status roadmap, completed milestones, and verification snapshot.
- **[Master Feature & Implementation Plan](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/planning/master-feature-and-implementation-plan.md)** — Technical implementation plan and feature matrix.
- **[Frontend Defect Resolution Log](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/planning/frontend-defect-resolution-log.md)** — Logged diagnostic analyses, sidebar fixes, and resolution strategies.
- **[Portfolio Evaluation Studio Refinement Plan](<USER_HOME>/.gemini/antigravity/scratch/achievenest/frontend/docs/planning/portfolio-evaluation-studio-refinement-plan.md)** — HR Evaluation Studio layout modes and cognitive load reduction design.

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

# Run unit test suite
npm run test

# Run quality gate linter
npm run lint

# Build production bundle
npm run build
```
