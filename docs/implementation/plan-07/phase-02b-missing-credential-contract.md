# AchieveNest Plan 07 — Phase 2B Evidence
# Missing-Credential & Credential Integrity Contract

---

## 1. Domain Resolution Mapping

| Canonical Credential Input | Administrative Status | Explicit Integrity Signal | Derived Lifecycle (`account_lifecycle_status`) | Credential Integrity Status (`credential_integrity_status`) | Must Change Password (`must_change_password`) | Can Authenticate | Can Access Protected Portal | Required Next Action (`required_next_action`) |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `1` / `true` | `active` | `valid` | `pending_first_login` | `valid` | `true` | `true` | `false` | `change_password` |
| `0` / `false` | `active` | `valid` | `active` | `valid` | `false` | `true` | `true` | `none` |
| `null` (missing row) | Any | `missing` | `unknown` | `missing` | `null` | `false` | `false` | `contact_administrator` |
| Invalid / Unsupported | Any | `invalid` | `unknown` | `invalid` | `null` | `false` | `false` | `contact_administrator` |
| Duplicate Rows | Any | `duplicate` | `unknown` | `duplicate` | `null` | `false` | `false` | `contact_administrator` |
| `1` / `0` | `suspended` | `valid` | `suspended` | `valid` | `bool` | `false` | `false` | `contact_administrator` |
| `1` / `0` | `archived` | `valid` | `archived` | `valid` | `bool` | `false` | `false` | `contact_administrator` |
| `1` / `0` | `disabled` | `valid` | `disabled` | `valid` | `bool` | `false` | `false` | `contact_administrator` |

---

## 2. API Serialization & UI State Mapping

- **Missing Credential Profile**: Visible in administrative listings with:
  - `account_lifecycle_status: "unknown"`
  - `credential_integrity_status: "missing"`
  - `must_change_password: null`
  - `required_next_action: "contact_administrator"`
- **Security Rule**: No automatic credential row creation occurs on GET/list requests.
