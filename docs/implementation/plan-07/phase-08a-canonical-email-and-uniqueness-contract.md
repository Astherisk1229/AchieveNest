# AchieveNest Plan 07 — Phase 8A Email Contract
# Canonical Institutional Email & Uniqueness Contract

---

## 1. Canonical Email Normalization Specification

All email processing throughout AchieveNest uses `ValidationHelper::canonicalizeNdmuEmail($rawEmail)`:

1. **Type & Character Sanitation**: Rejects non-string inputs, null bytes, CR/LF, invisible Unicode characters, and bidirectional format overrides.
2. **Whitespace Trimming**: Trims ordinary surrounding whitespace. Rejects any internal spaces.
3. **Case Normalization**: Converts all characters to standard ASCII lowercase.
4. **Exact Domain Requirement**: Parses address into local part and domain. Requires exact domain equality with `ndmu.edu.ph` (rejecting subdomains like `user@ndmu.edu.ph.evil.com` or typos like `user@evilndmu.edu.ph`).
5. **Length Bounds**: Enforces maximum length of 191 characters without silent truncation.

---

## 2. Global Uniqueness Scope

- Because `institutional_email` serves as the global sign-in username for all user personas (Students, Faculty, Staff, Deans, OSAD Admins, HR Admins), uniqueness is enforced globally in the `profiles` table across all account types.
- Uniqueness is rechecked inside the provisioning database transaction under table/row locking.
