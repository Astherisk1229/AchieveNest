# Phase 4 Deliverable: API Contracts & Diagnostics

**Document Identifier:** `docs/audits/osad-award-phase4-api-contracts.md`  
**Phase:** 4 of 8 (Verified Evidence Mapping & Students for Evaluation Engine)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **API CONTRACTS FORMALIZED & REGISTERED**

---

## 1. Endpoint Summary

| Endpoint | Method | Role Guard | Purpose |
|---|---|---|---|
| `/api/v1/osad/awards/{awardId}/students-for-evaluation` | `GET` | OSAD Admin / Staff | Returns all eligible students who have $\ge 1$ relevant verified mapped record. |
| `/api/v1/osad/awards/{awardId}/students/{studentId}/evidence` | `GET` | OSAD Admin / Evaluator | Returns the full award-filtered relevant evidence package for review. |

---

## 2. Students for Evaluation Contract

**Request:** `GET /api/v1/osad/awards/50000001-0000-0000-0000-000000000001/students-for-evaluation`

**Response (`200 OK`):**
```json
{
  "data": {
    "award_id": "50000001-0000-0000-0000-000000000001",
    "total_students": 12,
    "students": [
      {
        "student_id": "std-uuid-1",
        "student_name": "Juan Dela Cruz",
        "student_id_number": "2022-00123",
        "program": "BS Computer Science",
        "college": "College of Computer Studies",
        "award_id": "50000001-0000-0000-0000-000000000001",
        "award_code": "NOTRE_DAME_AWARD",
        "award_name": "Notre Dame Award",
        "award_level_eligible": true,
        "has_relevant_verified_evidence": true,
        "relevant_verified_record_count": 5,
        "matched_criterion_count": 3,
        "evaluation_status": "NOT_REVIEWED"
      }
    ]
  }
}
```

---

## 3. Award-Specific Evidence Package Contract

**Request:** `GET /api/v1/osad/awards/50000001-0000-0000-0000-000000000001/students/std-uuid-1/evidence`

**Response (`200 OK`):**
```json
{
  "data": {
    "award_id": "50000001-0000-0000-0000-000000000001",
    "award_code": "NOTRE_DAME_AWARD",
    "student_id": "std-uuid-1",
    "student_name": "Juan Dela Cruz",
    "is_award_level_eligible": true,
    "has_relevant_verified_evidence": true,
    "relevant_verified_record_count": 5,
    "matched_criterion_count": 3,
    "criteria": [
      {
        "criterion_id": "50000002-0001-0000-0000-000000000002",
        "criterion_code": "CRIT_NDA_LEADERSHIP",
        "criterion_name": "Leadership and Involvement",
        "max_points": 20.0,
        "is_computable": true,
        "relevant_evidence_count": 2,
        "evidence": [
          {
            "record_id": "rec-uuid-1",
            "title": "SSG President",
            "category_code": "LEADERSHIP_POSITION",
            "subcategory_code": "SSG_UNIVERSITY_GOVERNMENT",
            "mapping_rule": "RULE_LEADERSHIP_INVOLVEMENT",
            "structured_metadata": {
              "leadership_level": "SSG",
              "role": "President"
            },
            "verification_status": "verified"
          }
        ]
      }
    ],
    "excluded_records": [],
    "mapping_summary": "Found 5 relevant verified records across 3 criteria."
  }
}
```

---

## 4. Machine-Readable Diagnostic Reason Codes

- `RECORD_NOT_VERIFIED`: Excluded non-verified status.
- `PORTFOLIO_CATEGORY_NOT_RELEVANT`: Category not part of award rubric.
- `PORTFOLIO_SUBCATEGORY_NOT_RELEVANT`: Subcategory mismatch.
- `REQUIRED_METADATA_MISSING`: Structured field missing.
- `DUPLICATE_EVIDENCE_SAME_SUBSECTION`: Deduplicated same activity within subsection.
- `JOURNALISM_NOT_PUBLISHED`: Excluded draft/unpublished journalism work.
- `SPORTS_NON_COMPETITION_RECORD`: Excluded clinic/training from competition evidence.
- `SOCIOCULTURAL_NON_COMPETITION_RECORD`: Excluded workshop from performance evidence.
