# Audit Idempotency & Deduplication Evidence

### Key Generation Strategy
`audit:{event_key}:{evaluation_id}:v{version_number}:{transition_nonce}`

### Guarantees
- Retrying an API call or refreshing a dashboard does not create duplicate audit records.
- Source event links (`source_event_id`) map 1:1 to canonical persisted J1 workflow events.
