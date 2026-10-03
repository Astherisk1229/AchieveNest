# Personnel Evaluation Track — Plan F — Phase F5: Result Threshold Verification

## Authoritative Scale Thresholds & Boundaries

### 1. Administrators Ranking Scale (`ADMINISTRATORS_RANKING_SCALE`)
- **Maximum Scale Ceiling**: 160.00 pts
- **Passing Threshold**: 120.00 pts
- **Area Caps**: Area A (70.0), Area B (50.0), Area C (40.0)

| Input Total | Calculated Accepted Total | Final Result | Outcome Category | Validation Result |
| :--- | :--- | :--- | :--- | :--- |
| `0.00` | `0.00` | `Retained` | Zero points | **VERIFIED** |
| `119.99` | `119.99` | `Retained` | Just below passing score | **VERIFIED** |
| `120.00` | `120.00` | `Passed` | Exact passing threshold | **VERIFIED** |
| `120.01` | `120.01` | `Passed` | Just above passing threshold | **VERIFIED** |
| `160.00` | `160.00` | `Passed` | Exact maximum ceiling | **VERIFIED** |
| `230.00` (Raw) | `160.00` | `Passed` | Over-ceiling capped to 160.00 | **VERIFIED** |

---

### 2. Non-Teaching Personnel Ranking Scale (`NON_TEACHING_PERSONNEL_RANKING_SCALE`)
- **Maximum Scale Ceiling**: 150.00 pts
- **Passing Threshold**: 75.00 pts
- **Area Caps**: Area A (90.0 evaluation weight), Area B (60.0 category allocation)

| Input Total | Calculated Accepted Total | Final Result | Outcome Category | Validation Result |
| :--- | :--- | :--- | :--- | :--- |
| `0.00` | `0.00` | `Retained` | Zero points (Area A completed) | **VERIFIED** |
| `74.99` | `74.99` | `Retained` | Just below passing score | **VERIFIED** |
| `75.00` | `75.00` | `Passed` | Exact passing threshold | **VERIFIED** |
| `75.01` | `75.01` | `Passed` | Just above passing threshold | **VERIFIED** |
| `150.00` | `150.00` | `Passed` | Exact maximum ceiling | **VERIFIED** |
| `180.00` (Raw) | `150.00` | `Passed` | Over-ceiling capped to 150.00 | **VERIFIED** |
