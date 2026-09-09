# HR Scale Override Event (`evaluation_scale_overridden`)

## Specification
- **Trigger**: HR Admin overrides automatically determined instrument scale (Plan F2).
- **Actor**: HR Admin.
- **Required Metadata**: `original_scale`, `overridden_scale`, `reason`, `authorized_by`.
- **Invariants**: Emitted only for manual HR overrides; never for default instrument scale selection.
