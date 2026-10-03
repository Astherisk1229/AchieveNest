# Cross-Role Workflow Authoritative Contracts

## Governance decision

Confirmed by the project owner on 2026-09-10:

- An ordinary academic faculty member is reviewed by the active Dean assigned to the faculty member's College.
- All other Personnel are reviewed by HR.
- A Personnel member who is currently assigned as Dean is reviewed by HR; a Dean never reviews their own portfolio.
- A missing College affiliation or missing active Dean blocks an ordinary faculty submission. It must not silently reroute to HR.
- There is no Dean-to-HR endorsement handoff for an ordinary faculty portfolio.
- Dean annual review remains a separate eligibility/governance record and is not a portfolio evaluation status.

## Canonical Student portfolio states

`draft → submitted → revision_requested → submitted → verified|rejected → archived`

Only these persisted values are used by the Student/Coordinator integration:

- `draft`
- `submitted`
- `revision_requested`
- `verified`
- `rejected`
- `archived`

Display labels such as “Pending Review” and “Returned” are presentation-only mappings.

## Canonical Personnel evaluation states

```text
submitted → in_evaluation | returned_for_revision
in_evaluation → returned_for_revision | ready_for_finalization
returned_for_revision → submitted
ready_for_finalization → completed
```

Dean annual-review decisions (`cleared`, `not_cleared`) must not be stored as Personnel evaluation states.

## Record continuity

Student:

```text
student_portfolio_records.id
→ student_portfolio_evidence.portfolio_record_id
→ student_portfolio_verification_events.portfolio_record_id
→ notifications.reference_id
→ award evidence mapping
```

Personnel:

```text
personnel_accomplishments.id
→ personnel_evaluation_items.accomplishment_id
→ personnel_evaluations.id
→ personnel_evaluation_events.evaluation_id
→ notifications.reference_id
```

## Runtime authority

The database and protected local storage are authoritative. Browser storage and hardcoded arrays must never supply cross-role workflow records.
