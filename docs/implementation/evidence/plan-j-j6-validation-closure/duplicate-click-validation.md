# Duplicate Click & Action Idempotency Evidence

### Idempotency Protections
1. **Submission**: `portfolio_submitted:{evalId}:v{ver}` prevents duplicate submission records.
2. **Revision Request**: `revision_requested:{evalId}:v{ver}:{nonce}` prevents duplicate whole-portfolio returns.
3. **Notification**: `notif:{eventId}:{recipientId}:{type}` prevents inbox duplicate spam upon repeated clicks.
4. **Audit Trail**: `audit:{eventKey}:{evalId}:v{ver}` ensures exactly one audit row per transition.
