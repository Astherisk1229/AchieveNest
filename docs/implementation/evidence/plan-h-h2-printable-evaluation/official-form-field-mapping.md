# Plan H Phase H2 — Official Form Field Mapping

### 1. Header & Personnel Identity Section
- `full_name`: Candidate's official name
- `employee_id`: Institutional ID
- `department`: Department name
- `college_or_unit`: College or unit name
- `designation`: Current job title/designation
- `evaluated_current_rank`: Evaluated current rank (display-only, immutable)
- `evaluation_cycle`: Academic cycle (e.g. `2025-2026`)

### 2. Evaluation Context Section
- `scale_code`: `ADMINISTRATORS_RANKING_SCALE` or `NON_TEACHING_PERSONNEL_RANKING_SCALE`
- `scale_title`: Official title of the instrument
- `rule_version`: `NDMU-PERSONNEL-RATING-V2`
- `reviewer_role`: Evaluator role (Dean or HR)
- `reviewer_id`: Reviewer profile ID
- `review_completed_at`: Timestamp of review completion

### 3. Blank Approval Section
- `recommended_for_approval`: Blank (Name: `null`, Signature: `null`, Date: `null`, Remarks: `null`)
- `approved`: Blank (Name: `null`, Signature: `null`, Date: `null`, Remarks: `null`)
- `president`: Blank (Name: `null`, Signature: `null`, Date: `null`)
