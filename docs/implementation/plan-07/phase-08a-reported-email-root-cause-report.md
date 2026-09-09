# AchieveNest Plan 07 — Phase 8A Root Cause Report
# Investigation of Reported Email Conflict (`bserquina@ndmu.edu.ph`)

---

## 1. Database & Code Investigation Evidence

### 1.1 Read-Only Database Queries
```sql
SELECT * FROM profiles WHERE email LIKE '%bserquina%';
-- Result: 0 rows

SELECT * FROM profiles WHERE institutional_id = '2023368';
-- Result: 1 row
-- id: 5c69f2d3-882c-4849-96a3-0d34a1928822
-- institutional_id: 2023368
-- full_name: Sean Asther Faderes
-- email: sfaderes@ndmu.edu.ph
-- status: active
```

### 1.2 Frontend & Backend Error Mapping Trace
1. **User Action**: In the Add Student Account modal, the user entered `Institutional ID: 2023368` and `Institutional Email: bserquina@ndmu.edu.ph`.
2. **Backend Execution**: The backend conflict detection checked whether `institutional_id = '2023368'` or `email = 'bserquina@ndmu.edu.ph'` existed. Because `2023368` existed in `profiles`, the backend returned an HTTP `409` conflict.
3. **Frontend Presentation**: The frontend error handler caught the `409` conflict and assigned the error message to `fieldErrors.institutionalEmail`:
   `"An account with this email already exists."`
4. **Result**: The administrator saw a false email conflict message because an ID conflict was erroneously attributed to the email field.

---

## 2. Classification & Resolution

- **Classification**: Error-mapping defect on duplicate submission (Section 7.5: *Actual conflict is Institutional ID*).
- **Resolution**: Implemented discrete error codes (`INSTITUTIONAL_ID_ALREADY_EXISTS` vs `EMAIL_ALREADY_EXISTS`) and field-specific frontend mapping in `AddStudentAccountModal.jsx` and `OnboardPersonnelModal.jsx`.
