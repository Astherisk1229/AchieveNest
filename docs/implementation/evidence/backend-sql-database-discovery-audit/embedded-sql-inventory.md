# Embedded SQL & Database Access Patterns in PHP

AchieveNest follows a service-oriented database access architecture in CodeIgniter 4:

1. **Query Builder via `$db->table('table_name')`**:
   - The primary database access mechanism across all 71 services and API controllers.
   - Provides SQL injection defense, parameterized queries, and dialect independence between MySQL and PostgreSQL.

2. **Direct `$db->query("...")` Statements**:
   - Used predominantly in Migrations (`backend/app/Database/Migrations`) for DDL operations (`CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, `ADD CONSTRAINT`).
   - Used in `backend/app/Commands` for transactional data integrity verification and automated repair scripts.

3. **Absence of Traditional CI4 Active Record Models**:
   - Traditional `CodeIgniter\Model` classes under `backend/app/Models` are **not used**.
   - Instead, domain services under `backend/app/Services` act as Data Access Objects (DAOs) and repositories, ensuring strict validation and cross-entity business rules before database writes.
