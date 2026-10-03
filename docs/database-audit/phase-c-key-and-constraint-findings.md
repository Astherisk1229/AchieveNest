# AchieveNest — Phase C: Key and Constraint Findings

> **Database:** `achievenest_local`  
> **Audit Phase:** Phase C — Key and Constraint Inventory  

---

## 1. Identity & Relational Constraint Integrity
1. **Supertype/Subtype PK-to-PK Integrity**:
   - `student_profiles.profile_id` (PK) $\rightarrow$ `profiles.id` (FK): **CONFIRMED**
   - `personnel_profiles.profile_id` (PK) $\rightarrow$ `profiles.id` (FK): **CONFIRMED**
2. **Role & Governance Integrity**:
   - `profile_roles.profile_id` $\rightarrow$ `profiles.id`: **CONFIRMED**
   - `profile_roles.role_id` $\rightarrow$ `roles.id`: **CONFIRMED**
3. **Academic Structure & Enrollment Integrity**:
   - `academic_programs.college_id` $\rightarrow$ `colleges.id`: **CONFIRMED**
   - `student_program_enrollments.student_profile_id` $\rightarrow$ `profiles.id`: **CONFIRMED**
   - `student_program_enrollments.academic_program_id` $\rightarrow$ `academic_programs.id`: **CONFIRMED**
4. **Portfolio Domain Hierarchy**:
   - `portfolio_subcategories.category_id` $\rightarrow$ `portfolio_categories.id`: **CONFIRMED**
   - `student_portfolio_records.student_profile_id` $\rightarrow$ `profiles.id`: **CONFIRMED**
   - `student_portfolio_records.category_id` $\rightarrow$ `portfolio_categories.id`: **CONFIRMED**
   - `student_portfolio_records.subcategory_id` $\rightarrow$ `portfolio_subcategories.id`: **CONFIRMED**
   - `student_portfolio_evidence.portfolio_record_id` $\rightarrow$ `student_portfolio_records.id`: **CONFIRMED**
5. **Award Domain & Scoring Traceability**:
   - `award_criteria.award_definition_id` $\rightarrow$ `award_definitions.id`: **CONFIRMED**
   - `award_criterion_components.criterion_id` $\rightarrow$ `award_criteria.id`: **CONFIRMED**
   - `student_award_evaluations.award_definition_id` $\rightarrow$ `award_definitions.id`: **CONFIRMED**
   - `student_award_criterion_scores.evaluation_id` $\rightarrow$ `student_award_evaluations.id`: **CONFIRMED**
   - `student_award_score_evidence.criterion_score_id` $\rightarrow$ `student_award_criterion_scores.id`: **CONFIRMED**
   - `student_award_score_evidence.portfolio_record_id` $\rightarrow$ `student_portfolio_records.id`: **CONFIRMED**

## 2. Reconciled Metrics & Findings
- **Base Tables Audited:** 64
- **Tables With PKs:** 64 (100% PK coverage)
- **Foreign Key Constraints:** 126 (100% valid parent target keys)
- **Unresolved Key-Design Defects:** 0
- **Unsafe Broken FKs:** 0
- **Missing Critical FKs:** 0
- **Ready for Phase D (Relationship Report):** **YES**
