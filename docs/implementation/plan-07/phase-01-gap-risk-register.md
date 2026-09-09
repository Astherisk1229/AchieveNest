# AchieveNest Plan 07 — Phase 1 Evidence
# Gap and Risk Register

---

## 1. Prioritized Gap & Risk Register

| Gap ID | Description & Evidence | Affected Flow | Severity | Likelihood | Owning Phase | Blocking? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-07-001** | **Missing Credential Delivery UI**: Backend returns `temporary_password` in 201 response, but frontend `AddStudentAccountModal.jsx` and `OnboardPersonnelModal.jsx` merely close and show a toast. The administrator cannot view/copy the credentials or generate a print slip. | Student & Personnel Provisioning | **HIGH** | High | **Phase 4 & 5** (One-Time Credential Modal & Print Slip) | **NO** (Audit passes; feature gap) |
| **GAP-07-002** | **No Forced First-Login Navigation Trap**: Backend returns `must_change_password: true`, but frontend Router / `AuthContext` does not intercept route navigation to enforce `ChangePasswordPage.jsx` before allowing access to user dashboards. | First Login & Authentication | **HIGH** | High | **Phase 6** (First-Login Enforcement) | **NO** (Audit passes; feature gap) |
| **GAP-07-003** | **Immediate Active Status Lifecycle**: Newly provisioned accounts immediately start in `status: 'active'` rather than a distinguished `pending_first_login` or `unactivated` state. | Account Lifecycle | **HIGH** | High | **Phase 2** (Data Model & Transaction Contract) | **NO** (Audit passes; feature gap) |
| **GAP-07-004** | **Login Identifier Constraint**: Login currently rejects non-email identifiers (e.g. Student ID number) with HTTP 422. If institutional policy permits login by Student ID, an identifier resolution layer is required. | Authentication Gateway | **MEDIUM** | Medium | **Phase 3** (Credential Delivery & Identifier Contract) | **NO** (Audit passes; feature gap) |
| **GAP-07-005** | **Automated PHPUnit Test Mismatches**: 5 legacy PHPUnit tests in `tests/Feature/PasswordResetRequestTest.php` and `tests/Feature/Phase8*` failed due to signature changes or Postgres driver assumptions in the test suite. | Automated Testing | **MEDIUM** | Medium | **Phase 9** (Regression & Security Testing) | **NO** (Audit passes) |

---

## 2. Phase Ownership Summary

- **Plan 07 Phase 2**: Resolves **GAP-07-003** (Lifecycle states and transactional schema).
- **Plan 07 Phase 3**: Resolves **GAP-07-004** (Secure credential generation and identifier resolution).
- **Plan 07 Phase 4**: Resolves **GAP-07-001** (One-time credential modal and copy-to-clipboard).
- **Plan 07 Phase 5**: Resolves **GAP-07-001** (Print credential slip component).
- **Plan 07 Phase 6**: Resolves **GAP-07-002** (First-login forced password change routing).
- **Plan 07 Phase 9**: Resolves **GAP-07-005** (Comprehensive regression test alignment).
