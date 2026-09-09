# College Dropdown Binding & Empty-State Defect Audit — Plan D2 Phase D2-0

### Boundary Trace & Defect Analysis
1. **Frontend Call Point**:
   - `OnboardPersonnelModal.jsx` and `EditAssignmentModal.jsx` receive `options` from parent `PersonnelDirectory.jsx`.
2. **Options Derivation**:
   - In `PersonnelDirectory.jsx`, options are generated via:
     ```javascript
     const placementOptions = useMemo(() => collectPersonnelPlacementOptions(personnel), [personnel]);
     ```
3. **Internal Logic of `collectPersonnelPlacementOptions` (`personnelPlacement.js`)**:
   - Loops through the `personnel` array (the current list of active personnel loaded into the directory table).
   - Extracts `person.college_id`, `person.college_name`, etc.
4. **The Broken Boundary**:
   - If `personnel` list is empty, or if a newly installed tenant / clean database has no personnel assigned yet, `placementOptions.colleges` is `[]`.
   - The dropdown NEVER executes an HTTP call to `GET /api/v1/colleges` or `collegeAdminService.fetchColleges()`.
5. **Defect Classification**:
   - `DERIVATION_FROM_PERSONNEL_LIST_INSTEAD_OF_INSTITUTIONAL_ENDPOINT`
   - The dropdown was improperly designed to harvest colleges from loaded employee rows rather than fetching institutional master data from `GET /api/v1/colleges`.
