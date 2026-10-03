# AchieveNest — Phase F: Justified Denormalization Register

> **Database:** `achievenest_local`  

---

## Formally Documented Justified Denormalizations

### 1. `profiles.full_name`
- **Authoritative Source**: `first_name`, `middle_name`, `last_name`
- **Derivation Rule**: `CONCAT_WS(" ", first_name, middle_name, last_name)`
- **Reason for Cache**: Sub-millisecond full-text searches and unified navbar/header rendering without runtime string concatenation.
- **Synchronization Mechanism**: Updated by ProfileService / AuthController on profile update transactions.

### 2. `student_profiles.year_level`
- **Authoritative Source**: `student_program_enrollments.year_level` (where `is_active = 1`)
- **Derivation Rule**: Current year level of active student program enrollment
- **Reason for Cache**: Prevents expensive join with historical enrollment records during frequent student portfolio queries.
- **Synchronization Mechanism**: Synchronized upon term enrollment activation and program progression.

