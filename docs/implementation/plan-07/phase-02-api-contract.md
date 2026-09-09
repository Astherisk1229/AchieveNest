# AchieveNest Plan 07 — Phase 2 Evidence
# Normalized API Lifecycle Contracts

---

## 1. Authentication & Provisioning Endpoints

### 1.1 `POST /api/v1/auth/login`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLC...",
    "token_type": "Bearer",
    "expires_at": "2026-09-03T01:00:00+08:00",
    "expires_in": 86400,
    "must_change_password": true,
    "account_lifecycle_status": "pending_first_login",
    "administrative_status": "active",
    "required_next_action": "change_password",
    "user_id": "3a44afeb-6506-4eff-97e8-18c25f90d54b"
  }
}
```

### 1.2 `GET /api/v1/auth/me`
```json
{
  "data": {
    "authenticated": true,
    "user": {
      "id": "3a44afeb-6506-4eff-97e8-18c25f90d54b",
      "institutional_id": "2026-DEMO-001",
      "institutional_email": "demo.student.a@ndmu.edu.ph",
      "full_name": "Demo Student A",
      "account_type": "student",
      "status": "active",
      "administrative_status": "active",
      "account_lifecycle_status": "active",
      "required_next_action": "none",
      "must_change_password": false,
      "roles": ["student"]
    }
  }
}
```

### 1.3 `POST /api/v1/provisioning/manual-student`
```json
{
  "data": {
    "message": "Student account successfully provisioned.",
    "id": "3a44afeb-6506-4eff-97e8-18c25f90d54b",
    "institutional_id": "STU10001",
    "institutional_email": "student.stu10001@ndmu.edu.ph",
    "full_name": "Juan Dela Cruz",
    "account_type": "student",
    "status": "active",
    "administrative_status": "active",
    "account_lifecycle_status": "pending_first_login",
    "must_change_password": true,
    "required_next_action": "change_password",
    "temporary_password": "Ndmu#[hex8]"
  }
}
```

### 1.4 `POST /api/v1/provisioning/manual-personnel`
```json
{
  "data": {
    "message": "Personnel account successfully provisioned.",
    "id": "c3ab8730-35e8-44c7-b8df-5a88958a05a2",
    "institutional_id": "HR10001",
    "institutional_email": "faculty.hr10001@ndmu.edu.ph",
    "full_name": "Maria Santos",
    "account_type": "personnel",
    "personnel_classification": "academic",
    "status": "active",
    "administrative_status": "active",
    "account_lifecycle_status": "pending_first_login",
    "must_change_password": true,
    "required_next_action": "change_password",
    "temporary_password": "Ndmu#[hex8]"
  }
}
```

### 1.5 `POST /api/v1/auth/change-password`
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Password has been updated successfully.",
    "must_change_password": false,
    "account_lifecycle_status": "active",
    "administrative_status": "active",
    "required_next_action": "none"
  }
}
```
