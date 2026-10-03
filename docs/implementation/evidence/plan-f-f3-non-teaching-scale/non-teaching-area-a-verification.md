# Non-Teaching Scale — Area A Verification (`AREA_A_PERFORMANCE_PERSONAL_INDICATORS`)

## Area Overview
- **Area Code**: `AREA_A_PERFORMANCE_PERSONAL_INDICATORS`
- **Area Label**: `Area A: Performance and Personal Indicators`
- **Area Total**: `90.0 points`
- **Entry Policy**: `read_only_evaluation_area` (`is_personnel_entry_allowed = false`)

---

## Official Evaluator Rating Indicators
Area A is completed exclusively by official institutional evaluators and supervisors. Personnel submission is disallowed.

| Indicator Code | Indicator Name | Weight | Percentage | Evaluation Mechanism |
|---|---|---|---|---|
| `A.1` | Job Performance | 50.0 pts | 0.50 (50%) | `EVALUATOR_OFFICIAL_RATING` |
| `A.2` | Personal Attitudes and Qualities | 10.0 pts | 0.10 (10%) | `EVALUATOR_OFFICIAL_RATING` |
| `A.3` | Efficiency | 30.0 pts | 0.30 (30%) | `EVALUATOR_OFFICIAL_RATING` |
| **Total** | | **90.0 pts** | **1.00 (100%)** | |

---

## Personnel UI & Security Verification
- **DOM Rendering**: Area A is displayed with a neutral `Evaluator Indicator Area` / `Read-Only` badge.
- **Controls Hidden**: The `+ Add Accomplishment to Area A` button, evidence uploaders, edit controls, and deletion buttons are completely omitted.
- **Backend Guard**: Any API mutation (`POST`, `PUT`, `DELETE`) targeting Area A is rejected with status `409` / `422` with message `"Portfolio Area [A: Performance and Personal Indicators] is an evaluation-only section and does not permit personnel accomplishment mutations."`.
