# Plan 04 Phase 7 — Award Mapping Contract
## Direct Structured Metadata Consumption by Award Scoring Engines

### 1. Direct Structured Mapping Matrix

| Award Rule Engine Category | Mapping Engine Input | Persisted Source Field | Free-Text Parsing Dependency |
|---|---|---|---|
| Leadership Award | `position_level`, `organization_name`, `tenure_start`, `tenure_end` | `structured_metadata.position_level`, etc. | **0 (Zero)** |
| Organization Membership Award | `membership_type`, `contribution_level`, `organization_name` | `structured_metadata.membership_type`, etc. | **0 (Zero)** |
| Community Service Award | `service_type`, `service_scope`, `leadership_role`, `hours_rendered` | `structured_metadata.service_type`, etc. | **0 (Zero)** |
| Church & Ministry Award | `ministry_context`, `involvement_type`, `leadership_role` | `structured_metadata.ministry_context`, etc. | **0 (Zero)** |
| Seminar & Development Award | `training_type`, `event_level`, `hours_duration` | `structured_metadata.training_type`, etc. | **0 (Zero)** |
| Citation & Recognition Award | `recognition_level`, `granting_body`, `placement` | `structured_metadata.recognition_level`, etc. | **0 (Zero)** |
| Sports Award | `competition_type`, `event_level`, `placement`, `individual_team` | `structured_metadata.placement`, etc. | **0 (Zero)** |
| Socio-Cultural Arts Award | `performance_type`, `event_level`, `placement`, `individual_group` | `structured_metadata.placement`, etc. | **0 (Zero)** |
| Campus Journalism Award | `publication_type`, `publication_status`, `authorship_role` | `structured_metadata.publication_status`, etc. | **0 (Zero)** |

### 2. Gating and Verification Rules
- Only records with `status = 'verified'` are processed by `AwardEvidenceMappingService`.
- Drafts (`status = 'draft'`) and submitted (`status = 'submitted'`) records are strictly excluded from score calculation.
- Records with `publication_status = 'draft'` are excluded from scored publication evidence.
