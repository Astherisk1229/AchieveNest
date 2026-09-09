# Evaluation Summary Department Projection Audit — Plan D2 Phase D2-0

### Current Projection Mechanism in `PersonnelEvaluationPrintService.js`
- **Line 208 Implementation**:
  ```javascript
  department: String(evaluationRecord.department_name || evaluationRecord.department || 'Department')
  ```
- **Defect**:
  - For Academic Faculty, `evaluationRecord` often has `college_name` populated, but `department_name` and `department` are null, leading to fallback string `"Department"` or empty output.
  - For Non-Academic Personnel, `evaluationRecord.administrative_unit_name` is ignored if `department_name` is absent.

### Authoritative Target Projection Matrix for Plan D2

| Personnel Group | Organizational Side | Stored Institutional Relation | Current Summary Department Source | Required D2 Future Projection | Identified Gap |
|---|---|---|---|---|---|
| **Faculty** | **Academic** | `college_id` -> `colleges.college_name` | `department_name \|\| department \|\| 'Department'` | **College Name** (`colleges.college_name`) | Print service misses `college_name` mapping |
| **Non-Teaching Faculty** | **Academic** | `college_id` -> `colleges.college_name` | `department_name \|\| department \|\| 'Department'` | **College Name** (`colleges.college_name`) | Print service misses `college_name` mapping |
| **Non-Teaching Faculty** | **Non-Academic** | `administrative_unit_id` -> `administrative_units.unit_name` | `department_name \|\| department \|\| 'Department'` | **Department / Office Name** (`administrative_units.unit_name`) | Print service misses `administrative_unit_name` mapping |
