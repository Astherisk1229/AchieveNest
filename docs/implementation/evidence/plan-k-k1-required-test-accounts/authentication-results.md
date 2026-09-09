# Synthetic Authentication Precheck Results

| Persona | ID | Auth Result | Token Status | Role Claims Verified |
|---|---|---|---|---|
| P1 | `K1-P1-FAC-001` | **PASS** | Synthetic JWT Generated | `['personnel']` |
| P2 | `K1-P2-PT-002` | **PASS** | Synthetic JWT Generated | `['personnel']` |
| P3 | `K1-P3-NTFA-003` | **PASS** | Synthetic JWT Generated | `['personnel']` |
| P4 | `K1-P4-NTFNA-004` | **PASS** | Synthetic JWT Generated | `['personnel']` |
| P5 | `K1-P5-DEAN-005` | **PASS** | Synthetic JWT Generated | `['personnel', 'dean']` |
| P6 | `K1-P6-HR-006` | **PASS** | Synthetic JWT Generated | `['hr_admin', 'hr_staff']` |
| P7 | `K1-P7-VP-007` | **PASS** | Synthetic JWT Generated | `['personnel', 'vice_president']` |
| P-SEC | `K1-PSEC-008` | **PASS** | Synthetic JWT Generated | `['personnel', 'department_secretary']` |
