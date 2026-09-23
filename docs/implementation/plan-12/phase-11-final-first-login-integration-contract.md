# PLAN 12 — Final First-Login Integration Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. First-Login Integration Architecture

1. **Integration Flow**:
   - Initial Login -> Forced Password Change Gate (`must_change_password = true`) -> Successful Password Update -> Account Activation -> Normal Student Session -> Single Route Transition to `/student/account` -> Profile Query resolves canonical data.
2. **Session Ownership Enforcement**:
   - The landing profile relies exclusively on the bearer session identity. No client student ID parameters are accepted or required.
3. **Missing Link Defense**:
   - Activated accounts with missing program/college linkages receive non-blaming support guidance without exposing technical stack traces.
