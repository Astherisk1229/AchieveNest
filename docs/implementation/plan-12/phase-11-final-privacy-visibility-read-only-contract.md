# PLAN 12 — Final Privacy, Visibility & Read-Only Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Privacy Boundaries & Read-Only Invariants

1. **Zero Prohibited Data Exposure**:
   - `Password hashes, temporary passwords, reset tokens, security secrets`: **0**.
   - `Personal phone numbers, home addresses, birth details`: **0**.
   - `Internal HR performance ratings / dossier`: **0**.
   - `Internal database guards and audit payloads`: **0**.
2. **Read-Only Institutional Governance**:
   - Students cannot self-edit institutional placements, year levels, colleges, or advisor assignments.
   - `Student institutional relationship edit controls`: **0**.
   - `Disabled institutional edit icons`: **0**.
3. **Public Portfolio Separation**:
   - Private institutional data is completely partitioned from public portfolio endpoints and query caches (`Public/private leakage = 0`).
