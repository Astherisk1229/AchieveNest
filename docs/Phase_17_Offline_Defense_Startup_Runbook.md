# AchieveNest — Phase 17 Offline Defense Startup Runbook

> **Scope:** Cold-start, restart, recovery, and operation of AchieveNest on the defense laptop with **zero internet connection** and **zero remote Supabase dependencies**.  
> **Environment:** Windows 10/11 x64, WampServer 3.x, Apache 2.4.65, MySQL 8.4.7, PHP 8.2.29, Node.js v24.13.1, Google Chrome.

---

## 1. Prerequisites Checklist (Offline Ready)

All dependencies and software packages are pre-installed on the local machine:
- [x] **WAMP Stack:** `C:\wamp64` (Apache 2.4.65, MySQL 8.4.7, PHP 8.2.29)
- [x] **Database:** `achievenest_local` MySQL database on port `3306`
- [x] **Backend:** CodeIgniter 4 app at `C:\Users\Admin\Documents\AchieveNest\backend`
- [x] **Frontend:** React / Vite app at `C:\Users\Admin\Documents\AchieveNest\frontend`
- [x] **Browser:** Google Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`

---

## 2. Standard Offline Cold-Start Procedure

Execute the following 6-step startup sequence on the defense day:

```text
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  1. Start WAMP Server  │ ───> │ 2. Verify achievenest  │ ───> │ 3. Start CodeIgniter   │
│  (Apache + MySQL 3306) │      │     Local Database     │      │   Backend (Port 8080)  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                             │
                                                                             ▼
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│ 6. Open Browser & Demo │ <─── │  5. Start Vite React   │ <─── │ 4. Verify Health Check │
│ (http://localhost:5173)│      │  Frontend (Port 5173)  │      │  (GET /api/v1/health)  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

### Step 1: Start WAMP Server
1. Launch **WampServer** from Desktop or Start Menu (`C:\wamp64\wampmanager.exe`).
2. Wait 10–15 seconds for the WAMP notification tray icon to turn **GREEN**.
   - *Green indicates Apache (port 80) and MySQL (port 3306) are both running.*

### Step 2: Verify Local Database (`achievenest_local`)
Open PowerShell and verify MySQL is ready:
```powershell
& "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe" -u root -e "SHOW DATABASES LIKE 'achievenest_local';"
```
Expected output:
```text
+--------------------------------+
| Database (achievenest_local)   |
+--------------------------------+
| achievenest_local              |
+--------------------------------+
```

### Step 3: Start the CodeIgniter 4 Backend
Open PowerShell Terminal 1:
```powershell
cd C:\Users\Admin\Documents\AchieveNest\backend
& "C:\wamp64\bin\php\php8.2.29\php.exe" -S "127.0.0.1:8080" -t "public"
```
*Backend is now serving on `http://127.0.0.1:8080`.*

### Step 4: Verify Backend Health Check
Open PowerShell Terminal 2 or browser:
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/health" -Method Get
```
Expected response:
```json
{
  "service": "AchieveNest API",
  "environment": "local-defense",
  "status": "ok",
  "database": {
    "configured": true,
    "connected": true,
    "driver": "MySQLi"
  }
}
```

### Step 5: Start the React Frontend Dev Server
In PowerShell Terminal 2:
```powershell
cd C:\Users\Admin\Documents\AchieveNest\frontend
npm run dev
```
*Frontend is now serving on `http://localhost:5173`.*

### Step 6: Launch Browser and Log In
1. Open Google Chrome and navigate to:
   ```text
   http://localhost:5173
   ```
2. Log in with any of the 10 pre-seeded defense demo accounts using the defense demo credential from the team's secured local credential source / ignored local environment (`ACHIEVENEST_DEMO_PASSWORD`).

---

## 3. Defense Demo Credentials Quick Reference

| # | Persona | Institutional Email | Role Scope / Portal |
| :--- | :--- | :--- | :--- |
| 1 | **Student A** | `demo.student.a@ndmu.edu.ph` | Student Portal (BSA Program) |
| 2 | **Student B** | `demo.student.b@ndmu.edu.ph` | Student Portal (BSBA-FM Program, Isolated) |
| 3 | **Academic Personnel** | `demo.academic.personnel@ndmu.edu.ph` | Personnel Portal (CBA College, Academic) |
| 4 | **Non-Academic Personnel** | `demo.nonacademic.personnel@ndmu.edu.ph` | Personnel Portal (HR Unit, Non-Academic) |
| 5 | **HR Administrator** | `demo.hr.admin@ndmu.edu.ph` | HR Admin Portal (Directory, Dean Governance) |
| 6 | **OSAD Administrator** | `demo.osad.admin@ndmu.edu.ph` | OSAD Admin Portal (Programs, Coord/Mod Governance) |
| 7 | **College Dean** | `demo.dean@ndmu.edu.ph` | Personnel Portal (CBA College Dean Scope) |
| 8 | **Program Coordinator A** | `demo.coordinator.a@ndmu.edu.ph` | Personnel Portal (BSA Coordinator Scope) |
| 9 | **Program Coordinator B** | `demo.coordinator.b@ndmu.edu.ph` | Personnel Portal (BSBA-FM Coordinator Scope) |
| 10 | **Organization Moderator** | `demo.moderator@ndmu.edu.ph` | Personnel Portal (DEMO_JPIA Moderator Scope) |

> [!NOTE]
> **Demo Account Credential Source:** Passwords are maintained exclusively outside Git in the local ignored environment configuration (`backend/.env` `ACHIEVENEST_DEMO_PASSWORD`) or on the defense team's physical printed credential sheet. They are never committed to repository tracking.

---

## 4. Offline Troubleshooting & Recovery Guide

### Issue 1: WAMP icon remains Orange or Red
**Root Cause:** Port 80 (Apache) or Port 3306 (MySQL) conflict.
**Offline Fix:**
1. Left-click WAMP icon $\rightarrow$ *Restart All Services*.
2. If MySQL didn't start, open Task Manager and terminate any zombie `mysqld.exe` processes, then click *Restart All Services*.

### Issue 2: Backend Port 8080 is already in use
**Root Cause:** A previous PHP background instance was left running.
**Offline Fix:**
```powershell
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```
Then re-run Step 3 backend startup command.

### Issue 3: Vite chooses a port other than 5173 (e.g., 5174)
**Root Cause:** Stale Node.js dev process holding port 5173.
**Offline Fix:**
```powershell
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```
Then re-run `npm run dev`.

### Issue 4: Reset Demo Database to Fresh Baseline
If demo test records need to be reset to pristine state:
```powershell
cd C:\Users\Admin\Documents\AchieveNest\backend
& "C:\wamp64\bin\php\php8.2.29\php.exe" spark db:seed DefenseDemoSeeder
```
*All 10 personas, role scopes, and operational scenarios are instantly re-seeded in ~1 second.*
