# Test Data Policy — Plan K Phase K0

## Data Safety & Privacy Principles

1. **Synthetic Data Only**: All test personas, credentials, achievements, evaluation forms, and scores must use clearly fabricated synthetic data (e.g. `demo.faculty.p1@ndmu.edu.ph`, `p-k1-001`).
2. **Zero Real Personal Data**: Real faculty records, actual salary grades, personal addresses, or live institutional identification numbers must NEVER be used in test fixtures.
3. **Deterministic Reset**: All test fixtures and mock states must support clean teardown and idempotency between test runs.
4. **No Production Database Mutation**: Phase K0 does not mutate production tables; test account creation begins in Phase K1.
