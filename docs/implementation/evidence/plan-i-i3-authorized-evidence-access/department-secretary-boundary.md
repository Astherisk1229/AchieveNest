# Department Secretary Boundary

## 1. Role Limitation & Policy Rule
Under NDMU evaluation governance:
- **Department Secretary is not an evaluator**: The `department_secretary` role assists in administrative operations but does not possess evaluation authority or evaluator evidence preview privileges.
- Evaluator-level evidence preview requests by actors whose sole active role is `department_secretary` are strictly denied by default with `FORBIDDEN` (`evidence_access_forbidden`).

## 2. Test Verification
- Test 7.2: `denies Department Secretary role from evaluator evidence access` (PASSED).
