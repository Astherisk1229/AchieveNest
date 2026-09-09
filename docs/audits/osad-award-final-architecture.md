# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Final System Architecture & Pipeline Specification

> **Document:** `osad-award-final-architecture.md`  
> **Status:** AUDITED & OPERATIONAL  

---

## 1. End-to-End Evaluation Pipeline

```mermaid
flowchart TD
    subgraph MasterData [Master Institutional Data]
        AD[Award Definitions (15 Authoritative Awards)]
        SP[Student Profiles & Enrollments]
        MP[Master Student Portfolio (9 Taxonomy Categories)]
    end

    subgraph ServicePipeline [Service Architecture Pipeline]
        P3[AwardEligibilityService (Phase 3)]
        P4[AwardEvidenceMappingService (Phase 4)]
        P5[AwardScoringService (Phase 5)]
        P6[AwardReviewService (Phase 6)]
        P7[AwardPotentialCandidateService (Phase 7)]
    end

    subgraph Persistence [Database Persistence]
        DB_EVAL[(student_award_evaluations)]
        DB_SCORE[(student_criterion_scores)]
        DB_MANUAL[(student_evaluation_manual_scores)]
    end

    subgraph OSADPresentation [OSAD User Interface]
        UI_AWARDS[OSADAwardsAndCriteriaPage (Catalog Level 1)]
        UI_POOL[OSADStudentsForEvaluationView (Pool Level 2)]
        UI_WORK[OSADStudentAwardReviewWorkspace (Review Level 3)]
        UI_CAND[OSADPotentialCandidatesView (Candidates Level 2b)]
    end

    AD --> P3
    SP --> P3
    P3 -- Eligible Pool --> P4
    MP --> P4
    P4 -- Mapped Evidence --> P5
    P5 -- Computed Raw Score & Traceability --> P6
    P6 -- Save Draft / Finalize (EVALUATED) --> DB_EVAL
    DB_EVAL --> P7
    P7 -- 80% Potential Candidate --> UI_CAND
    UI_AWARDS --> UI_POOL
    UI_POOL --> UI_WORK
    UI_AWARDS --> UI_CAND
    UI_CAND --> UI_WORK
```

---

## 2. Core Service Responsibilities

1. **`AwardEligibilityService`**: Evaluates Active Award, Active Profile, Graduation Gate (8 graduating, 7 open), and Sex Gate (4 Female, 4 Male, 7 Non-Sex).
2. **`AwardEvidenceMappingService`**: Maps only `'verified'` records from the 9 master taxonomy categories into award-specific criteria.
3. **`AwardScoringService`**: Evaluates 8 rule families (Highest-Only, Accumulate with Cap, Distinct Category, Fixed Presence, Per-Record Capped, Level × Result Matrix, Publication Scoring) with full evidence traceability.
4. **`AwardReviewService`**: Manages OSAD evaluation workflow (`pending` $\rightarrow$ `in_review` $\rightarrow$ `completed`), stores manual deliberation scores strictly outside the portfolio score.
5. **`AwardPotentialCandidateService`**: Normalizes $(raw / computable\_max) \times 100$, applies universal $80.00\%$ threshold, persists status, presents candidate list in score order with zero winner declarations.
