# Plan F Phase F1 Evidence: Rule Version Propagation

## Invariant Summary

1. Every scale assignment and configuration response explicitly returns:
   - `rule_version`: `NDMU-PERSONNEL-RATING-V2`
2. Plan C submitted portfolio snapshots and evaluation roots persist both:
   - `evaluation_scale_code`
   - `rule_version`
3. Historical evaluation contexts remain immutable and are not silently recomputed from live profile changes.
