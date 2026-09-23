# Server-Side Catalog Validation — Plan D2 Phase D2-1

## Validation Logic in FacultyStatusService & TargetProvisioningController
- Full-Time faculty submissions require valid ranks from the 26-rank Plan E catalog.
- Part-Time faculty submissions require valid titles from the 4-title Part-Time catalog.
- Empty or arbitrary titles outside established models are rejected with 422 `VALIDATION_FAILED` or `CATALOG_CROSSOVER_REJECTED`.
