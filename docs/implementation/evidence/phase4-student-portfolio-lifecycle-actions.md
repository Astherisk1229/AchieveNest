# Plan 05 Phase 4 — Student Lifecycle Action Permissions
## Authorization and Transition Matrix for Student Portfolio Records

| Record Status | Can View Details? | Can Edit Record? | Can Delete Record? | Can Resubmit Record? | Policy Justification |
|---|---|---|---|---|---|
| `draft` | YES | YES | YES | NO (Direct submit) | Work in progress; student has full authorial control. |
| `submitted` | YES | NO | NO | NO | In queue for coordinator review; locked against tampering. |
| `under_review` | YES | NO | NO | NO | Actively being evaluated; locked. |
| `revisions_requested` | YES | YES | YES | YES | Returned with remarks; student edits and resubmits the same record. |
| `verified` | YES | NO | NO | NO | Officially certified institutional record; immutable. |
| `rejected` | YES | NO | NO | NO | Officially declined record; audit history preserved. |

### Invariant Rules
1. **Resubmit Same Record**: Resubmission updates the existing record ID in place (`status = 'submitted'`); 0 duplicate rows created.
2. **Verified Record Protection**: Verified accomplishments are strictly protected against modification or deletion.
