# PLAN 09 — Administrator & Support Runbook
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Administrator Operational Runbook

### 1.1 Creating a Student Account
1. Navigate to **Student Accounts Directory** under OSAD Admin.
2. Click **Add Student Account** (+ icon).
3. Enter Institutional ID, First Name, Last Name, Institutional Email, Sex, College, Degree Program, and Year Level.
4. Click **Create Student Account**.
5. The system commits the account and displays the **Plan 07 One-Time Credential Slip**.
6. Print or copy credentials for the student.
7. Close the modal; the directory table refreshes automatically and displays the new student row.

### 1.2 If a Newly Created Student Does Not Appear
1. **Check Active Filters**: Review the active filter chips above the table (Search, College, Program, Year, Sex, Status).
2. **Review Notice Banner**: If the student is hidden by active filters, a blue notice banner will state:
   `Account for [ID] Name was created successfully, but is currently hidden by active filters.`
3. **Actions**: Click **View Created Student** to inspect the portfolio, or click **Clear Filters** to reveal the student in the table.

### 1.3 If Post-Commit List Refresh Fails
- A yellow warning banner will state: `Student account was created successfully, but the Student Accounts list could not refresh.`
- Click **Retry List** to reload the table.
- **DO NOT** attempt to create the student account again.

---

# 2. Support Diagnostic Runbook

When investigating student visibility or sync issues, follow this step-by-step diagnostic hierarchy:

```text
Step 1: Check Create Response & Database Persistence
        -> Execute: SELECT * FROM profiles WHERE institutional_id = '<ID>';
        -> Verify `student_profiles`, `student_program_enrollments`, and `local_auth_credentials` rows exist.

Step 2: Check Canonical List Query API
        -> Call GET /api/v1/osad/students with OSAD token.
        -> Verify the student is returned in the JSON payload.

Step 3: Check Active Frontend Search and Filters
        -> Confirm whether active college/year/sex filters exclude the record.

Step 4: Execute Data Reconciliation Utility
        -> Run: php backend/plan09_reconciliation_utility.php
        -> Verify canonical DB count matches API listing total.
```
