# AchieveNest — Phase D: Personnel & Affiliations Relationship Report

> **Domain:** Faculty, Staff, Academic/Administrative Affiliations & Governance Assignments  

---

## Personnel Relationships

1. **Program Affiliations**:
   - `personnel_profiles (1)` $\rightarrow$ `(N) personnel_program_affiliations` $\leftarrow$ `(1) academic_programs`
2. **College Affiliations**:
   - `personnel_profiles (1)` $\rightarrow$ `(N) personnel_college_affiliations` $\leftarrow$ `(1) colleges`
3. **Administrative Unit Affiliations**:
   - `personnel_profiles (1)` $\rightarrow$ `(N) personnel_administrative_unit_affiliations` $\leftarrow$ `(1) administrative_units`
4. **Governance Assignments**:
   - `dean_assignments`: links `personnel_profiles` to `colleges`
   - `program_coordinator_assignments`: links `personnel_profiles` to `academic_programs`
