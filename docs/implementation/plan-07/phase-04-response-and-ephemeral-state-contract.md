# AchieveNest Plan 07 — Phase 4 Evidence
# Response & Ephemeral State Contract

---

## 1. Response Allowlist Schema

```typescript
type ProvisionedCredential = {
  profileId: string;
  ownerType: 'student' | 'personnel';
  fullName: string;
  institutionalId: string;
  institutionalEmail: string;
  temporaryPassword: string;
  accountLifecycleStatus: 'pending_first_login';
  mustChangePassword: true;
  requiredNextAction: 'change_password';
};
```

---

## 2. Field Allowlisting & Normalization Rules

| Ingested API Field | Normalized Field | Validation Constraint | Dropped / Redacted |
| :--- | :--- | :--- | :---: |
| `id` / `profile_id` | `profileId` | Non-empty scalar | Stored as string |
| `account_type` | `ownerType` | Strictly `'student'` or `'personnel'` | Other values rejected |
| `full_name` | `fullName` | Non-empty string | Rendered escaped |
| `institutional_id` | `institutionalId` | Non-empty string | Rendered escaped |
| `institutional_email` | `institutionalEmail` | Ends with `@ndmu.edu.ph` | Required login identifier |
| `temporary_password` | `temporaryPassword` | Non-empty 16-char string | Held only in component memory |
| `account_lifecycle_status` | `accountLifecycleStatus` | Strictly `'pending_first_login'` | Other values rejected |
| `must_change_password` | `mustChangePassword` | Strictly boolean `true` | Other values rejected |
| `required_next_action` | `requiredNextAction` | Strictly `'change_password'` | Other values rejected |
| `password_hash` | N/A | Excluded from returned object | **DROPPED** |
| `auth_token` / `jwt` | N/A | Excluded from returned object | **DROPPED** |
| Program/College IDs | N/A | Excluded from clipboard copy string | **EXCLUDED** |

---

## 3. Ephemeral State Destruction Lifecycle

1. **Modal Open**: Credential stored in `useProvisioningCredential` state ref.
2. **Copy Action**: Text built dynamically via `buildCredentialCopyText()`.
3. **Dismissal Trigger**: Done / Escape triggers `clearAndClose()`.
4. **State Destruction**: `setCredential(null)` synchronously clears state.
5. **List Refresh**: Authoritative list query executes after credential destruction.
6. **Component Unmount**: Hook cleanup replaces ref and state with `null`.
