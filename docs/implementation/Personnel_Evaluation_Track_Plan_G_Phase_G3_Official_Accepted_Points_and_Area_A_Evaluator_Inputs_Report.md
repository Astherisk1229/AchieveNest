# Personnel Evaluation Track — Plan G — Phase G3
## Official Accepted-Point Entry, Non-Teaching Area A Rating Inputs & Scoring Completion — Formal Implementation Report

### Executive Summary

Phase G3 implements the official evaluator scoring-entry workflow, Non-Teaching Area A rating inputs, and scoring completion tracking for Plan G. Authorized Deans and HR evaluators can record accepted values on judgment-required criteria within canonical bounds, complete evaluator-only Non-Teaching Area A ratings without unsupported formulas, and trigger dynamic scoring recalculations and Plan F result determination (`Passed` or `Retained`). Deterministic scores remain protected from arbitrary manual tampering, and submitted candidate accomplishments remain strictly immutable.

---

### 1. Architecture & Services

Phase G3 delivers `PersonnelEvaluatorScoringService` (mirrored in PHP backend and JavaScript frontend):

- **Backend Service**: [`PersonnelEvaluatorScoringService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/PersonnelEvaluatorScoringService.php)
- **Frontend Service**: [`PersonnelEvaluatorScoringService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/PersonnelEvaluatorScoringService.js)
- **Authoritative Integration**: Directly invokes Plan F validators and calculation engines (`PersonnelEvaluationScoringEngine`, `PersonnelEvaluationResultService`).

---

### 2. Authorization & Scoping Enforcement

1. **Dean Intra-College Scoping**:
   - Deans can only enter scores for faculty within their assigned academic college. Cross-college score entries return `403 Forbidden`.
2. **HR Evaluator Scoping**:
   - HR evaluators score Non-Teaching Personnel, Deans, and VPs.
3. **Department Secretary Exclusion**:
   - Department Secretaries are completely barred from submitting official accepted points or Area A ratings.
4. **Anti-Self-Scoring**:
   - Candidates are strictly prohibited from evaluating or scoring their own submissions.
5. **State Guard**:
   - Scores cannot be submitted on draft, unsubmitted, or finalized evaluations.

---

### 3. Judgment Criteria Input & Validation

| Scale | Criterion | Maximum Allowed | Pending State | Scored State | Validation Rule |
|---|---|---|---|---|---|
| Administrators | B.3 Conduct of Research | 40.0 pts | `accepted_points = null` | `accepted_points >= 0 && <= 40` | Rejects > 40.0, negative |
| Administrators | B.6 Creative Work | 20.0 pts | `accepted_points = null` | `accepted_points >= 0 && <= 20` | Rejects > 20.0, negative |
| Non-Teaching | B.5 Recognition / Award | 30.0 pts | `accepted_points = null` | `accepted_points >= 0 && <= 30` | Rejects > 30.0, negative |

- **Semantic Null vs Explicit Zero**: `null` indicates an unresolved item that blocks scoring completion, whereas `0.0` is an explicitly recorded score that enables scoring completion.

---

### 4. Non-Teaching Area A Evaluator-Only Inputs

- **Components & Caps**:
  - Job Performance: max `50.0` points
  - Personal Attitudes and Qualities: max `10.0` points
  - Efficiency & Punctuality: max `30.0` points
  - Total Area A Cap: max `90.0` points
- **Governance**:
  - Area A is evaluator-only. Candidate accomplishment submissions are blocked.
  - Scale guard rejects submitting Area A ratings on Administrators scale evaluations.
  - No unsupported mathematical DS-to-points conversions are invented.

---

### 5. Deterministic Criteria Protection & Idempotency

- **Protection**: Evaluators cannot arbitrarily override deterministic Plan F calculations (e.g. degrees, training hours, service years).
- **Idempotency**: Repeated saves with identical accepted values produce stable totals without row duplication or point inflation.

---

### 6. Scoring Completion & Plan F Result Integration

- When unresolved judgment criteria exist or Non-Teaching Area A inputs are incomplete:
  - `scoring_complete = false`
  - `plan_f_result_status = 'pending'`
  - `plan_f_final_result = null`
- When all evaluator inputs are complete:
  - `scoring_complete = true`
  - `plan_f_result_status = 'result_ready'`
  - Plan F determines canonical result:
    - Administrators (Max 160, Passing 120): `>= 120` -> `Passed`, `< 120` -> `Retained`
    - Non-Teaching (Max 150, Passing 75): `>= 75` -> `Passed`, `< 75` -> `Retained`

---

### 7. Verification Results

- **Focused G3 Vitest Suite**:
  - `src/controllers/__tests__/PersonnelEvaluatorScoringG3.test.jsx`: **22/22 passed (100%)**
- **Plan G Combined Suite (G0–G3)**:
  - **4 test files / 66 tests passed (100%)**
- **Full Repository Regression Suite**:
  - **133 test files passed (100%)**
  - **1058 total tests passed (0 failures)**

---

### Final Phase Status

**PHASE G3 COMPLETE — OFFICIAL ACCEPTED-POINT ENTRY, NON-TEACHING AREA A EVALUATOR INPUTS & SCORING COMPLETION VERIFIED**
