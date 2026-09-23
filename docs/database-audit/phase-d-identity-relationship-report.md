# AchieveNest — Phase D: Identity & Roles Relationship Report

> **Domain:** Identity, Authentication, and Dynamic Roles  

---

## Core Identity & Role Relationships

1. **Supertype / Subtype Pattern**:
   - `profiles (1)` $\rightarrow$ `(0..1) student_profiles` via `student_profiles.profile_id` (PK-to-PK FK, RESTRICT/CASCADE)
   - `profiles (1)` $\rightarrow$ `(0..1) personnel_profiles` via `personnel_profiles.profile_id` (PK-to-PK FK, RESTRICT/CASCADE)
2. **Role Assignment (M:N via Junction)**:
   - `profiles (1)` $\rightarrow$ `(N) profile_roles` $\leftarrow$ `(1) roles`
3. **Authentication & Session State**:
   - `profiles (1)` $\rightarrow$ `(0..1) local_auth_credentials`
   - `profiles (1)` $\rightarrow$ `(N) local_auth_sessions`
   - `profiles (1)` $\rightarrow$ `(N) password_reset_requests`
