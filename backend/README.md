# AchieveNest API

CodeIgniter 4.7 API configured for Supabase PostgreSQL and Supabase Auth identities.

## Local setup

1. Copy `.env.example` to `.env`.
2. In Supabase, open **Connect** and copy either the direct connection or Session pooler values.
3. Put the database host, username, password, database, and port in `.env`.
4. Put the project URL and server-side Supabase keys in `.env`. Never commit `.env` or expose the service-role key to the frontend.
5. Enable PHP extensions `intl`, `pgsql`, `pdo_pgsql`, `sqlite3`, and `pdo_sqlite` in the active `php.ini`. PostgreSQL powers Supabase; SQLite is used only by the local test suite. Until they are enabled globally on this machine, use the scripts below.

```powershell
.\scripts\spark.ps1 migrate
.\scripts\spark.ps1 serve
```

The API health endpoint is `GET http://localhost:8080/api/v1/health`.

## Database architecture

- Supabase Auth owns credentials and identities in `auth.users`.
- `public.profiles` extends each authenticated user with AchieveNest data.
- CodeIgniter is the authoritative application API and connects over PostgreSQL with SSL.
- Initial tables have RLS enabled and no browser-facing policies. Add narrowly scoped policies only when a direct Supabase Data API use case is approved.
- CodeIgniter migrations own the public application schema.

## Supabase connection choice

- Persistent host with IPv6: direct connection, port `5432`.
- Persistent IPv4-only host: Shared Pooler session mode, port `5432`; use the pooler username shown by Supabase.
- Serverless runtime: transaction pooler, port `6543`. Transaction mode does not support prepared statements and is not the default for this API.

## Verification

```powershell
.\scripts\php.ps1 vendor\bin\phpunit --no-coverage
.\scripts\spark.ps1 routes
```
