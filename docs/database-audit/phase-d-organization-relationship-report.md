# AchieveNest — Phase D: Student Organizations Relationship Report

> **Domain:** Recognized Student Organizations, College/Program Scopes, and Moderator Assignments  

---

## Organization Relationships

1. **College Affiliation**: `colleges (1)` $\rightarrow$ `(N) organizations` (optional for institutional orgs)
2. **Program Affiliation**: `organizations (1)` $\rightarrow$ `(N) organization_program_affiliations` $\leftarrow$ `(1) academic_programs`
3. **Moderator Assignment**: `organizations (1)` $\rightarrow$ `(N) organization_moderator_assignments` $\leftarrow$ `(1) profiles (personnel)`
