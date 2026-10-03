# Frontend Model Constants Audit (`HRModel.js`) — Plan D2 Phase D2-0

### Static Constant Definitions in `HRModel.js`

1. **`HRModel.ACADEMIC_RANKS`**:
   - Contains 15 hardcoded string labels: `['Instructor I', 'Instructor II', 'Instructor III', 'Assistant Professor I', 'Assistant Professor II', 'Assistant Professor III', 'Assistant Professor IV', 'Associate Professor I', 'Associate Professor II', 'Associate Professor III', 'Associate Professor IV', 'Professor I', 'Professor II', 'Professor III', 'University Professor']`.
   - **Status**: Obsolete & Incomplete. Fails to cover the authoritative 26-rank Plan E Full-Time catalog (`Assistant Instructor`, `Senior Instructor I-IV`, `Professor IV`, etc.) and lacks stable codes.
   - **Active UI Usage**: Used only as fallback in legacy/secondary components; the active `OnboardPersonnelModal.jsx` and `EditMasterDataModal.jsx` currently use unconstrained free-text inputs.

2. **`HRModel.EMPLOYMENT_STATUSES`**:
   - Contains 5 hardcoded string values: `['Full-Time Permanent', 'Full-Time Probationary', 'Part-Time Faculty', 'Contractual', 'Tenured']`.
   - **Status**: Conflates independent concepts of Faculty Engagement (Full-Time vs Part-Time) and Employment Status / Tenure (Permanent vs Probationary).
   - **Active UI Usage**: Active UI in `OnboardPersonnelModal` and `EditMasterDataModal` has decoupled these into independent radio inputs (`facultyEngagement` and `employmentStatus`).

3. **`HRModel.COLLEGES` & `HRModel.ACADEMIC_PROGRAMS`**:
   - Contains static fallback lists for colleges and degree programs.
   - **Status**: Fallback-only. Authoritative source belongs to backend institutional tables (`colleges`, `academic_programs`).

4. **`HRModel.DEPARTMENTS`**:
   - Contains static list of offices/units (`['Human Resources', 'Finance', 'Registrar', 'Student Affairs', 'IT Services', 'Library', 'Facilities']`).
   - **Status**: Fallback-only. Authoritative source belongs to `administrative_units` table.
