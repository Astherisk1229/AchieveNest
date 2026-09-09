# Supabase (PostgreSQL) vs Local WAMP (MySQL) Architecture Audit

| Architectural Layer | Configuration / Engine | Active Runtime State |
|---|---|---|
| **Backend Runtime (CodeIgniter 4)** | MySQLi targeting `achievenest_local` on port 3306 | **ACTIVE** (Driven by `ACHIEVENEST_ENV = local-defense`) |
| **Backend Cloud Target (Supabase)** | Postgre driver targeting `postgres` on port 5432/54322 | **STANDBY / CLOUD READY** (Preserved in `Config/Database.php`) |
| **Frontend Direct Access** | Frontend connects via REST API to CodeIgniter (`http://localhost:8080/api/v1`) | **ACTIVE** (No direct browser-to-database bypass) |
| **Migration Compatibility** | Migrations written to support both PostgreSQL and MySQL engines | **VERIFIED** |
