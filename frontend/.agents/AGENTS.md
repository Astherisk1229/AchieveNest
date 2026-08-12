# AchieveNest Project Architectural Guidelines & Rules

## 1. OOP & MVC Architectural Standard
- **Mandatory Paradigm**: Always adhere strictly to the **OOP (Object-Oriented Programming)** and **MVC (Model-View-Controller)** architecture established in [`SYSTEM_ARCHITECTURE_ANALYSIS.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/SYSTEM_ARCHITECTURE_ANALYSIS.md).
- **Domain Models (`src/models/`)**: Encapsulate all entity schemas, validations, and domain logic inside ES6 classes (`UserModel`, `StudentModel`, `AchievementModel`, `VerificationQueueModel`). Avoid raw inline unencapsulated object state mutations.
- **Controllers (`src/controllers/`)**: Place all business logic, data filtering, sorting, report compilation, and storage operations in dedicated Controller classes (`AuthController`, `VerificationController`, `RosterController`).
- **Bridge Hooks (`src/hooks/`)**: Connect View components to Controllers using custom React hooks e.g. `useVerification`, `useStudentRoster`.
- **Lightweight Views (`src/components/`, `src/pages/`)**: Keep UI components clean, focused purely on layout, styling, and rendering without embedding inline data model schemas or business logic.
- **Zero UI Disruption Guarantee**: All refactoring and architectural updates must preserve 100% visual layout, styling, and user interaction parity.
