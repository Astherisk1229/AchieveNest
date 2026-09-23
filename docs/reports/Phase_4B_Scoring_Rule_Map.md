# Phase 4B — Scoring Rule Map
## Canonical Rubric, Mathematical Formulas, and Point Allocation Matrix

**Domain:** Scoring Rules & Formulas  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:45:00 UTC+08:00  

---

## 1. Full 70-Point Computable Scoring Model

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Verified Publication Evidence (Max 60.00 pts)                            │
│    ├─ News Item (COMP_JOURN_NEWS)       : 2 pts / record, Cap = 10.00 (Max 5)│
│    ├─ Literary (COMP_JOURN_LITERARY)    : 2 pts / record, Cap = 10.00 (Max 5)│
│    ├─ Column (COMP_JOURN_COLUMN)        : 4 pts / record, Cap = 20.00 (Max 5)│
│    └─ Editorial (COMP_JOURN_EDITORIAL)  : 4 pts / record, Cap = 20.00 (Max 5)│
│                                                                             │
│ 2. Leadership in Campus Journalism (Max 10.00 pts)                          │
│    ├─ Leadership Role (COMP_JOURN_LEAD_ROLE) : Officer = 3, Member = 2,     │
│    │                                          Cap = 5.00                    │
│    └─ Recognitions (COMP_JOURN_LEAD_AWARDS)  : Int/Nat = 3, Local = 2,      │
│                                               Seminar = 0 (Supporting),     │
│                                               Cap = 5.00                    │
│                                                                             │
│ 3. Portfolio Raw Score = Publication Total + Leadership Total (Max 70.00)  │
│ 4. Portfolio Potential Score = (Raw Score ÷ 70.00) × 100                    │
│ 5. Potential Candidate Threshold = Raw Score ≥ 56.00 (Potential ≥ 80.00%)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Scoring Formula Matrix

| Component Code | Component Name | Base Rule | Unit Points | Max Score | Max Contributing Units | Uncapped Formula | Capped Final Score |
|---|---|---|---:|---:|---:|---|---|
| `COMP_JOURN_NEWS` | News Item | `RULE_JOURN_NEWS` | 2.00 | 10.00 | 5 | $N_{\text{news}} \times 2$ | $\min(N_{\text{news}} \times 2, 10)$ |
| `COMP_JOURN_LITERARY` | Literary Work | `RULE_JOURN_LITERARY` | 2.00 | 10.00 | 5 | $N_{\text{lit}} \times 2$ | $\min(N_{\text{lit}} \times 2, 10)$ |
| `COMP_JOURN_COLUMN` | Column | `RULE_JOURN_COLUMN` | 4.00 | 20.00 | 5 | $N_{\text{col}} \times 4$ | $\min(N_{\text{col}} \times 4, 20)$ |
| `COMP_JOURN_EDITORIAL` | Editorial | `RULE_JOURN_EDITORIAL` | 4.00 | 20.00 | 5 | $N_{\text{ed}} \times 4$ | $\min(N_{\text{ed}} \times 4, 20)$ |
| `COMP_JOURN_LEAD_ROLE` | Leadership Role | `RULE_JOURN_LEAD_ROLE` | 3 (Officer) / 2 (Member) | 5.00 | 2 | $\sum \text{Role Points}$ | $\min(\sum \text{Role Points}, 5)$ |
| `COMP_JOURN_LEAD_AWARDS` | Awards & Recognitions | `RULE_JOURN_LEAD_AWARDS` | 3 (Int/Nat) / 2 (Local) / 0 (Seminar) | 5.00 | 2 | $\sum \text{Award Points}$ | $\min(\sum \text{Award Points}, 5)$ |

---

## 3. Threshold and Percentage Calculation

$$\text{Portfolio Potential Score} = \left(\frac{\text{Portfolio Raw Score}}{70.00}\right) \times 100$$

$$\text{Candidate Result} = \begin{cases} \text{POTENTIAL\_CANDIDATE} & \text{if } \text{Raw Score} \ge 56.00 \ (\text{Potential} \ge 80.00\%) \\ \text{BELOW\_THRESHOLD} & \text{if } \text{Raw Score} < 56.00 \ (\text{Potential} < 80.00\%) \end{cases}$$
