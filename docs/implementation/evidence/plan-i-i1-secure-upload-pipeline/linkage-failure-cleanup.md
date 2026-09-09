# Linkage Failure Cleanup

## Invariant
An evidence record must never exist without authoritative attachment to a valid, verified accomplishment.

## Failure Mitigation
- All database operations are wrapped within transactional boundaries (`transStart` / `transComplete`).
- If linkage to the accomplishment fails, the transaction is rolled back and the physical file is unlinked.
- No unlinked or orphaned evidence rows survive in the database.
