# Runtime Database Reconciliation

`backend/.env` selects `ACHIEVENEST_ENV = local-defense` and `database.defaultGroup = local_defense`. `Database.php` selects the MySQLi local-defense group under either condition. PostgreSQL/Supabase-compatible groups exist as alternate/cloud or replay targets and are not simultaneously active. Credentials are intentionally omitted.
