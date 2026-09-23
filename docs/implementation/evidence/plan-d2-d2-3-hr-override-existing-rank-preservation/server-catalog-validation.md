# Phase D2-3: Server Catalog Validation & Crossover Rejection

## Server-Side Enforcement
The backend service `FacultyStatusService.php` and provisioning controller `TargetProvisioningController.php` validate all submitted rank/title strings against applicable catalogs:

### Crossover Rejections (`CATALOG_CROSSOVER_REJECTED`)
1. **Part-Time Title on Full-Time Faculty**:
   - Submitting `Professorial Lecturer` or `Lecturer` for `full_time_faculty` is rejected with 422:
     `Part-Time faculty title cannot be assigned to Full-Time faculty.`
2. **Full-Time Rank on Part-Time Faculty**:
   - Submitting `Assistant Professor I` or `Instructor I` for `part_time_faculty` is rejected with 422:
     `Full-Time academic rank cannot be assigned to Part-Time faculty. Only Part-Time titles are allowed.`
