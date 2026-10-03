# Provisioning Whitelist Update Audit — Plan D2 Phase D2-1

## Target Provisioning Whitelist
In `TargetProvisioningController.php::manualPersonnel()`:
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
    'faculty_engagement',
    'employment_status',
    'position_title',
    'current_rank_title',
    'qualification_summary',
];
```

## Fields Verified
- `current_rank_title`: Persisted into `personnel_profiles.current_rank_title`.
- `qualification_summary`: Persisted into `personnel_profiles.qualification_summary`.
- `faculty_engagement`: Persisted into `personnel_profiles.faculty_engagement`.
- `employment_status`: Persisted into `personnel_profiles.employment_status`.
- `position_title`: Persisted into `personnel_profiles.position_title`.
