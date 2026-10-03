# AchieveNest Plan 07 — Phase 5 Evidence
# Print Content & Layout Contract

---

## 1. Printable Slip Fields & Schema

| Slip Section | Field Content | Source | Privacy & Security Constraint |
| :--- | :--- | :--- | :--- |
| **Institutional Header** | Notre Dame of Marbel University / AchieveNest | Static branding | Institutional authority |
| **Document Title** | Confidential Account Credential Slip | Static header | High-contrast black badge |
| **Account Owner** | `fullName` | `credential.fullName` | Escaped plain text |
| **Account Type** | Student / Personnel | `credential.ownerType` | Normalized label |
| **Institutional ID** | Student ID / Personnel ID | `credential.institutionalId` | Monospace bold |
| **Account Status** | Pending First Login | `credential.accountLifecycleStatus` | First login notice |
| **Sign-In Identifier** | Institutional Email | `credential.institutionalEmail` | Must end in `@ndmu.edu.ph` |
| **Temporary Password** | 16-character secure passkey | `credential.temporaryPassword` | Exact monospace, unmasked |
| **First Login Guidance** | 4-step first login sequence | Static instructions | Directs to password change |
| **Confidentiality Notice** | Security & handoff warning | Static notice | Forbids sharing/photographing |
| **Lost Slip Guidance** | Reset requirement notice | Static policy | Directs to authorized reset |
| **Printed Timestamp** | `Printed on: {timestamp}` | Local print preparation | Client runtime timestamp |

---

## 2. Forbidden Print Content

- Home addresses, phone numbers, sex, birth dates.
- Internal database UUIDs / auto-increment IDs.
- Password hashes or authentication JWTs.
- Other user accounts or administrative lists.
- Browser URLs / route parameters.
