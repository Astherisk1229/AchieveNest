# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Phase 5: REST API Contracts & Endpoints

> **Document:** `osad-award-phase5-api-contracts.md`  
> **Phase:** 5 of 8  
> **Status:** AUDITED & OPERATIONAL  

---

## 1. Registered API Routes

| HTTP Method | Route | Controller Method | Access Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/osad/awards/{awardId}/students/{studentId}/score` | `scoreStudentAward` | OSAD Admin | Calculates exact rubric scores for an eligible student and returns full traceability. |
| `GET` | `/api/v1/osad/awards/{awardId}/students/{studentId}/scoring-basis` | `studentScoringBasis` | OSAD Admin / Evaluator | Returns explainable scoring basis and mapped evidence without modifying evaluation status. |

---

## 2. Request & Response Payload Specifications

### POST `/api/v1/osad/awards/{awardId}/students/{studentId}/score`

#### Success Response (`200 OK`)
```json
{
  "data": {
    "award_id": "50000001-0000-0000-0000-000000000001",
    "award_code": "NOTRE_DAME_AWARD",
    "award_name": "Notre Dame Award",
    "student_id": "std-uuid-1234",
    "student_name": "John Doe",
    "is_eligible": true,
    "raw_portfolio_score": 19.0,
    "computable_max_score": 50.0,
    "scoring_version": "1.0",
    "criteria_scores": [
      {
        "criterion_id": "50000002-0001-0000-0000-000000000001",
        "criterion_code": "CRIT_NDA_LEADERSHIP",
        "criterion_name": "Leadership: On and Off Campus",
        "earned_points": 19.0,
        "max_points": 20.0,
        "components": [
          {
            "component_code": "COMP_LEADERSHIP_INVOLVEMENT",
            "component_name": "Leadership Involvement",
            "rule_type": "HIGHEST_APPLICABLE_ONLY",
            "earned_points": 10.0,
            "max_points": 10.0
          },
          {
            "component_code": "COMP_AWARDS_CITATIONS_SEMINARS",
            "component_name": "Awards, Citations and Seminars",
            "rule_type": "ACCUMULATE_WITH_CAP",
            "earned_points": 9.0,
            "max_points": 10.0
          }
        ]
      }
    ],
    "evidence_traceability": [
      {
        "record_id": "nd-1",
        "title": "SSG Executive President",
        "criterion_code": "CRIT_NDA_LEADERSHIP",
        "component_name": "Leadership Involvement (Highest Only)",
        "rule_type": "HIGHEST_APPLICABLE_ONLY",
        "base_points": 10.0,
        "contribution_points": 10.0,
        "is_selected": true
      }
    ],
    "scoring_status": "SCORED"
  }
}
```
