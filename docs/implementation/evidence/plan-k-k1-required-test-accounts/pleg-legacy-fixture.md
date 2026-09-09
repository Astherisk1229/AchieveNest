# Persona P-LEG — Legacy Migration Fixtures

### 1. P-LEG Supported Fixture (`K1-PLEG-SUPP-009`)
- **Legacy Group**: `non_teaching_personnel` (legacy 3rd group)
- **Official Placement Data**: Unit `unit-reg-001` (Registrar)
- **Expected Resolution**: Group -> `non_teaching_faculty`, Side -> `non_academic`.

### 2. P-LEG Ambiguous Fixture (`K1-PLEG-AMB-010`)
- **Legacy Group**: `non_teaching_personnel`
- **Official Placement Data**: None (unassigned college/unit)
- **Expected Resolution**: `UNRESOLVED` (No guessed mapping).
