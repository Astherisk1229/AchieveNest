# Reviewer Authorization & Scoping Tests

## Authoritative Role Scoping

The evaluator scoring entry service strictly verifies reviewer authority and academic scope before permitting official accepted points or Area A rating inputs:

### Verification Results:
1. **Dean Intra-College Scoping**:
   - CEAC Dean scoring CEAC evaluation -> **AUTHORIZED (200 OK)**
   - CBA Dean attempting to score CEAC evaluation -> **DENIED (403 Forbidden)**: `"Access Denied (403): Dean of college [CBA] cannot access evaluations for college [CEAC] (Cross-college access prohibited)."`
2. **HR Reviewer Scoping**:
   - HR Evaluator scoring Non-Teaching evaluation -> **AUTHORIZED (200 OK)**
   - Unassigned / Non-HR actor attempting HR scoring -> **DENIED (403 Forbidden)**
3. **Department Secretary Exclusion**:
   - Department Secretary attempting to submit scores -> **DENIED (403 Forbidden)**: `"Access Denied (403): Department Secretary role does not possess evaluator authority."`
4. **Evaluation Status Guard**:
   - Attempting to submit scores on a draft evaluation -> **DENIED (400 Bad Request)**: `"Evaluation [eval_adm_001] is in status [draft] and is not open for evaluator scoring."`
