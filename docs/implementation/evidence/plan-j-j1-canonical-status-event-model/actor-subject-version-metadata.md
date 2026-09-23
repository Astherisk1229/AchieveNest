# Actor, Subject & Version Metadata Specification

## 1. Actor Metadata
- `actor_user_id`: UUID of the authenticated actor (`performed_by`).
- `actor_role`: Role used when performing transition (`faculty`, `dean`, `hr_admin`, `system`).
- `actor_name`: Human-readable full name for timeline presentation.

## 2. Subject Metadata
- `subject_personnel_id`: UUID of the evaluated personnel.
- `evaluation_id`: UUID of the evaluation record.

## 3. Version Metadata
- `version_number`: Integer version index (1 for initial, 2+ for resubmissions).
- `prior_version_number`: Integer prior version reference for resubmission events.
