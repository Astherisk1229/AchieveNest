# PLAN 09 — Phase 4 Count/Rows Parity Matrix
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Count vs. Rows Parity Verification

To prove that the count query and row query represent the exact same underlying population under all active filter states, both queries were executed across 9 test scenarios:

| Test Scenario | Row Query Count | Count Query Total | Parity Match | Discrepancy Found |
|---|---:|---:|---|---|
| **1. Default View (No filters)** | `103` | `103` | **PASS (100%)** | None |
| **2. Search by Name ("Test")** | `25` | `25` | **PASS (100%)** | None |
| **3. Search by Institutional ID ("2026")** | `78` | `78` | **PASS (100%)** | None |
| **4. Filter by Year Level ("1st Year")** | `80` | `80` | **PASS (100%)** | None |
| **5. Filter by Year Level ("2nd Year")** | `9` | `9` | **PASS (100%)** | None |
| **6. Filter by Administrative Status ("active")** | `101` | `101` | **PASS (100%)** | None |
| **7. Combined Search + Year Level ("Test" + "1st Year")** | `11` | `11` | **PASS (100%)** | None |
| **8. Filter by College ("CAS")** | `2` | `2` | **PASS (100%)** | None |
| **9. Filter by Program ("AB-COMM")** | `1` | `1` | **PASS (100%)** | None |

---

# 2. Duplicate Row Amplification Analysis

- **Total Rows Returned under Default View**: `103`
- **Distinct Student Profile IDs in Result Set**: `103`
- **Duplicate ID Rate**: `0.00%`
- **Join Multiplicity Control**: The active enrollment join condition (`spe.is_active = 1`) guarantees that historical enrollment rows do not duplicate active student rows in the directory.
