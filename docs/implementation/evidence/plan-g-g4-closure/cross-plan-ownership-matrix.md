# Cross-Plan Ownership Matrix

| Area / Concern | Owning Plan | Responsibilities | Boundary Invariant |
|---|---|---|---|
| **Portfolio Submission & Snapshots** | **Plan C** | Candidate portfolio creation, evidence attachment, submission freeze, snapshot immutability | Reviewers cannot mutate candidate portfolio entries |
| **Personnel Master Data** | **Plan D** | Personnel classifications, side, group, college/unit placement | Master data is read-only in evaluation workspace |
| **Rank Catalog & Progression Graph** | **Plan E** | Seeded ranks, allowable transition paths, PhD exceptions | Rank progression is not auto-triggered by scoring |
| **Evaluation Scales & Rules Engine** | **Plan F** | Scale definitions, caps, deterministic formulas, Passed/Retained determination | Single scoring authority across the system |
| **Reviewer Routing & Workspace** | **Plan G** | Canonical reviewer routing, queue assignment, workspace review, judgment points, Area A ratings, handoff readiness | Terminates at handoff; no promotion authority |
| **Deliberation & Promotion Approval** | **Plan H** | Institutional Promotion Board deliberation, promotion approval/denial, official rank mutation | Exclusive authority for promotion and rank commit |
| **Evidence Lifecycle** | **Plan I** | Evidence file storage, deduplication, audit logs | Review workspace consumes evidence read-only |
| **Notifications & Audit UX** | **Plan J** | System-wide notifications and activity streams | Consumes events emitted by upstream plans |
