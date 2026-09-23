# Department Visible Label Update — Plan D2 Phase D2-1

## UI Terminology Update
In the HR Create/Edit Personnel provisioning and placement UI:
- Visible label changed from: `Administrative Unit`
- To: `Department`

## Scope of Change
- Applied to: `OnboardPersonnelModal.jsx`, `EditAssignmentModal.jsx`, `EditMasterDataModal.jsx`.
- Database column retention: Underlying canonical foreign key remains `administrative_unit_id` in `personnel_profiles` and backend models to ensure zero database schema regression.
