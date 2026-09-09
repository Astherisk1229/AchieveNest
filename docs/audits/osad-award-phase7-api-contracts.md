# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Phase 7: REST API Contracts & Endpoint Specifications

> **Document:** `osad-award-phase7-api-contracts.md`  
> **Phase:** 7 of 8  
> **Status:** AUDITED & OPERATIONAL  

---

## 1. Registered Phase 7 Endpoints

| HTTP Verb | Path | Controller Action | Description |
|---|---|---|---|
| `POST` | `/api/v1/osad/awards/{awardId}/students/{studentId}/classify` | `classifyPotentialCandidate` | Evaluates and classifies student against the 80% threshold. |
| `GET` | `/api/v1/osad/awards/{awardId}/students/{studentId}/candidate-status` | `studentCandidateStatus` | Returns student normalized score and candidate status. |
| `GET` | `/api/v1/osad/awards/{awardId}/potential-candidates` | `listPotentialCandidates` | Lists all qualified Potential Candidates ($\ge 80\%$) in score order. |
| `GET` | `/api/v1/osad/awards/{awardId}/evaluated-results` | `listEvaluatedResults` | Lists all evaluated students (Potential Candidates and Below Threshold). |

---

## 2. API Contract Payloads

### 2.1 GET `/api/v1/osad/awards/{awardId}/potential-candidates`
```json
{
  "data": {
    "award": {
      "id": "50000001-0000-0000-0000-000000000001",
      "code": "NOTRE_DAME_AWARD",
      "name": "Notre Dame Award",
      "candidate_threshold_percent": 80.0,
      "portfolio_max": 50.0,
      "scoring_version": "v1.0"
    },
    "total_potential_candidates": 1,
    "potential_candidates": [
      {
        "student_id": "01214801-9565-4224-a46d-3b6c7a3665d0",
        "student_name": "Alex Reyes",
        "raw_portfolio_score": 40.0,
        "computable_max_score": 50.0,
        "portfolio_potential_score": 80.0,
        "candidate_threshold_percent": 80.0,
        "candidate_status": "POTENTIAL_CANDIDATE",
        "qualified": true,
        "scoring_version": "v1.0"
      }
    ]
  }
}
```

### 2.2 Structured Error / Precondition Response
```json
{
  "data": {
    "award_id": "50000001-0000-0000-0000-000000000001",
    "student_id": "std-uuid",
    "candidate_status": "NOT_CLASSIFIED",
    "qualified": false,
    "error_code": "EVALUATION_IN_PROGRESS",
    "reasons": [
      {
        "code": "EVALUATION_IN_PROGRESS",
        "message": "Review status is IN_PROGRESS"
      }
    ]
  }
}
```
