# Audit Table Inventory Across System

| Table Name | Owning Domain | Primary Key | Key Foreign Keys | Purpose |
|---|---|---|---|---|
| `public.audit_logs` | Security / Auth | UUID | `actor_profile_id`, `target_id` | Core security & admin action log |
| `public.personnel_evaluation_events` | Plan C / G / H | UUID | `evaluation_id`, `performed_by` | Evaluation state transitions |
| `public.evaluation_scale_change_events` | Plan F | UUID | `evaluation_id`, `actor_profile_id` | HR scale override history |
| `public.file_security_audit_events` | Plan I | UUID | `evidence_id`, `actor_profile_id` | Evidence upload & virus scan trace |
| `public.role_assignment_events` | Plan E / H | UUID | `target_profile_id`, `assigned_by` | Rank & governance changes |
