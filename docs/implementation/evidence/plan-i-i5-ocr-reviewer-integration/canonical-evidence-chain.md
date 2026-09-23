# Canonical Evidence Chain

## Authoritative Chain Architecture

```
Personnel Upload (I1)
  │
  ▼
I1 Persisted Evidence Record (database row)
  │
  ▼
Canonical evidence_id (UUID)
  │
  ▼
Persisted Protected Storage Key (e.g. personnel_evidence/user_101/ev_123.pdf)
  │
  ▼
OCR Reads Persisted File (I5: source authority = canonical evidence_id + verified SHA-256)
  │
  ▼
Achievement Stores / Uses Same evidence_id (Plan A/B)
  │
  ▼
Submitted Portfolio Snapshot Stores Same evidence_id (Plan C)
  │
  ▼
Reviewer Workspace Reads Submitted evidence_id (Plan G)
  │
  ▼
Authorized Preview / Download Streams Same Physical File (I3)
```

## Prohibited Substitutions
- No filename-only lookups.
- No client-local blobs or browser temporary paths.
- No substitution of live editable accomplishment evidence for submitted snapshot items.
- No substitution of latest replacement evidence for historical snapshots.
