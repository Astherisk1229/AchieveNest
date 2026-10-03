# Audit Immutability Validation Evidence

### Verified Append-Only Guarantees
- Direct UPDATE calls against audit records throw `RuntimeException`.
- Direct DELETE calls against audit records throw `RuntimeException`.
- Marking a notification as read leaves audit history untouched.
- Refreshing status leaves audit history untouched.
- Audit history is 100% reconstructable and tamper-proof for ordinary users.
