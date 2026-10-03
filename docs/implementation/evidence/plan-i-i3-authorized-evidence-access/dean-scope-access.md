# College Dean Scope-Aware Evidence Access

## 1. Dean Review Scope Enforcement
In accordance with Plan G reviewer governance:
1. **Academic College Matching**: A College Dean can only preview or download evidence attached to evaluations within their assigned academic college (`assigned_college_id === evaluator_college_id`).
2. **Cross-College Denial**: Accessing evidence of candidates from other colleges returns HTTP 403 `cross_college_access_denied`.
3. **Route Isolation**: College Deans cannot access evidence linked to evaluations routed exclusively to the HR Office (e.g. Non-Teaching track). Attempted access yields `review_assignment_missing`.
4. **Unassigned Deans**: Deans without an active college assignment are denied evaluator access.

## 2. Test Verification
- Test 2.1: `allows assigned College Dean to preview submitted evidence within college scope` (PASSED)
- Test 2.2: `allows assigned College Dean to download submitted evidence within college scope` (PASSED)
- Test 2.3: `denies cross-college Dean from accessing evidence of another college` (PASSED)
- Test 2.4: `denies College Dean from accessing HR-routed evaluation evidence` (PASSED)
- Test 2.5: `denies unassigned Dean or non-reviewer role without valid assignment` (PASSED)
