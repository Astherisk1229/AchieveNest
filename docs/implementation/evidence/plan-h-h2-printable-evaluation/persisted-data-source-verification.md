# Plan H Phase H2 — Persisted Data Source Verification

### Data Sources
- **Personnel Master Data**: Plan D
- **Submitted Snapshot & Version**: Plan C
- **Assigned Scale & Rule Version**: Plan F (`NDMU-PERSONNEL-RATING-V2`)
- **Official Accepted Scores**: Plan F / Plan G
- **Evaluation Result**: Plan H1 / Plan F
- **Reviewer Metadata**: Plan G

### Tampering Guard
- Client-supplied scores, totals, evaluation outcomes, approval names, or dates are discarded.
- The server constructs the read model directly from persisted authoritative data.
