# Workspace Access Verification

## Authorization Matrix Enforcement

The evaluator review workspace is protected by server-authoritative and client-side mirrored guard rules in `PersonnelEvaluatorWorkspaceService`.

### 1. Dean Intra-College Scoping
- **Rule**: Deans can only access evaluation workspaces for Personnel within their assigned academic college.
- **Verification**:
  - Dean assigned to `CEAC` accessing `CEAC` evaluation -> **GRANTED (200 OK)**
  - Dean assigned to `CEAC` accessing `CBA` evaluation -> **DENIED (403 Forbidden)**: `"Dean of college [CEAC] cannot access evaluations for college [CBA]"`

### 2. HR Oversight Scoping
- **Rule**: HR evaluators can only access evaluation records assigned to HR reviewer routing (`HR_REVIEWER_ONLY`).
- **Verification**:
  - HR Officer accessing Non-Teaching / Dean evaluation -> **GRANTED (200 OK)**
  - HR Officer accessing unassigned or non-HR routed evaluation without valid assignment -> **DENIED (403 Forbidden)**: `"HR role cannot access evaluation not routed to HR"`

### 3. Department Secretary Prohibition
- **Rule**: Department Secretaries have portfolio monitoring permissions but zero evaluator/workspace authority.
- **Verification**:
  - Secretary attempting to load evaluator workspace -> **DENIED (403 Forbidden)**: `"Department Secretary role does not possess evaluator authority"`

### 4. Status Check
- **Rule**: Direct URL navigation to evaluations not in active evaluation status (`in_evaluation`, `awaiting_review`, `under_evaluation`) is rejected.
- **Verification**: Attempting to load draft evaluation -> **DENIED (400 Bad Request)**: `"Evaluation [eval_draft] is in status [draft] and is not open for evaluator review"`
