# Summary Available Event (`summary_available`)

## Specification
- **Trigger**: Final rating sheet PDF is published and made available for download by the Personnel owner (Plan H2).
- **Actor**: System / HR Admin.
- **Required Metadata**: `document_type`, `evaluation_id`, `version_number`.
- **Invariants**: Emitted when the official summary document is published; never triggered by informal read preview requests.
