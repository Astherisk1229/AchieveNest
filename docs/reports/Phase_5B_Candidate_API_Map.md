# Phase 5B — Candidate Generation API Map
## Endpoints, Request Headers, Candidate DTO Schemas, and Response Contracts

**Domain:** Candidate API Contract  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:50:00 UTC+08:00  

---

## 1. Candidate List Endpoint: `GET /api/v1/awards/campus-journalism/candidates`

### Headers:
- `Authorization: Bearer <jwt_token>`
- `Accept: application/json`

### Success Response (`200 OK`):
```json
{
  "data": {
    "award_code": "CAMPUS_JOURNALISM_AWARD",
    "award_name": "Campus Journalism Award",
    "total_candidates": 14,
    "threshold_percent": 80.00,
    "threshold_raw": 56.00,
    "is_portfolio_computable": true,
    "official_rubric_max": 100.00,
    "computable_raw_max": 70.00,
    "human_evaluated_criteria": [
      {
        "criterion_code": "CRIT_JOURN_CHAR",
        "label": "Moral Character / Exemplary Conduct",
        "max_points": 20.00,
        "status_label": "Not automatically scored (OSAD Human Evaluation)"
      },
      {
        "criterion_code": "CRIT_JOURN_INTV",
        "label": "Panel Interview / Deliberation",
        "max_points": 10.00,
        "status_label": "Not automatically scored (OSAD Human Evaluation)"
      }
    ],
    "candidates": [
      {
        "student_id": "std_001",
        "student_name": "Maria Santos",
        "institutional_id": "STU-2024-001",
        "student_email": "msantos@ndmu.edu.ph",
        "program_code": "BSIT",
        "program_name": "BS Information Technology",
        "college_name": "CEAC",
        "year_level": "4th Year",
        "publication_score": 54.00,
        "leadership_score": 8.00,
        "raw_score": 62.00,
        "raw_max": 70.00,
        "potential_score": 88.57,
        "threshold_percent": 80.00,
        "threshold_raw": 56.00,
        "status_label": "Potential Candidate",
        "pathway": "Portfolio-Based Discovery",
        "calculated_at": "2026-08-31 22:50:00",
        "scoring_basis": { ... }
      }
    ]
  }
}
```
