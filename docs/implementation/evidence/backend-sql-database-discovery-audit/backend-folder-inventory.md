# Backend Folder Inventory & Classification

| Folder Path | Classification | Purpose & Contents | Active Status |
|---|---|---|---|
| `backend/app/Commands` | CodeIgniter CLI Commands | Custom spark commands for audits, replays, and verification suites | ACTIVE |
| `backend/app/Config` | System Configuration | App, Database, Routes, Filters, Auth, Services, Validation configs | ACTIVE |
| `backend/app/Controllers/Api` | REST API Controllers | 27 API controllers handling all endpoints | ACTIVE |
| `backend/app/Database/Migrations` | CodeIgniter PHP Migrations | 67 migration files creating and modifying the active database schema | AUTHORITATIVE ACTIVE |
| `backend/app/Database/Seeds` | CodeIgniter Seeders | 5 demo and reference data seeders | ACTIVE |
| `backend/app/Filters` | HTTP Request Filters | AuthFilter, RoleFilter, Cors, RateLimiter, SessionFilter | ACTIVE |
| `backend/app/Helpers` | Global Utility Helpers | Common functions, response formatters | ACTIVE |
| `backend/app/Libraries` | Shared Libraries | PDF generators, Token verifiers, Third-party bridges | ACTIVE |
| `backend/app/Models` | CodeIgniter Active Record Models | Empty (`.gitkeep` only); Query Builder / Services used instead | INACTIVE / ARCHITECTURAL CHOICE |
| `backend/app/Phase17Canonical` | Phase 17M Migration Namespace | Isolated MySQL-only canonical migration namespace for replay gate | ISOLATED / REPLAY GATE |
| `backend/app/Services` | Domain & Business Logic | 71 Services & Policies encapsulating database transactions and business rules | AUTHORITATIVE ACTIVE |
| `backend/database/mysql-defense` | Raw MySQL DDL & Backups | 34 raw SQL migration files (000001–000034), validation scripts, and phase backups | COMPANION / REFERENCE / DEFENSE |
| `backend/public` | Web Server Public Root | `index.php`, robots.txt, asset storage entry point | ACTIVE |
| `backend/tests` | PHPUnit Tests | Automated backend unit and integration test suites | ACTIVE |
| `backend/writable/backups` | Database Snapshot Dumps | Timestamped SQL dumps of `achievenest_local` created during track checkpoints | HISTORICAL BACKUPS |
