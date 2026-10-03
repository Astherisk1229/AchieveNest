# Backend Provisioning Endpoint Audit — Plan D2 Phase D2-0

### Controller & Route
- **Route**: `POST /api/v1/provisioning/manual-personnel`
- **Controller**: `TargetProvisioningController.php` (Method: `manualPersonnel`)
- **Auth & Authorization**: Requires authenticated HR Admin (`role:hr_admin`)

### Detailed Payload Processing Audit
In `TargetProvisioningController.php`:
```php
$allowedFields = [
    'institutional_id',
    'institutional_email',
    'first_name',
    'middle_name',
    'last_name',
    'suffix',
    'designation',
    'personnel_classification',
    'personnel_group',
    'organizational_side',
    'college_id',
    'academic_program_ids',
    'administrative_unit_id',
];
```

### CRITICAL PROVISIONING DISCONNECT IDENTIFIED
1. **The Disconnect**:
   - The frontend `OnboardPersonnelModal.jsx` submits:
     `faculty_engagement`, `employment_status`, `position_title`, `current_rank_title`, `qualification_summary`.
   - However, `$allowedFields` in `TargetProvisioningController.php` omits these keys.
   - As a result, when a new employee is created via manual onboarding, their rank, engagement status, qualification summary, and position title are NOT persisted on creation in `personnel_profiles`!
2. **Impact**:
   - New personnel accounts are created with uninitialized / null `current_rank_title`, `qualification_summary`, `faculty_engagement`, and `employment_status` until HR separately visits the **Edit Master Data** action modal.
3. **Classification**: `D2-RISK-07` — Provisioning Payload Whitelist Disconnect.
