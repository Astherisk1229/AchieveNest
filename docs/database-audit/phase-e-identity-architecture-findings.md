# AchieveNest — Phase E: Identity Architecture Findings & Decision

> **Audit Phase:** Phase E — Identity Architecture Audit  

---

## 1. Architectural Findings
1. **Supertype / Subtype Integrity**: The shared `profiles` table with `student_profiles` and `personnel_profiles` extensions is clean, normalized, and avoids all table-level identity duplication.
2. **Sex Attribute Authority**: `profiles.sex` is the confirmed single authoritative source for award eligibility gates.
3. **Designation Title Placement**: `profiles.designation_title` is validly placed in the supertype for unified header rendering across all portals.
4. **Year Level Authority**: `student_program_enrollments.year_level` is authoritative historical source; `student_profiles.year_level` is a justified active cache.
5. **Role Architecture**: Clear 3-tier model (`account_type` base discriminator $\rightarrow$ `profile_roles` RBAC $\rightarrow$ Scope assignment tables).

## 2. Canonical Architecture Decision
```text
IDENTITY ARCHITECTURE DECISION:
RETAIN CURRENT SUPERTYPE/SUBTYPE MODEL UNCHANGED

The current shared `profiles` supertype with `student_profiles` and `personnel_profiles`
subtype extensions satisfies all 3NF principles, preserves historical data, avoids identity
duplication, and matches AchieveNest institutional requirements.
Zero structural changes or new `students`/`personnel` tables required.
```
