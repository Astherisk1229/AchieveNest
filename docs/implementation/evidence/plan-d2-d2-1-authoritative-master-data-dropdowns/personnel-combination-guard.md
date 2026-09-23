# Personnel Group & Organizational Side Combination Guard — Plan D2 Phase D2-1

## 3-Way Valid Combinations
1. `faculty` + `academic`: **VALID**
2. `non_teaching_faculty` + `academic`: **VALID**
3. `non_teaching_faculty` + `non_academic`: **VALID**

## Disallowed Combinations
- `faculty` + `non_academic`: **REJECTED** (Enforced on frontend in `validatePersonnelPlacement` and backend in `PersonnelClassificationService::validatePair`).
