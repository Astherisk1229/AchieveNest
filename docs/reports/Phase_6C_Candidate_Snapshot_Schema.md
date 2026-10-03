# Phase 6C — Candidate Snapshot Schema
## Immutable Snapshot Structure, Evaluation Summary Payload, and Record-Level Capture

**Domain:** Candidate Snapshot Architecture  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:55:00 UTC+08:00  

---

## 1. Candidate Snapshot Schema (`award_student_evaluation_summaries`)

```sql
CREATE TABLE IF NOT EXISTS award_student_evaluation_summaries (
    id CHAR(36) NOT NULL PRIMARY KEY,
    evaluation_id CHAR(36) NOT NULL UNIQUE,
    student_profile_id CHAR(36) NOT NULL,
    award_definition_id CHAR(36) NOT NULL,
    cycle_id CHAR(36) NOT NULL,
    scoring_model_version_id CHAR(36) NULL,
    summary_payload JSON NOT NULL,
    raw_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_computable_score DECIMAL(10,2) NOT NULL DEFAULT 70.00,
    potential_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    candidate_threshold_percent DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    qualifies_portfolio_based TINYINT(1) NOT NULL DEFAULT 0,
    candidate_pathway VARCHAR(50) NOT NULL DEFAULT 'automatic_portfolio',
    deliberation_status VARCHAR(50) NOT NULL DEFAULT 'NOT_REVIEWED',
    generated_by CHAR(36) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);
```

---

## 2. Immutable `summary_payload` JSON Structure

```json
{
  "snapshot_id": "snap_001_uuid",
  "snapshot_version": 1,
  "award_cycle": {
    "cycle_id": "cycle_2026_uuid",
    "cycle_name": "AY 2026-2027 Campus Journalism Award",
    "academic_year": "AY 2026-2027",
    "evidence_cutoff_at": "2027-03-01T23:59:59Z"
  },
  "student": {
    "student_id": "std_001_uuid",
    "student_name": "Maria Santos",
    "institutional_id": "STU-2024-001",
    "program_name": "BS Information Technology"
  },
  "scores": {
    "publication_score": 54.00,
    "publication_max": 60.00,
    "leadership_score": 8.00,
    "leadership_max": 10.00,
    "raw_score": 62.00,
    "raw_max": 70.00,
    "potential_score": 88.57,
    "threshold_raw": 56.00,
    "threshold_percent": 80.00,
    "result": "POTENTIAL_CANDIDATE"
  },
  "sections": [
    {
      "criterion_code": "CRIT_JOURN_PUB",
      "label": "Verified Publication Evidence",
      "score": 54.00,
      "max_score": 60.00,
      "components": [ ... ]
    }
  ],
  "deliberation": {
    "status": "NOT_REVIEWED",
    "notes": []
  }
}
```
