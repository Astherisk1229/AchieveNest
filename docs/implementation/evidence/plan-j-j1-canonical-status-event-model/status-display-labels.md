# Status Display Labels & UI Separation

## Display Mappings
Internal status keys are decoupled from presentation strings:

| Internal Status Key | Canonical Display Label | Primary User Roles |
|---|---|---|
| `submitted` | "Submitted for Review" | Faculty, Dean, HR |
| `in_evaluation` | "Under Review" | Faculty, Dean, HR |
| `returned_for_revision` | "Returned for Revision" | Faculty, Dean, HR |
| `ready_for_finalization` | "Ready for Finalization" | Dean, HR |
| `completed` | "Completed / Finalized" | Faculty, Dean, HR |

Display labels may be styled or internationalized without mutating underlying database integrity.
