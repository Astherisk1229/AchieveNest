# AchieveNest — Phase D: Domain Entity Relationship Diagrams (ERDs)

> **Database:** `achievenest_local`  

---

## 1. Identity & Roles Domain ERD

```mermaid
erDiagram
    PROFILES ||--o| STUDENT_PROFILES : "profile_id (1:0..1)"
    PROFILES ||--o| PERSONNEL_PROFILES : "profile_id (1:0..1)"
    PROFILES ||--o{ PROFILE_ROLES : "profile_id (1:N)"
    ROLES ||--o{ PROFILE_ROLES : "role_id (1:N)"
    PROFILES ||--o{ LOCAL_AUTH_SESSIONS : "profile_id (1:N)"
```

## 2. Academic & Student Enrollment Domain ERD

```mermaid
erDiagram
    COLLEGES ||--o{ ACADEMIC_PROGRAMS : "college_id (1:N)"
    ACADEMIC_PROGRAMS ||--o{ STUDENT_PROGRAM_ENROLLMENTS : "academic_program_id (1:N)"
    PROFILES ||--o{ STUDENT_PROGRAM_ENROLLMENTS : "student_profile_id (1:N)"
```

## 3. Student Portfolio Domain ERD

```mermaid
erDiagram
    PORTFOLIO_CATEGORIES ||--o{ PORTFOLIO_SUBCATEGORIES : "category_id (1:N)"
    PORTFOLIO_CATEGORIES ||--o{ STUDENT_PORTFOLIO_RECORDS : "category_id (1:N)"
    PORTFOLIO_SUBCATEGORIES ||--o{ STUDENT_PORTFOLIO_RECORDS : "subcategory_id (1:N)"
    PROFILES ||--o{ STUDENT_PORTFOLIO_RECORDS : "student_profile_id (1:N)"
    STUDENT_PORTFOLIO_RECORDS ||--o{ STUDENT_PORTFOLIO_EVIDENCE : "portfolio_record_id (1:N)"
```

## 4. OSAD Award Evaluation & Scoring Traceability Domain ERD

```mermaid
erDiagram
    AWARD_DEFINITIONS ||--o{ AWARD_CRITERIA : "award_definition_id (1:N)"
    AWARD_CRITERIA ||--o{ AWARD_CRITERION_COMPONENTS : "criterion_id (1:N)"
    AWARD_DEFINITIONS ||--o{ STUDENT_AWARD_EVALUATIONS : "award_definition_id (1:N)"
    PROFILES ||--o{ STUDENT_AWARD_EVALUATIONS : "student_profile_id (1:N)"
    STUDENT_AWARD_EVALUATIONS ||--o{ STUDENT_AWARD_CRITERION_SCORES : "evaluation_id (1:N)"
    STUDENT_AWARD_CRITERION_SCORES ||--o{ STUDENT_AWARD_SCORE_EVIDENCE : "criterion_score_id (1:N)"
    STUDENT_PORTFOLIO_RECORDS ||--o{ STUDENT_AWARD_SCORE_EVIDENCE : "portfolio_record_id (1:N)"
```
