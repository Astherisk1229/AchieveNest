# AchieveNest — Local Development & Startup Commands

This document contains the exact commands to run the **Backend (CodeIgniter 4 / WAMP)** and **Frontend (React / Vite)** servers on Windows.

---

## 1. Prerequisites (Ensure WAMP is Running)

1. Launch **WampServer** from Windows (`C:\wamp64\wampmanager.exe`).
2. Wait for the WAMP tray icon to turn **GREEN** (confirming MySQL on port 3306 and Apache on port 80 are active).

---

## 2. Terminal Commands

### Terminal 1: Start Backend Server (CodeIgniter 4 / PHP 8.2)

> [!IMPORTANT]
> **Use WAMP's PHP 8.2 executable** (which has the required MySQLi extension configured).

Open a PowerShell terminal and run:

```powershell
cd C:\Users\Admin\Documents\AchieveNest\backend
& "C:\wamp64\bin\php\php8.2.29\php.exe" -S "127.0.0.1:8080" -t "public"
```

- **Backend Base URL:** `http://127.0.0.1:8080/api/v1`
- **API Health Check:** `http://127.0.0.1:8080/api/v1/health`

---

### Terminal 2: Start Frontend Server (React / Vite)

Open a second PowerShell terminal and run:

```powershell
cd C:\Users\Admin\Documents\AchieveNest\frontend
npm run dev
```

- **Frontend URL:** `http://localhost:5173`

---

## 3. Useful Maintenance & Testing Commands

### Reset Demo Database & Reseed All 10 Accounts
If you ever want to reset the database and reseed demo data:

```powershell
cd C:\Users\Admin\Documents\AchieveNest\backend
& "C:\wamp64\bin\php\php8.2.29\php.exe" spark demo:reset
```

---

### Run Automated Backend Master Regression
Runs the complete test suite across Auth, RBAC, Storage, Reference Data, and Awards:

```powershell
cd C:\Users\Admin\Documents\AchieveNest\backend
& "C:\wamp64\bin\php\php8.2.29\php.exe" spark test:phase15-backend
```

---

### Run Disaster Recovery (Backup & Restore) Test

```powershell
cd C:\Users\Admin\Documents\AchieveNest\backend
& "C:\wamp64\bin\php\php8.2.29\php.exe" spark test:phase18-dr
```

---

### Run Frontend Vitest Test Suite

```powershell
cd C:\Users\Admin\Documents\AchieveNest\frontend
npm test
```

---

### Run Static Security & Secret Audit

```powershell
cd C:\Users\Admin\Documents\AchieveNest\frontend
powershell -ExecutionPolicy Bypass -File scripts\phase17-secret-audit.ps1
```

---

## 4. Demo Login Credentials

Demo account passwords are read dynamically from [`backend/.env`](file:///c:/Users/Admin/Documents/AchieveNest/backend/.env):

```ini
ACHIEVENEST_DEMO_PASSWORD = Ndmu#DefenseRotated2026!o0CmS2R8!
```

### Pre-Seeded Accounts

| Persona | Email |
| :--- | :--- |
| **Student A** | `demo.student.a@ndmu.edu.ph` |
| **Student B** | `demo.student.b@ndmu.edu.ph` |
| **Academic Personnel** | `demo.academic.personnel@ndmu.edu.ph` |
| **Non-Academic Personnel** | `demo.nonacademic.personnel@ndmu.edu.ph` |
| **HR Administrator** | `demo.hr.admin@ndmu.edu.ph` |
| **OSAD Administrator** | `demo.osad.admin@ndmu.edu.ph` |
| **College Dean** | `demo.dean@ndmu.edu.ph` |
| **Program Coordinator A** | `demo.coordinator.a@ndmu.edu.ph` |
| **Program Coordinator B** | `demo.coordinator.b@ndmu.edu.ph` |
| **Organization Moderator** | `demo.moderator@ndmu.edu.ph` |
