# Version Linkage & Lineage Audit

## Lineage Schema (Plan C4 / C5)
- `personnel_evaluation_roots`: Root container for the academic year / cycle.
- `personnel_evaluations.evaluation_root_id`: Foreign key to root container.
- `personnel_evaluations.version_number`: Integer version index (1, 2, 3...).
- `personnel_evaluations.is_latest_version`: Boolean flag indicating latest submitted version.
- **Event Linkage**: `personnel_evaluation_events.evaluation_id` links events to specific versions.
