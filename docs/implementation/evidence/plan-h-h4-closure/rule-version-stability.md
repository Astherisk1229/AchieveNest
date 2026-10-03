# Rule Version Stability Verification

## Invariant
Historical evaluation outcomes and promotion decisions must be bound to the exact scale, scoring, and rank transition rules in effect when the evaluation and promotion occurred. They must never be recalculated or altered if system configuration or point scales change in future cycles.

## Verification Items
1. **Scale Code & Version**: Frozen in historical evaluation record (e.g., `FACULTY_2024_V1`).
2. **Scoring Rule Reference**: Preserved as configured during Plan F execution.
3. **Plan E Transition Rule Reference**: Recorded alongside approved promotion decisions.
4. **No Auto-Upgrade**: Future changes to rank matrices or scoring scales do not trigger retroactive recalculation of locked evaluations.

## Validation Status
- **Result**: `VERIFIED STABLE`
