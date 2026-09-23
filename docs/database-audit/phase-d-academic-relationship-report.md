# AchieveNest — Phase D: Academic & Student Relationship Report

> **Domain:** Colleges, Academic Programs, and Student Program Enrollment History  

---

## Academic Hierarchy & Student Enrollment Relationships

1. **Institutional Academic Structure**:
   - `colleges (1)` $\rightarrow$ `(N) academic_programs` via `academic_programs.college_id`
2. **Student Enrollment History (M:N via Junction)**:
   - `student_profiles (1)` $\rightarrow$ `(N) student_program_enrollments`
   - `academic_programs (1)` $\rightarrow$ `(N) student_program_enrollments`
3. **Authoritative Year Level Semantics**:
   - `student_program_enrollments.year_level` records the authoritative historical year level for that academic period/semester.
   - `active_student_guard` enforces single-active enrollment uniqueness per student.
