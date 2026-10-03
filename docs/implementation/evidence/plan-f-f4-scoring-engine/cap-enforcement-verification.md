# Cap Enforcement Hierarchy & Verification

## 4-Tier Cap Enforcement Hierarchy

The scoring engine enforces caps strictly in the following sequential order:

```
[1. Per-Entry Deterministic Rule Calculation]
                     ↓
[2. Criterion / Subcategory Ceiling Cap]
                     ↓
[3. Area Maximum Ceiling Cap]
                     ↓
[4. Overall Evaluation Scale Maximum Cap]
```

---

## 1. Dual Point Tracking (Raw vs Capped)
The engine preserves both:
- `raw_points`: Uncapped mathematical sum of verified factors / unit increments.
- `criterion_capped_points`: Score after applying criterion sub-ceilings (e.g. 18 units Ph.D. -> raw 12 -> capped 10).
- `area_contribution`: Contribution to Area total after applying Area Cap (e.g. Area A sum of 80 -> capped at 70).
- `capped_total_points`: Final grand total after applying overall scale cap (160 for Administrators, 150 for Non-Teaching).

---

## 2. Area Cap Verification Examples

### Administrators Scale:
- Area A: Ph.D. (40) + Ph.D. Units (10) + Officer (10) + Seminars (20) = `80.0 pts raw` -> **`70.0 pts capped`** (Overflow: 10.0 pts).
- Area B: B.1 (16) + B.2 (16) + B.4 (40) = `72.0 pts raw` -> **`50.0 pts capped`** (Overflow: 22.0 pts).
- Area C: C.1 (30) + C.2 (25) + C.3 (10) = `65.0 pts raw` -> **`40.0 pts capped`** (Overflow: 25.0 pts).
- Overall: `70 + 50 + 40 = 160.0 pts` (Passing = 120.0).

### Non-Teaching Scale:
- Area A: `90.0 pts` (Supervisor official rating indicators).
- Area B: B.1 (30) + B.2 (30) + B.3 (10) + B.4 (30) = `100.0 pts raw` -> **`60.0 pts capped`** (Overflow: 40.0 pts).
- Overall: `90 + 60 = 150.0 pts` (Passing = 75.0).
