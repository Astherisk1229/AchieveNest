# AchieveNest — Phase E: Shared Attribute Ownership Report

> **Scope:** Supertype Attribute Allocation across Identity Domains  

---

| Attribute | Supertype (`profiles`) | Subtype (`student_profiles`) | Subtype (`personnel_profiles`) | Ownership Rationale |
|---|:---:|:---:|:---:|---|
| `id` | **YES** | FK (`profile_id`) | FK (`profile_id`) | Universal UUID identity |
| `institutional_id` | **YES** | - | - | Universal institutional identifier |
| `email` | **YES** | - | - | Single canonical institutional email |
| `first_name`, `middle_name`, `last_name` | **YES** | - | - | Atomic personal name components |
| `full_name` | **YES** (Derived) | - | - | Fast search & rendering cache |
| `sex` | **YES** (Authoritative) | - | - | Single authoritative legal/award sex source |
| `designation_title` | **YES** (Shared display) | - | - | Retained for unified navbar/profile card |
| `enrollment_status` | - | **YES** | - | Student-specific lifecycle status |
| `year_level` (current) | - | **YES** (Derived) | - | Current year level cache (historical in enrollments) |
| `personnel_classification` | - | - | **YES** | Personnel-specific employment class |
| `employment_status` | - | - | **YES** | Personnel-specific contract status |
| `rank_level` | - | - | **YES** | Academic/administrative rank level |
