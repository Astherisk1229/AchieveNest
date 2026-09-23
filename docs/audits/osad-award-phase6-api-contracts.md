# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Phase 6: REST API Contracts & Endpoint Specifications

> **Document:** `osad-award-phase6-api-contracts.md`  
> **Phase:** 6 of 8  
> **Status:** AUDITED & OPERATIONAL  

---

## 1. Registered Phase 6 Endpoints

| HTTP Verb | Path | Controller Action | Description |
|---|---|---|---|
| `GET` | `/api/v1/osad/awards/{awardId}/students/{studentId}/review` | `studentAwardReview` | Returns unified evaluation package (award, student, eligibility, portfolio scoring, manual criteria, relevant evidence, review notes, review status). |
| `PATCH` | `/api/v1/osad/awards/{awardId}/students/{studentId}/manual-criteria` | `saveManualCriteria` | Saves draft manual scores or validates and persists updates. |
| `POST` | `/api/v1/osad/awards/{awardId}/students/{studentId}/finalize` | `finalizeStudentAwardEvaluation` | Validates all manual criteria and finalizes review (`EVALUATED`). |
| `POST` | `/api/v1/osad/awards/{awardId}/students/{studentId}/recalculate` | `recalculatePortfolioScore` | Recalculates Phase 5 portfolio scores from master evidence without wiping manual entries. |

---

## 2. Payload Specifications

### 2.1 GET `/api/v1/osad/awards/{awardId}/students/{studentId}/review`
```json
{
  "data": {
    "award": {
      "id": "50000001-0000-0000-0000-000000000001",
      "code": "NOTRE_DAME_AWARD",
      "name": "Notre Dame Award",
      "computable_max_score": 50.0,
      "governance": {
        "badge_type": "OFFICIAL",
        "badge_text": "Official OSAD Rubric"
      }
    },
    "student": {
      "id": "std-uuid",
      "full_name": "John Doe",
      "program": "BSIT",
      "year_level": "4th Year"
    },
    "evaluation_status": "IN_PROGRESS",
    "is_finalized": false,
    "portfolio_scoring": {
      "raw_portfolio_score": 19.0,
      "computable_max_score": 50.0,
      "is_read_only": true,
      "criteria": []
    },
    "manual_panel_criteria": [
      {
        "criterion_id": "crit-scholastic-id",
        "criterion_name": "Scholastic Achievement",
        "official_max_points": 30.0,
        "current_score": 28.5,
        "status": "REVIEWED"
      }
    ],
    "review_notes": "Good character and scholastic standing."
  }
}
```

### 2.2 PATCH `/api/v1/osad/awards/{awardId}/students/{studentId}/manual-criteria`
```json
// Request Body
{
  "manual_scores": {
    "crit-scholastic-id": 28.5,
    "crit-character-id": 19.0
  },
  "notes": "Committee deliberation complete."
}

// Success Response (200 OK)
{
  "data": {
    "award_id": "50000001-0000-0000-0000-000000000001",
    "student_id": "std-uuid",
    "review_status": "IN_PROGRESS",
    "is_finalized": false,
    "saved_scores": [
      {
        "criterion_id": "crit-scholastic-id",
        "score": 28.5,
        "official_max": 30.0,
        "status": "REVIEWED"
      }
    ],
    "message": "Manual criteria draft saved successfully."
  }
}
```
