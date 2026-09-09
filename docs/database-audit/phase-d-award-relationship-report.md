# AchieveNest — Phase D: Award Evaluation & Scoring Traceability Relationship Report

> **Domain:** 15 Authoritative Awards, Rubric Criteria, Components, Scoring, and OSAD Reviews  

---

## Award Relational Architecture

1. **Award Definition & Rubric Hierarchy**:
   - `award_definitions (1)` $\rightarrow$ `(N) award_criteria` via `award_definition_id`
   - `award_criteria (1)` $\rightarrow$ `(N) award_criterion_components` via `criterion_id`
2. **Student Award Review & Evaluation Workspace**:
   - `award_definitions (1)` $\rightarrow$ `(N) student_award_evaluations`
   - `profiles / student_profiles (1)` $\rightarrow$ `(N) student_award_evaluations`
   - `award_cycles (1)` $\rightarrow$ `(N) student_award_evaluations`
3. **Scoring Breakdown & Evidence Traceability Lineage**:
   - `student_award_evaluations (1)` $\rightarrow$ `(N) student_award_criterion_scores`
   - `student_award_criterion_scores (1)` $\rightarrow$ `(N) student_award_score_evidence`
   - `student_portfolio_records (1)` $\rightarrow$ `(N) student_award_score_evidence` (Complete Lineage Link)
