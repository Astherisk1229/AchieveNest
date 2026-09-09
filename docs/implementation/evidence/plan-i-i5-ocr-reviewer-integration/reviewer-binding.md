# Reviewer Workspace Evidence Binding

## Workspace Resolution
1. Reviewer workspace (Plan G) consumes `personnel_evaluation_items.evidence_id`.
2. Reviewer preview calls `/api/v1/personnel/evidence/{evidenceId}/preview`.
3. Server enforces I3 authorization checks (Dean college scope, HR scope, unsubmitted forbidden, self-review forbidden).
4. Server streams the exact physical file stored under that canonical `evidence_id`.
5. Filename-based preview URL construction is completely removed and prohibited.
