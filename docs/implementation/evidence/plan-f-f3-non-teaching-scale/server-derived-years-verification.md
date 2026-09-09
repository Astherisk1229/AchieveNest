# Server-Derived Service Years Verification — Non-Teaching Scale

## Criterion B.3: Number of Years at NDMU (`B3_YEARS_AT_NDMU`)

### Formula & Constraints
- **Mathematical Formula**: `1 point per 2 completed years of service` -> `Math.floor(years / 2) * 1.0`
- **Sub-Ceiling**: `10.0 points`
- **Flag**: `server_derived: true`
- **Personnel Mutation**: Strictly prohibited. Personnel cannot enter, edit, or override claimed points.

### Boundary Threshold Matrix
| Completed Years of Service | Raw Calculated Points | Capped Points (Max 10) | State |
|---|---|---|---|
| **0 years** | 0.0 pts | 0.0 pts | Baseline |
| **1 year** | 0.0 pts | 0.0 pts | Incomplete 2-year group |
| **2 years** | 1.0 pt | 1.0 pt | Exactly 1 increment |
| **3 years** | 1.0 pt | 1.0 pt | 1 increment + 1 remainder |
| **4 years** | 2.0 pts | 2.0 pts | 2 increments |
| **10 years** | 5.0 pts | 5.0 pts | 5 increments |
| **19 years** | 9.0 pts | 9.0 pts | 9 increments |
| **20 years** | 10.0 pts | 10.0 pts | Max ceiling reached |
| **25 years** | 12.0 pts | 10.0 pts | Capped at 10.0 pts |
| **50 years** | 25.0 pts | 10.0 pts | Capped at 10.0 pts |
