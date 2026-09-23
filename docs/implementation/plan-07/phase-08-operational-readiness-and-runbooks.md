# AchieveNest Plan 07 — Phase 8 Operational Readiness
# Operational Runbooks & Administrator Procedures

---

## 1. Runbook 1: Initial Provisioning & Physical Handoff

1. **Verify Identity**: Check institutional government ID / student enrollment card before account creation.
2. **Execute Provisioning**: OSAD creates Student; HR creates Personnel.
3. **Display / Print**: Use `Print Slip` or `Copy Passkey`. Collect physical paper slip from printer immediately.
4. **Handoff & Instruction**: Hand slip to verified account owner. Advise them to sign in using their institutional email and change their password on first login.
5. **Dismissal**: Close modal to permanently purge plaintext from memory.

---

## 2. Runbook 2: Lost Initial Slip or Forgotten Password

1. **Intake**: Requester submits online recovery form or visits office in person.
2. **Identity Verification**: Administrator inspects physical ID.
3. **Execute Reset**: Open student/personnel account in directory or review queue. Check "I have confirmed the identity of the account owner" and execute reset.
4. **Issue New Passkey**: Hand new temporary passkey or print slip to user.
5. **Advise Password Change**: Explain that previous password is dead and they must create a new password immediately.

---

## 3. Runbook 3: Compromised / Disclosed Credential

1. **Immediate Revocation**: Administrator immediately triggers `Reset Account Access` for the affected account.
2. **Session Termination**: All active sessions for the account are terminated instantly.
3. **Re-issue**: Issue new temporary credential to verified owner.

---

## 4. Runbook 4: Backup & Disaster Recovery

- **Daily Backup**: Dump `achievenest_local` using standard `mysqldump` utilities.
- **Restore Rehearsal**: Verified clean restore to test database with 0 schema drift and intact `local_auth_credentials` table.
