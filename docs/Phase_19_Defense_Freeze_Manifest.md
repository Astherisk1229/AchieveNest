# AchieveNest — Phase 19 Defense Build Freeze Manifest

> **Freeze Identifier:** `prefinal-defense-local-v1`  
> **Target Branch:** `defense/wamp-local`  
> **Freeze Date:** 2026-08-28  
> **Defense Architecture Posture:** 100% Local-Defense WAMP Stack (Zero Remote Supabase Dependency)

---

## 1. Runtime Environment & Executables

| Component | Exact Version | Executable / Verification Path |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11 x64 | Host Architecture |
| **WampServer** | 3.x | `C:\wamp64\wampmanager.exe` |
| **Apache HTTPD** | 2.4.65 (Win64) | `C:\wamp64\bin\apache\apache2.4.65\bin\httpd.exe` (Port 80) |
| **PHP Engine** | 8.2.29 (CLI/ZTS x64) | `C:\wamp64\bin\php\php8.2.29\php.exe` |
| **MySQL Server** | 8.4.7 Community (x64) | `C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe` (Port 3306) |
| **MySQL Dump Tool** | 8.4.7 | `C:\wamp64\bin\mysql\mysql8.4.7\bin\mysqldump.exe` |
| **Node.js** | v24.13.1 | Node runtime |
| **npm** | 11.8.0 | Node package manager |
| **Google Chrome** | 151.0.7922.174 | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| **Git Client** | 2.51.2.windows.1 | Git CLI |

---

## 2. Service Endpoints & Local Ports

| Service | Port | Endpoint URL | Status Gate |
| :--- | :--- | :--- | :--- |
| **Backend API** | `8080` | `http://127.0.0.1:8080/api/v1` | Local CodeIgniter 4 Backend Server |
| **API Health** | `8080` | `http://127.0.0.1:8080/api/v1/health` | HTTP 200 (`status: ok`, `database: MySQLi`) |
| **Frontend Web App** | `5173` | `http://localhost:5173` | Local Vite Production/Dev Server |
| **MySQL Database** | `3306` | `127.0.0.1:3306` (`achievenest_local`) | MySQL 8.4.7 InnoDB utf8mb4 |

---

## 3. Defense Disaster Recovery Package

- **Backup Workspace:** `C:\Users\Admin\Documents\AchieveNest-Defense-Backup\`
- **Database Dump File:** `database\achievenest_local-20260828-143605.sql` (352,359 bytes)
  - **SHA-256 Hash:** `3D52B8833063847A10E572CE93D6318479CE21B34970A0E8F60EFCBBFE31257A`
- **Protected Evidence Archive:** `evidence\evidence-20260828-143605.zip` (2,999 bytes)
  - **SHA-256 Hash:** `7016C14A4401ADC6B65EA7574FB47706259CB3CB16953CA208DF263FC074EB0E`
- **Safe Environment Template:** `templates\backend.env.defense.template`

---

## 4. Cryptographic & Invariant Baselines

| Invariant | Authoritative Value |
| :--- | :--- |
| **Reference SHA-256 Fingerprint** | `a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f` |
| **Base Database Tables** | `57` base tables |
| **Authoritative Roles** | `7` system roles |
| **Colleges** | `5` accredited colleges |
| **Academic Programs** | `14` active programs |
| **Administrative Units** | `19` administrative units |
| **Portfolio Categories / Subcats** | `9` categories / `57` subcategories |
| **Award Definitions** | `15` institutional awards |
| **Demo Personas** | `10` active identities (`demo.*@ndmu.edu.ph`) |
| **Supabase Network Calls** | `0` (Zero remote dependency) |
