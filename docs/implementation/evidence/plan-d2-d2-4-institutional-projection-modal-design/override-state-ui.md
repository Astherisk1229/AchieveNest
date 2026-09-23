# HR Override State UI Presentation — Plan D2 Phase D2-4

## Detection & Visual Indicators
When HR selects a rank different from the official saved rank:
1. **Visual Badge**: An amber/orange `HR Override` badge replaces the `Official Saved` badge.
2. **Audit Logging Requirement**: A dedicated "Reason for Manual Override" text field becomes mandatory, informing HR:
   *`A justification is required for the permanent audit trail when changing established official rank.`*
3. **Save Validation**: Saving is blocked if the override reason is empty or only whitespace.

## Verification
- Verified in Test 21 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx) and the D2-3 test suite.
