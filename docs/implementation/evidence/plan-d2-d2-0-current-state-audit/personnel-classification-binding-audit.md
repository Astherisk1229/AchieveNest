# Personnel Classification Binding Audit — Plan D2 Phase D2-0

### Authoritative Rule Freeze
- Exactly **Two Personnel Groups**:
  - `Faculty` (`faculty`)
  - `Non-Teaching Faculty` (`non_teaching_faculty`)
- Exactly **Two Organizational Sides**:
  - `Academic` (`academic`)
  - `Non-Academic` (`non_academic`)

### The 3 Valid Combinations vs 1 Prohibited Combination

| Personnel Group | Organizational Side | Valid? | Role Description |
|---|---|---|---|
| `Faculty` | `Academic` | **YES** | Regular teaching faculty in colleges and academic programs |
| `Non-Teaching Faculty` | `Academic` | **YES** | Academic support personnel attached to academic colleges |
| `Non-Teaching Faculty` | `Non-Academic` | **YES** | Personnel in administrative offices / units (Records, Library, Finance) |
| `Faculty` | `Non-Academic` | **PROHIBITED** | Unsupported by university organizational structure |

### Implementation Findings in Code
1. `validatePersonnelPlacement` in `personnelPlacement.js` correctly flags:
   `"Invalid combination: Faculty must belong to the Academic organizational side."`
2. `OnboardPersonnelModal.jsx` disables or flags the non-academic option when `faculty` is selected.
3. Legacy labels such as `"Teaching Faculty"` or treating `"Non-Teaching Personnel"` as a third group have been deprecated in favor of Plan D1 canonical classifications.
