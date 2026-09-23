# Legacy & Backup File Classification

| Directory | File Count | Classification | Recommended Action |
|---|---:|---|---|
| `backend/database/mysql-defense/migrations` | 34 files | Active Reference (MySQL DDL) | Retain for local SQL defense scripts |
| `backend/database/mysql-defense/*.sql` | 23 files | Phase Snapshot Backups | Retain for disaster recovery & audit proof |
| `backend/writable/backups/*.sql` | 7 files | Local Development Backups | Retain for rollbacks |
