# Phase 4E — Scoring API Map
## Endpoints, Request Headers, Query Parameters, and Response Contracts

**Domain:** Scoring API Contract  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:45:00 UTC+08:00  

---

## 1. Summary of Scoring API Endpoints

| HTTP Method | Route / Endpoint | Authorized Roles | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/awards/campus-journalism/students/{studentId}/score` | OSAD, Program Coordinator, Student (Self), Dean | Computes authoritative 70-point score and explainability payload for a student. |
| `GET` | `/api/v1/osad/awards/{awardId}/students/{studentId}/basis` | OSAD, Dean, Committee | General award scoring basis endpoint returning evaluation snapshots. |
| `POST` | `/api/v1/osad/awards/{awardId}/evaluate` | OSAD Staff | Triggers evaluation cycle candidate generation across all eligible students. |

---

## 2. API Endpoint Specification: `GET /api/v1/awards/campus-journalism/students/{studentId}/score`

### Headers:
- `Authorization: Bearer <jwt_token>`
- `Accept: application/json`

### Success Response (`200 OK`):
```json
{
  "data": {
    "award_code": "CAMPUS_JOURNALISM_AWARD",
    "award_name": "Campus Journalism Award",
    "student_id": "std_001",
    "raw_score": 62.00,
    "raw_max": 70.00,
    "potential_score": 88.57,
    "threshold_percent": 80.00,
    "threshold_raw": 56.00,
    "result": "POTENTIAL_CANDIDATE",
    "calculated_at": "2026-08-31 22:45:00",
    "sections": []
  }
}
```

### Error Responses:
- `401 UNAUTHORIZED`: Authentication token missing or invalid.
- `404 RECORD_NOT_FOUND`: Student profile does not exist.
- `500 SCORING_FAILED`: Calculation failed due to internal exception.
