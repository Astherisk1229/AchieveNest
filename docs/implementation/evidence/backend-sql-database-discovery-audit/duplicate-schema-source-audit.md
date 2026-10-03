# Duplicate Schema Source Audit

### Sources Identified
1. **Primary Source**: `backend/app/Database/Migrations/*.php` (67 PHP migrations).
2. **Secondary Source**: `backend/database/mysql-defense/migrations/*.sql` (34 raw SQL migration files).
3. **Backup / Snapshots**: `backend/database/mysql-defense/*.sql` and `backend/writable/backups/*.sql`.

### Relationship & Status
- **Active / Authoritative**: `backend/app/Database/Migrations/*.php` is the CodeIgniter runtime migration engine that creates and manages the database.
- **Reference / Replay**: `backend/database/mysql-defense/migrations/*.sql` contains raw MySQL translations used during local defense verification and raw SQL import scripts.
- **Backups**: Timestamped SQL dumps are point-in-time snapshots and are strictly read-only backup artifacts.
