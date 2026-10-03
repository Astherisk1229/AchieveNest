# Personnel Own-Evidence Access Audit

## Findings
1. **Own-Evidence Read**: A faculty/personnel member can retrieve and download evidence attached to their own accomplishments.
2. **Cross-User Protection**: Attempting to query or download another personnel member's evidence returns `HTTP 403 Forbidden` (`FORBIDDEN`).
3. **Lifecycle Respect**: Personnel can view active evidence. When an evaluation is locked/submitted, accomplishments become read-only in working revisions while evidence remains retrievable for inspection.
