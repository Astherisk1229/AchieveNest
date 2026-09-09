# AchieveNest — Phase E: Account Type vs Role Architecture Analysis

> **Scope:** Semantic Differentiation between `profiles.account_type`, `profile_roles`, and Governance Assignments  

---

## 1. Three-Tier Role & Identity Model

AchieveNest implements a clean, normalized three-tier identity and authorization architecture:

1. **Tier 1: Base Identity Subtype (`profiles.account_type`)**:
   - Immutable base account category: `student`, `faculty`, `staff`, `osad_admin`, `hr_admin`, `admin`.
   - Governs primary login landing page, default portal layouts, and profile subtype creation (`student_profiles` vs `personnel_profiles`).

2. **Tier 2: Dynamic Functional Roles (`profile_roles` $\rightarrow$ `roles`)**:
   - Assignable RBAC capabilities: `dean`, `program_coordinator`, `organization_moderator`, `osad_evaluator`, `hr_evaluator`.
   - Allows a user (e.g. `account_type = 'faculty'`) to dynamically hold multiple governance roles without altering their base account class.

3. **Tier 3: Organizational Scope Assignments (Specialized Assignment Tables)**:
   - `dean_assignments`: Maps Dean to specific `colleges`.
   - `program_coordinator_assignments`: Maps Program Coordinator to specific `academic_programs`.
   - `organization_moderator_assignments`: Maps Moderator to specific `organizations`.

## 2. 3NF Assessment
**Conclusion**: Fully passes 3NF. Tier 1 defines the entity subtype discriminator; Tier 2 defines M:N role capability grants; Tier 3 defines specific organizational domain scopes. No redundant or overlapping columns exist.
