# Modal Section Hierarchy & Structure — Plan D2 Phase D2-4

## Four-Section Architecture
Both [OnboardPersonnelModal.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/hr-admin/personnel-directory/OnboardPersonnelModal.jsx) and [EditMasterDataModal.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/hr-admin/personnel-directory/EditMasterDataModal.jsx) implement the structured 4-section layout:

1. **Section A: Account & Identity**
   - Employee ID (Read-only in Edit mode)
   - Full Name
   - Institutional Email

2. **Section B: Employment Classification**
   - Personnel Group (`Faculty` vs `Non-Teaching Faculty`)
   - Organizational Side (`Academic` vs `Non-Academic`)
   - Faculty Engagement (`Full-Time Faculty` vs `Part-Time Faculty`)
   - Employment Status (`Permanent` vs `Probationary`)

3. **Section C: Institutional Assignment**
   - Conditional College Assignment (Academic mode) OR Department Assignment (Non-Academic mode)
   - Position / Job Title (Descriptive open-entry input)

4. **Section D: Educational Qualification & Academic Rank**
   - Educational Qualification Dropdown (Plan E catalog)
   - Current Official Academic Rank / Title (Full-Time / Part-Time isolated catalog)
   - Advisory Recommendation State & "Use Suggested Rank" action
   - HR Override badge & mandatory audit reason input
   - Legacy Reconciliation banner for legacy ranks

## Verification
- Verified in Test 15 and Tests 25–29 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx).
