# HR Status View Evidence

### Visible Information
- Canonical Lifecycle Status (`Submitted`, `Under Review`, `Returned for Revision`, `Ready for Finalization`, `Completed`)
- Current Submitted Portfolio Version (`Version 1`, `Version 2`, etc.)
- Reviewer Assignment and routing state
- Last Meaningful Workflow Event with actor and timestamp
- Finalization readiness state
- Independent Evaluation Result (`Passed` / `Retained`)
- Independent Promotion Decision (`Approved` / `Not Approved`)
- Dossier lock state (`is_locked: true` upon completion)

### Invariants
- HR view maintains independent presentation of Lifecycle Status, Evaluation Result, and Promotion Decision without collapsing or confounding them.
