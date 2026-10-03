# Phase 4D — Explainability Payload Specification
## Structured Scoring DTO, Record-Level Breakdowns, and UI Accordion Contract

**Domain:** Explainability DTO & Contract  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:45:00 UTC+08:00  

---

## 1. Top-Level Explainability JSON Payload

```json
{
  "award_code": "CAMPUS_JOURNALISM_AWARD",
  "award_name": "Campus Journalism Award",
  "student_id": "std_001_uuid",
  "raw_score": 62.00,
  "raw_max": 70.00,
  "potential_score": 88.57,
  "threshold_percent": 80.00,
  "threshold_raw": 56.00,
  "result": "POTENTIAL_CANDIDATE",
  "calculated_at": "2026-08-31 22:45:00",
  "sections": [
    {
      "criterion_code": "CRIT_JOURN_PUB",
      "label": "Verified Publication Evidence",
      "score": 54.00,
      "max_score": 60.00,
      "cap_applied": false,
      "components": [
        {
          "component_code": "COMP_JOURN_NEWS",
          "label": "News Item",
          "rule_summary": "2 points per verified published news item, maximum 10 points.",
          "points_per_record": 2.0,
          "score": 10.00,
          "max_score": 10.00,
          "qualifying_count": 7,
          "contributing_count": 5,
          "uncapped_points": 14.00,
          "cap_applied": true,
          "records": [
            {
              "record_id": "rec_001",
              "title": "Campus Welcomes New Freshmen",
              "publication_outlet": "The NDMU Herald",
              "publication_date": "2025-08-20",
              "verification_status": "verified",
              "lifecycle_status": "active",
              "base_points": 2.0,
              "points_awarded": 2.0,
              "contribution_status": "COUNTED",
              "evidence_count": 1
            },
            {
              "record_id": "rec_006",
              "title": "Sixth Published News Story",
              "publication_outlet": "The NDMU Herald",
              "publication_date": "2025-11-10",
              "verification_status": "verified",
              "lifecycle_status": "active",
              "base_points": 2.0,
              "points_awarded": 0.0,
              "contribution_status": "CAP_REACHED",
              "evidence_count": 1
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 2. Contribution Status Enum Values

| Status Value | Meaning in Scoring Engine | Points Awarded |
|---|---|:---:|
| `COUNTED` | Qualifying record contributed points to the component subtotal. | $2.0, 3.0, \text{ or } 4.0$ |
| `CAP_REACHED` | Record is verified and valid, but component maximum score is already achieved. | $0.0$ |
| `SUPPORTING_ONLY` | Record is verified supporting evidence (e.g. Journalism Seminar/Training). | $0.0$ |
| `DUPLICATE_ROLE_EXCLUDED` | Record represents a duplicate role in the same term/organization. | $0.0$ |
