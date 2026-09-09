# AchieveNest Plan 07 — Final Provisioning & First-Login Workflow
## End-to-End Sequence & Technical Contracts

---

## 1. Student Account Provisioning & Activation Flow

```mermaid
sequenceDiagram
    autonumber
    actor OSAD as OSAD Administrator
    participant UI as AchieveNest Frontend (OSAD)
    participant API as Backend API (TargetProvisioningController)
    participant DB as MySQL Database
    actor STU as Student
    participant STU_UI as AchieveNest Frontend (Student)

    OSAD->>UI: Fill Add Student Form (ID, Name, Program, Academic Year, Email)
    UI->>API: POST /api/v1/provisioning/manual-student
    API->>API: Normalize email, validate digits-only ID & program
    API->>DB: Check uniqueness (institutional_id & email)
    API->>API: Generate secure 16+ char temp password
    API->>DB: Transaction: Insert profiles, student_profiles, profile_roles, local_auth_credentials (must_change=1)
    API->>DB: Insert audit_logs (ACCOUNT_PROVISIONING_SUCCEEDED)
    API-->>UI: 201 Created (profile data + temporary_password)
    UI->>OSAD: Display OneTimeCredentialModal
    OSAD->>UI: Click "Print Credential Slip"
    UI->>API: POST /api/v1/accounts/{id}/audit-delivery-action (credential_slip_printed)
    UI->>OSAD: Render Print View (Slip)
    OSAD->>UI: Close Modal (State & Memory wiped)
    OSAD->>STU: Physical handoff of credential slip (in-person identity verified)

    STU->>STU_UI: Navigate to /login and enter Institutional Email + Temp Password
    STU_UI->>API: POST /api/v1/auth/login
    API->>DB: Verify bcrypt hash & check must_change_password=1
    API->>DB: Insert audit_logs (AUTH_FIRST_LOGIN_SUCCESS)
    API-->>STU_UI: 200 OK (access_token, status: pending_first_login, must_change_password: true)
    STU_UI->>STU_UI: Trap user: Redirect to /first-login/change-password
    
    opt Attempt Protected Route
        STU_UI->>API: GET /api/v1/achievements (with restricted token)
        API-->>STU_UI: 403 Forbidden (PASSWORD_CHANGE_REQUIRED)
    end

    STU->>STU_UI: Submit Personal Password (12+ chars, mixed complexity)
    STU_UI->>API: POST /api/v1/auth/change-password
    API->>DB: Update local_auth_credentials (new hash, must_change=0, status=active)
    API->>DB: Insert audit_logs (AUTH_PASSWORD_CHANGE_COMPLETED, ACCOUNT_ACTIVATED)
    API-->>STU_UI: 200 OK (new active session, must_change: false, status: active)
    STU_UI->>STU_UI: Route to /student/dashboard (Active Portal Access)
```

---

## 2. Personnel Account Provisioning & Activation Flow

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR Administrator
    participant UI as AchieveNest Frontend (HR)
    participant API as Backend API (TargetProvisioningController)
    participant DB as MySQL Database
    actor PERS as Personnel / Faculty
    participant PERS_UI as AchieveNest Frontend (Personnel)

    HR->>UI: Fill Add Personnel Form (Classification, College, Programs, Designation)
    UI->>API: POST /api/v1/provisioning/manual-personnel
    API->>API: Normalize email, validate classification & college
    API->>DB: Check uniqueness (institutional_id & email)
    API->>API: Generate secure 16+ char temp password
    API->>DB: Transaction: Insert profiles, personnel_profiles, profile_roles, local_auth_credentials (must_change=1)
    API->>DB: Insert audit_logs (ACCOUNT_PROVISIONING_SUCCEEDED)
    API-->>UI: 201 Created (profile data + temporary_password)
    UI->>HR: Display OneTimeCredentialModal
    HR->>UI: Click "Copy Credentials"
    UI->>API: POST /api/v1/accounts/{id}/audit-delivery-action (credentials_copied)
    HR->>PERS: Securely transmit/handoff temporary credentials
    
    PERS->>PERS_UI: Log in with temporary credentials
    PERS_UI->>API: POST /api/v1/auth/login
    API-->>PERS_UI: 200 OK (pending_first_login session)
    PERS_UI->>PERS_UI: Redirect to /first-login/change-password
    PERS->>PERS_UI: Submit Personal Password
    PERS_UI->>API: POST /api/v1/auth/change-password
    API-->>PERS_UI: 200 OK (active session)
    PERS_UI->>PERS_UI: Route to assigned Personnel portal (e.g. Dean / Coordinator / Faculty)
```

---

## 3. In-Office Administrative Reset & Recovery Flow

```mermaid
sequenceDiagram
    autonumber
    actor USER as Account Owner (Student/Personnel)
    actor ADMIN as OSAD / HR Administrator
    participant UI as AchieveNest Admin UI
    participant API as Backend API (AccountLifecycleController)
    participant DB as MySQL Database

    USER->>ADMIN: Reports lost credential slip or password lockout in office
    ADMIN->>ADMIN: Physically verifies Institutional ID Card & visual match
    ADMIN->>UI: Open Account Details -> Click "Reset Temporary Password"
    ADMIN->>UI: Check "I confirm that I have verified the physical identity", select Reason
    UI->>API: POST /api/v1/accounts/{id}/reset-temporary-password (verified_identity: true, reason)
    API->>API: Check RBAC & domain isolation (OSAD->Student, HR->Personnel)
    API->>API: Generate new 16+ char temporary passkey
    API->>DB: Invalidate previous sessions & update local_auth_credentials (new hash, must_change=1)
    API->>DB: Insert audit_logs (AUTH_ADMIN_PASSWORD_RESET_COMPLETED)
    API-->>UI: 200 OK (temporary_password)
    UI->>ADMIN: Display One-Time Reset Modal
    ADMIN->>UI: Print Credential Slip
    ADMIN->>USER: Hand over newly printed credential slip
    ADMIN->>UI: Close Modal (credentials purged from memory)
    USER->>USER: Executes First-Login flow with new passkey
```
