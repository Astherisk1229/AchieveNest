# Backend SQL & Database Discovery Audit — Environment

| Property | Value | Notes / Evidence |
|---|---|---|
| OS | Windows (win32 10.0.26100) | Development Workstation |
| Node.js | v24.13.1 | Test and script runtime |
| PHP CLI | PHP 8.5.5 (cli) | CodeIgniter v4.7.4 backend runtime |
| Active Local DB Engine | MySQL 8.0+ / MariaDB (MySQLi Driver) | Default group resolved via `ACHIEVENEST_ENV = local-defense` |
| Active Local DB Name | `achievenest_local` | Port 3306, User `achievenest_app` |
| Cloud / Hosted DB Engine | PostgreSQL (Postgre Driver / Supabase) | Port 5432/54322, Schema `public` |
| Test In-Memory DB Engine | SQLite3 (`:memory:`) | Used for CI4 unit tests |
| Audit Timestamp | 2026-09-09 | Full repository scan |
