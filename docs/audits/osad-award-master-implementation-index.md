# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Master Implementation Index

> **Document:** `osad-award-master-implementation-index.md`  
> **Master Plan:** `AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE`  
> **Scope:** Full 8-Phase Implementation Lifecycle  
> **Final Status:** FULLY COMPLIANT / IMPLEMENTATION CLOSED  

---

## 1. Phase Master Directory

| Phase | Title | Primary Implementation Files | Key Audit Artifacts | Test Command | Gate Status |
|---|---|---|---|---|---|
| **Phase 1** | Repository Audit & Legacy Isolation | `app/Services/*`, `awardAdminService.js` | `osad-award-phase1-legacy-isolation-inventory.md` | `php backend/run_phase1_audit.php` | **CLOSED** |
| **Phase 2** | Authoritative Award Definitions & Rubrics | `award_definitions`, `award_criteria`, `award_criterion_components` | `osad-award-phase2-award-registry.md`, `osad-award-phase2-computable-maximums.md` | Database Seeder Verifier | **CLOSED** |
| **Phase 3** | Eligibility Gate Engine | `AwardEligibilityService.php`, `AwardEvaluationController.php` | `osad-award-phase3-eligibility-matrix.md`, `osad-award-phase3-api-contracts.md` | `php backend/run_phase3_tests.php` | **CLOSED** |
| **Phase 4** | Verified Evidence Mapping & Students for Evaluation | `AwardEvidenceMappingService.php`, `OSADStudentsForEvaluationView.jsx` | `osad-award-phase4-evidence-mapping-matrix.md`, `osad-award-phase4-students-for-evaluation.md` | `php backend/run_phase4_tests.php` | **CLOSED** |
| **Phase 5** | Award-Specific Scoring Engine & Traceability | `AwardScoringService.php`, Matrix Rules, Traceability Engine | `osad-award-phase5-scoring-rules.md`, `osad-award-phase5-matrix-traceability.md` | `php backend/run_phase5_tests.php` | **CLOSED** |
| **Phase 6** | OSAD Evaluation Workflow, Manual Criteria & Compliance | `AwardReviewService.php`, `OSADStudentAwardReviewWorkspace.jsx` | `osad-award-phase6-review-workflow.md`, `osad-award-phase6-compliance-audit.md` | `php backend/run_phase6_compliance_suite.php` | **FULLY COMPLIANT / CLOSED** |
| **Phase 7** | Potential Candidate Engine & Normalization | `AwardPotentialCandidateService.php`, `OSADPotentialCandidatesView.jsx` | `osad-award-phase7-potential-candidate-engine.md`, `osad-award-phase7-threshold-matrix.md` | `php backend/run_phase7_tests.php` | **CLOSED** |
| **Phase 8** | Final System-Wide Audit & Closure | End-to-End Suite, Architecture & Governance Deliverables | `osad-award-final-architecture.md`, `osad-award-phase8-completion-report.md` | `php backend/run_phase8_tests.php` | **FULLY COMPLIANT / IMPLEMENTATION CLOSED** |

---

## 2. Core Governance Invariants

1. **One Master Portfolio**: One student has one master portfolio containing Verified evidence mapped across multiple award rubrics.
2. **Student Does Not Apply**: Students submit achievements to the master portfolio; OSAD evaluates eligibility and rubric alignment.
3. **Verified Only**: Only records with status `'verified'` enter the award scoring pipeline.
4. **Universal 80% Potential Candidate Threshold**:
   $$\text{Portfolio Potential Score} = \left(\frac{\text{Raw Portfolio Score}}{\text{Computable Maximum}}\right) \times 100 \ge 80.00\%$$
5. **Non-Negotiable Rule**: **$\text{Potential Candidate} \ne \text{Final Awardee / Winner}$**. Zero automated winner selection or Top-N truncations.
