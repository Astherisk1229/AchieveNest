# API CSV Reconciliation

The CSV is generated from current non-OPTIONS route declarations by `scripts/build-backend-api-database-map.ps1`. It records route, method, controller action/file, repository-inferred services/tables, read/action classification, and conservative auth guidance. Duplicate source declarations collapse to one route/method row.
