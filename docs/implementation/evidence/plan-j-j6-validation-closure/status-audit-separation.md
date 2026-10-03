# Current Status vs Historical Audit Separation Evidence

### Separation Invariants
1. Current workflow status is a live read model representing the active lifecycle stage.
2. Audit trail is a chronologically ordered historical sequence of all past actions.
3. Reading or refreshing status does not generate new audit entries.
4. Historical audit rows are never overwritten to reflect the current status.
