# Phase 1 API Inventory: OSAD Award Evaluation & Portfolio Scoring

**Document Identifier:** `docs/audits/osad-award-phase1-api-inventory.md`  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Phase:** 1 of 8 (Repository Audit & Legacy Isolation)  
**Status:** **API CONTRACTS AUDITED**

---

## 1. Executive Summary

This inventory documents all backend API endpoints handling award definitions, candidate evaluations, scoring basis explainability, threshold updates, and nominations.

---

## 2. OSAD Award API Inventory Table

| HTTP Verb | Route | Backend Controller / Handler | Purpose | Auth Guard | Legacy Assumptions? | Callers | Classification | Phase Action |
|---|---|---|---|---|:---:|---|:---:|---|
| `GET` | `/api/v1/osad/awards` | `AwardEvaluationController::listAwards` | Lists all active award definitions with criteria & subcriteria components | `osad_admin` (Bearer) | **None** (Clean API) | `awardAdminService.js` (`fetchAwards`) | **KEEP** | Foundation preserved |
| `POST` | `/api/v1/osad/awards/{id}/evaluate` | `AwardEvaluationController::evaluateAward` | Runs automated evaluation for all eligible students or single student | `osad_admin` (Bearer) | **None** (Evaluates criteria) | `awardAdminService.js` (`evaluateAward`) | **KEEP** | Foundation preserved |
| `PATCH` | `/api/v1/osad/awards/{id}/candidate-threshold` | `AwardEvaluationController::updateCandidateThreshold` | Updates candidate qualifying threshold percentage (default 80.00%) | `osad_admin` (Bearer) | **None** | `awardAdminService.js` | **KEEP** | Foundation preserved |
| `GET` | `/api/v1/osad/candidates` | `AwardEvaluationController::listAllCandidates` | Returns all potential candidates and dean nominations across awards | `osad_admin` (Bearer) | **None** | `awardAdminService.js` (`fetchCandidates`) | **KEEP** | Foundation preserved |
| `GET` | `/api/v1/osad/awards/{id}/candidates` | `AwardEvaluationController::listCandidates` | Returns candidate queue for a specific award with dense ranking | `osad_admin` (Bearer) | **None** | `awardAdminService.js` | **KEEP** | Foundation preserved |
| `GET` | `/api/v1/osad/awards/{awardId}/students/{studentId}/basis` | `AwardEvaluationController::scoringBasis` | Returns explainable scoring basis with linked evidence | `osad_admin` (Bearer) | **None** | `awardAdminService.js` (`fetchScoringBasis`) | **KEEP** | Foundation preserved |
| `GET` | `/api/v1/awards/campus-journalism/candidates` | `AwardEvaluationController::campusJournalismCandidates` | Returns all graduating Campus Journalism candidates ($\ge 80\%$) | Authenticated (Bearer) | **None** | `CampusJournalismScoringBasisModal` | **KEEP** | Foundation preserved |
| `GET` | `/api/v1/awards/campus-journalism/students/{id}/score` | `AwardEvaluationController::campusJournalismScore` | Computes 70-point score & full explainability DTO | Authenticated (Bearer) | **None** | `CampusJournalismScoringBasisModal` | **KEEP** | Foundation preserved |
| `POST` | `/api/v1/dean/nominations` | `AwardEvaluationController::createDeanNomination` | Records attributable Dean student nomination | `dean` (Bearer) | **None** | Dean nomination view | **KEEP** | Foundation preserved |

---

## 3. Key Findings: "Students for Evaluation" vs. "Potential Candidates"

- **"Students for Evaluation"**: Active students meeting basic eligibility (e.g. graduating status, active portfolio) whose achievements are eligible for criterion scoring.
- **"Potential Candidates"**: Evaluated students whose normalized Portfolio Potential Score meets or exceeds the award-specific qualifying threshold ($\ge 80.00\%$).
- The backend API cleanly separates evaluation calculation from candidate qualification. No legacy endpoints in backend rely on `total_points * weight_multiplier`.
