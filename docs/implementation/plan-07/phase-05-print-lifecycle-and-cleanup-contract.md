# AchieveNest Plan 07 — Phase 5 Evidence
# Print Lifecycle & Cleanup Contract

---

## 1. Print State Machine

```text
[Idle]
  │ (User clicks "Print Credential Slip")
  ▼
[Preparing]
  │ (Mounts CredentialSlipPrintView, generates timestamp)
  ▼
[Dialog Opening]
  │ (Invokes window.print())
  ▼
[Dialog Closed / afterprint]
  │ (Unmounts print DOM, restores focus to Print Again)
  ▼
[Idle / Same-Session Retry]
```

---

## 2. Ephemeral Print Teardown Guarantees

1. **Before Action**: Print DOM is completely unmounted (`isPrintPrepared = false`).
2. **On Click**: DOM commits subtree in requestAnimationFrame / timeout, then triggers browser print preview.
3. **On Return / Dismiss**: `afterprint` event listener or defensive timeout unmounts `#credential-slip-print-root` from React DOM.
4. **On Modal Done**: Parent modal destroys `credential` object (`setCredential(null)`), permanently preventing further printing.
