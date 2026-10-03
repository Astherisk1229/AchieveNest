# Duplicate Notification Risk Audit

## Risk Analysis
1. **Render / Route Entry Triggers**: Generating notifications on component mount (`useEffect`) or page reload causes duplicate notification spam.
2. **Polling / GET Triggers**: Fetching dashboard data must never insert or spawn notifications.
3. **Transaction Binding**: Notification creation must be bound strictly to backend state transition mutations (e.g. POST submit, POST return-for-revision, POST finalize), never frontend read cycles.
4. **Idempotency**: Plan J Phase J3 will enforce transition-based deduplication keys (`event_type + evaluation_id + version_number`).
