# AchieveNest Plan 07 — Phase 7 Contract
# Recovery Delivery & Slip Contract

---

## 1. Reset Credential Modal Presentation

When an administrator executes a password reset, the UI presents `OneTimeCredentialModal.jsx` with the following adjustments:
- **Title**: `Temporary Password Reset Successfully`
- **Status Badge**: `Password Change Required`
- **Security Notice**: States explicitly that the user's prior password has been permanently invalidated and that the new temporary password must be changed immediately upon sign-in.

---

## 2. Reset Credential Slip Printing

The printable credential slip rendered by `CredentialSlipPrintView.jsx` in reset mode includes:
- **Header Badge**: `Temporary Reset Credential Slip`
- **Credential Label**: `One-Time Temporary Reset Password:`
- **Instructions**: Tailored instructions noting that previous credentials no longer function and prompting the user to complete password replacement immediately upon sign-in.
- **Post-Print Destruction**: Plaintext credential is never stored in persistent browser storage or application state after modal dismissal.
