# CHU-03 Phase 1 — Candidate Review Architecture Audit
## Candidate Generation, Scoring Engine, and Explainability Audit

**Date:** 2026-09-10
**Repository:** `Astherisk1229/AchieveNest`
**Track:** CHU-03 — OSAD Functional Completion, Reports, and UI Finalization
**Component:** OSAD Award Candidate Review & Deliberation Engine

---

## 1. Executive Summary

This audit verifies the integration of **OSAD Candidate Review** against the backend candidate-generation engine (`AwardPotentialCandidateService`, `AwardScoringService`, `AwardEvaluationService`, `CampusJournalismScoringService`, `AwardReviewService`).

---

## 2. Architecture & Data Flow

```text
Award Definition & Criteria
-> Student Portfolio Master Records (Verified Evidence)
-> Automated Scoring Engine (AwardScoringService / CampusJournalismScoringService)
-> Candidate Classification (>= 80% Threshold or Dean Nomination)
-> Award Candidate Review API (AwardEvaluationController)
-> Candidate Review UI (OSADAwardCandidateReviewPage.jsx)
-> Deliberation & Manual Criteria (AwardReviewService::saveManualCriteria)
-> Persisted Status & Audit Event (student_award_evaluations / audit_logs)
```

---

## 3. Layer Verification Matrix

| Layer | File / Endpoint | Verification Finding | Status |
|---|---|---|:---:|
| **Candidate List API** | `GET /api/v1/osad/awards/{awardId}/potential-candidates` | Fetches students qualifying at $\ge 80\%$ score threshold from `student_award_evaluations` and `award_potential_candidates`. | **VERIFIED** |
| **Scoring Basis API** | `GET /api/v1/osad/awards/{awardId}/students/{studentId}/scoring-basis` | Returns exact criterion score breakdown with links to underlying `student_portfolio_records` and `student_award_score_evidence`. | **VERIFIED** |
| **Review Workspace API** | `GET /api/v1/osad/awards/{awardId}/students/{studentId}/review` | Packages portfolio score (computable max, capped points) and manual criteria slots (e.g., Moral Character, Panel Interview). | **VERIFIED** |
| **Manual Scoring API** | `PATCH /api/v1/osad/awards/{awardId}/students/{studentId}/manual-criteria` | Validates manual panel scores against rubric maximums and persists updates in `student_award_criterion_scores`. | **VERIFIED** |
| **Finalization API** | `POST /api/v1/osad/awards/{awardId}/students/{studentId}/finalize` | Validates that all required criteria are completed, transitions evaluation state to `EVALUATED`, and records audit event. | **VERIFIED** |
| **Dean Nomination API** | `POST /api/v1/dean/nominations` | Authorizes active College Deans to nominate candidates with justification. Reflected in OSAD candidate queue. | **VERIFIED** |
| **Frontend Page** | `OSADAwardCandidateReviewPage.jsx` | Renders candidate leaderboards, category summaries, top-3 distinction, score explainability, and deliberation action modals. | **VERIFIED** |

---

## 4. Score Explainability & Integrity Guarantees

1. **Backend Scoring Authority:** The frontend does not invent or alter authoritative point scores. All scores originate from verified portfolio achievements multiplied by criterion component weights.
2. **Deterministic Evidence Traceability:** Every scored point links back to an approved `student_portfolio_records` ID and category.
3. **Empty & Error State Discrimination:** `OSADAwardCandidateReviewPage.jsx` uses `OSADEmptyState` and `OSADSearchEmptyState` to cleanly distinguish between an empty candidate cycle vs. an error or search mismatch.
