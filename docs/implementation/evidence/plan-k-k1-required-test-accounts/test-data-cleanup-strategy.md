# Test Data Cleanup Strategy

- **Strategy**: Fixture teardown and deterministic in-memory reset.
- **Destructive Deletion Prohibition**: No `TRUNCATE` or broad `DELETE` statements against shared environments.
