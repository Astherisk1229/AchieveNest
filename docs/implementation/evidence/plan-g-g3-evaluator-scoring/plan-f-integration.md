# Plan F Integration Verification

## Plan F Scoring Engine & Result Determination Integration

Phase G3 acts strictly as the authorized input and capture layer for Plan G, delegating scoring limits, caps, and result outcomes to Plan F:

### Integration Invariants:
1. **No Duplication of Passing Thresholds**:
   - G3 consumes Passing Thresholds (Admin 120 / Non-Teaching 75) and Area Caps from Plan F.
2. **Result Determination**:
   - When scoring is complete, Plan F determines `Passed` or `Retained`.
3. **No Promotion / Rank Mutation**:
   - Neither G3 nor Plan F mutates academic rank or decides promotion (owned by Plan H).
