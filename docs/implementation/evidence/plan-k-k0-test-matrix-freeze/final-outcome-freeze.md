# Final Outcome Cases Freeze — Plan K Phase K0

## Representative Final Evaluation Outcomes

| Case | Evaluation Result | Promotion Decision | Resulting Rank / State | Governance Implication |
|---|---|---|---|---|
| **Case A** | `Passed` | `Approved` | Next valid approved rank (e.g. `Instructor II`) | Standard promotion executed upon executive approval |
| **Case B** | `Passed` | `Not Approved` | Current rank retained (e.g. `Instructor I`) | Passed score is necessary but not sufficient; executive retention |
| **Case C** | `Retained` | N/A (Not Eligible) | Current rank retained | Score below passing threshold; no promotion decision recorded |
| **Case D** | Blocked | Blocked | Part-time title retained | Part-time faculty barred from ranking evaluation |
| **Case E** | Blocked | Blocked | Profile evaluation idle | Full-time faculty with `subject_to_evaluation = false` |

## Strict Separation of Dimensions
1. **Evaluation Result** (`Passed` / `Retained`) $\neq$ **Workflow Status** (`submitted` $\dots$ `completed`).
2. **Evaluation Result** $\neq$ **Promotion Decision** (`Approved` / `Not Approved`).
3. `Passed` does NOT imply automated promotion.
