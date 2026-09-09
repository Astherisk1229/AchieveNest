# Plan 06 Phase 2 — OSAD Navigation Overlap Resolution
## Conceptual Resolution and Hierarchy Separation for Overlapping Workflows

### 1. Overlap 1: Student Accounts vs Award Candidate Review
- **Student Accounts (`?tab=accounts`)**:
  - *Core Responsibility*: Administrative student directory, account provisioning, profile status, and row-level "View Portfolio" action.
  - *Intent*: Identity management, academic program verification, and ad-hoc student dossier inspection.
  - *Information Architecture Resolution*: Placed in **Student & Institutional Setup**.
- **Award Candidate Review (`?tab=candidate-review`)**:
  - *Core Responsibility*: Batch candidate deliberation, award relevance mapping, stage 1 scoring calculations, and committee confirmations.
  - *Intent*: Institutional award evaluation and candidate outcome determination.
  - *Information Architecture Resolution*: Placed in **Portfolio & Evaluation**.
- *Boundary Conclusion*: `Student Accounts` serves as an operational entry point; `Award Candidate Review` serves as an analytical evaluation workspace.

---

### 2. Overlap 2: Student Accounts vs Password Resets
- **Student Accounts (`?tab=accounts`)**:
  - *Context*: Inline row actions allow resetting a specific student's password directly from their profile row.
- **Password Resets (`?tab=password-resets`)**:
  - *Context*: Dedicated triage queue listing student-initiated password reset requests across all colleges.
  - *Information Architecture Resolution*: Both items belong to **Student & Institutional Setup**. `Password Resets` provides queue-based workflow processing, while `Student Accounts` provides entity-based administration.
