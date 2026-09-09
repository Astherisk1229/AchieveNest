# AchieveNest Plan 07 — Phase 3 Evidence
# Temporary Credential Policy Specification

---

## 1. Character Groups & Exclusions

| Group | Allowed Characters | Count | Excluded Characters | Reason for Exclusion |
| :--- | :--- | :---: | :--- | :--- |
| **Uppercase** | `ABCDEFGHJKLMNPQRSTUVWXYZ` | 24 | `I`, `O` | Visual ambiguity with `1` and `0` on printed slips. |
| **Lowercase** | `abcdefghijkmnopqrstuvwxyz` | 25 | `l` | Visual ambiguity with `1` and `I`. |
| **Digits** | `23456789` | 8 | `0`, `1` | Visual ambiguity with `O`, `I`, `l`. |
| **Specials** | `!@#$%*?-_` | 9 | `\`, `'`, `"`, `` ` ``, `<`, `>`, space, tab | Shell/JSON/HTML escaping issues. |

---

## 2. Policy Alignment Matrix

| Rule | Authoritative Validator | Phase 3 Temporary Generator | Compliant? |
| :--- | :--- | :--- | :---: |
| **Min Length** | $\ge 8$ chars | 16 chars | **PASS** |
| **Uppercase** | At least 1 `[A-Z]` | Guaranteed $\ge 1$ `[A-Z]` | **PASS** |
| **Lowercase** | At least 1 `[a-z]` | Guaranteed $\ge 1$ `[a-z]` | **PASS** |
| **Digit** | At least 1 `[0-9]` | Guaranteed $\ge 1$ `[0-9]` | **PASS** |
| **Special** | At least 1 `[^A-Za-z0-9]` | Guaranteed $\ge 1$ `[!@#$%*?-_]` | **PASS** |
| **Institutional Prefix** | Prohibited in random credential | None (zero prefix) | **PASS** |
| **ASCII Printable** | Strictly printable ASCII | $100\%$ printable ASCII | **PASS** |
