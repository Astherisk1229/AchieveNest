# Qualification State Changed Event (`qualification_state_changed`)

## Specification
- **Trigger**: Annual qualification review result updated (Plan D).
- **Actor**: System / HR Admin.
- **Required Metadata**: `previous_state`, `new_state`, `academic_year`, `reason_code`.
- **Invariants**: Emitted only when qualification status transitions (`cleared`, `not_cleared`, `pending`).
