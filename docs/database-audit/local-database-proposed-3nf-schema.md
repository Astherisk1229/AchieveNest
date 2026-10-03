# AchieveNest — Local Database Proposed 3NF Schema

> **Database:** `achievenest_local`  
> **Architecture Decision:** RETAIN CURRENT SCHEMA WITH ZERO DESTRUCTIVE MUTATIONS  

---

## 1. Schema Retention Specification
The formal 3NF synthesis confirms that `achievenest_local` conforms to Third Normal Form across all 64 base tables:
- **62 Tables satisfy strict 3NF** with zero transitive dependencies.
- **2 Tables retain justified, documented physical denormalization caches**:
  1. `profiles.full_name`: Formatted display name cache for sub-millisecond search.
  2. `student_profiles.year_level`: Current active academic year level cache (historical authority resides in `student_program_enrollments.year_level`).

## 2. Institutional Supertype / Subtype Entity Model
```text
profiles (Supertype PK: id)
  ├── student_profiles (Subtype PK-FK: profile_id)
  │     └── student_program_enrollments (Enrollment History PK: id)
  └── personnel_profiles (Subtype PK-FK: profile_id)
        ├── personnel_program_affiliations
        ├── personnel_college_affiliations
        └── personnel_administrative_unit_affiliations
```
