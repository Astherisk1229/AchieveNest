# HR-on-Behalf Deletion Authorization

## 1. Governance Constraint on HR Deletion
- HR administrators cannot arbitrarily purge candidate records on their own initiative.
- HR execution of complete deletion requires an explicit, documented owner authorization reference (e.g. formal written request identifier `REQ-2026-DELETE-FORM-0842`).
- Deletion without this reference is rejected with `owner_authorization_required`.

## 2. Test Verification
- Test 3.3: `allows HR Admin to execute complete deletion with documented authorization reference` (PASSED)
- Test 3.4: `rejects HR Admin execution of complete deletion when authorization reference is missing` (PASSED)
