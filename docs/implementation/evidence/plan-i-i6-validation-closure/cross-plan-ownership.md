# Cross-Plan Responsibility Matrix

| Domain | Owning Plan | Plan I Interaction |
|---|---|---|
| Evidence Upload UX & OCR Rules | **Plan A** | Plan I provides backend secure upload, storage, and canonical identity for OCR |
| Portfolio Repository | **Plan B** | Plan I provides evidence attachment integrity |
| Portfolio Submission & Snapshots | **Plan C** | Plan I provides immutable `evidence_id` point-in-time binding |
| Personnel Classification | **Plan D** | Independent; uses Plan I evidence metadata |
| Rank Rules & Criteria | **Plan E** | Independent |
| Evaluation Scoring System | **Plan F** | Independent; evaluates attached evidence items |
| Reviewer Routing & Workspace | **Plan G** | Plan I provides authorized ID-based preview & download streaming |
| Finalization & Board Approval | **Plan H** | Plan I enforces lock and historical preservation |
| Secure Evidence Lifecycle | **Plan I** | **OWNER: Storage, Identity, Access, Versioning, OCR Integration & Deletion** |
| Audit UI & Real-time Alerts | **Plan J** | Consumes Plan I diagnostic DTOs and audit events |
