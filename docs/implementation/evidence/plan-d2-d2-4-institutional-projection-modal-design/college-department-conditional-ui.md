# College / Department Conditional UI Presentation — Plan D2 Phase D2-4

## Conditional Rendering Logic
The modal dynamically renders institutional assignment inputs based on Organizational Side:

### Academic Mode (`organizational_side: 'academic'`)
- Shows **College Assignment** dropdown (populated from canonical College API).
- Shows **Academic Program Assignment** multi-select filtered by the selected College.
- Completely removes/disables Department assignment control.

### Non-Academic Mode (`organizational_side: 'non_academic'`)
- Shows **Department Assignment** dropdown (populated from canonical administrative units).
- Completely removes/disables College and Program assignment controls.

## User-Facing Terminology
- Label strictly displays `Department Assignment`, eliminating legacy technical terms like `Administrative Unit Assignment` from user view.

## Verification
- Verified in Tests 16, 17, and 18 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx).
