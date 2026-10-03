# HR Evaluation Scale Override Audit (Plan F)

## Structure & Persistence
- **Table**: `public.evaluation_scale_change_events`.
- **Recorded Fields**: `id`, `evaluation_id`, `original_scale_code`, `new_scale_code`, `actor_profile_id`, `reason`, `occurred_at`.
- **Governance**: Only HR Admin can override the assigned instrument scale.
- **Traceability**: All scale changes are immutable and logged with full reason text.
