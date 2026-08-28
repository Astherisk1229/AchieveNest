# AchieveNest — Phase 20 Defense-Day Master Runbook

> **Document Status:** AUTHORITATIVE DEFENSE-DAY GUIDE  
> **Target Build:** `prefinal-defense-local-v1`  
> **Frozen Commit:** `22b9718967ff54a03eeda753d7de975737edff14`  
> **Target Branch:** `defense/wamp-local`  
> **Operating Mode:** 100% Local-Defense WAMP Stack (Zero Remote Supabase Dependency)

---

## 1. Quick Start (5-Minute Defense Setup)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. Boot laptop and ensure Wi-Fi is disconnected (offline defense posture).      │
│ 2. Launch WampServer (wait for Green Tray Icon).                                │
│ 3. Start Backend: cd backend; php -S 127.0.0.1:8080 -t public                   │
│ 4. Verify API Health: http://127.0.0.1:8080/api/v1/health (HTTP 200).          │
│ 5. Start Frontend: cd frontend; npm run dev                                     │
│ 6. Open Google Chrome: Navigate to http://localhost:5173                        │
│ 7. Perform pre-panel login check with Student A.                                │
│ 8. Open one verified evidence document to confirm file streaming.               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hardware & Runtime Prerequisites

| Component | Exact Version | Executable / Verification Path |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11 x64 | 64-bit Host Architecture |
| **WampServer** | 3.x | `C:\wamp64\wampmanager.exe` |
| **Apache HTTPD** | 2.4.65 (Win64) | `C:\wamp64\bin\apache\apache2.4.65\bin\httpd.exe` (Port 80) |
| **PHP CLI/ZTS** | 8.2.29 | `C:\wamp64\bin\php\php8.2.29\php.exe` |
| **MySQL Server** | 8.4.7 Community | `C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe` (Port 3306) |
| **MySQL Dump Tool** | 8.4.7 | `C:\wamp64\bin\mysql\mysql8.4.7\bin\mysqldump.exe` |
| **Node.js** | v24.13.1 | Node runtime engine |
| **npm** | 11.8.0 | Node package manager |
| **Google Chrome** | 151.0.7922.174 | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| **Git Client** | 2.51.2.windows.1 | Git version control CLI |

---

## 3. Local Service Endpoints & Commands

### Terminal 1: CodeIgniter Backend
```powershell
cd C:\Users\Admin\Documents\AchieveNest\backend
& "C:\wamp64\bin\php\php8.2.29\php.exe" -S "127.0.0.1:8080" -t "public"
```
*Expected Terminal Output:* `PHP 8.2.29 Development Server (http://127.0.0.1:8080) started`

### Terminal 2: React Frontend
```powershell
cd C:\Users\Admin\Documents\AchieveNest\frontend
npm run dev
```
*Expected Terminal Output:* `VITE v8.1.5 ready in ~250 ms -> Local: http://localhost:5173/`

### Local URL Endpoints
- **Web Application:** `http://localhost:5173`
- **Backend API Base:** `http://127.0.0.1:8080/api/v1`
- **Health Verification:** `http://127.0.0.1:8080/api/v1/health`
- **MySQL Database:** `127.0.0.1:3306` (`achievenest_local`)

---

## 4. Demo Credential Handling

> [!IMPORTANT]
> **Zero Committed Literals:** Shared demo account passwords are not stored in Git tracking. They are read exclusively from the ignored local environment (`backend/.env` `ACHIEVENEST_DEMO_PASSWORD`) or referenced from the defense team's secured physical credential reference sheet.

### Defense Personas Table

| # | Persona | Demo Email | Primary Governance Scope |
| :--- | :--- | :--- | :--- |
| 1 | **Student A** | `demo.student.a@ndmu.edu.ph` | Student Portal (BSA Program Scope) |
| 2 | **Student B** | `demo.student.b@ndmu.edu.ph` | Student Portal (BSBA-FM Program Scope) |
| 3 | **Academic Personnel** | `demo.academic.personnel@ndmu.edu.ph` | Personnel Portal (CBA College Scope) |
| 4 | **Non-Academic Personnel** | `demo.nonacademic.personnel@ndmu.edu.ph` | Personnel Portal (HR Administrative Unit Scope) |
| 5 | **HR Administrator** | `demo.hr.admin@ndmu.edu.ph` | HR Admin Portal (University-wide Personnel & Ranking) |
| 6 | **OSAD Administrator** | `demo.osad.admin@ndmu.edu.ph` | OSAD Admin Portal (Colleges, Programs & Awards) |
| 7 | **College Dean** | `demo.dean@ndmu.edu.ph` | Personnel Portal (CBA Oversight & Nominations) |
| 8 | **Program Coordinator A** | `demo.coordinator.a@ndmu.edu.ph` | Personnel Portal (BSA Program Scope) |
| 9 | **Program Coordinator B** | `demo.coordinator.b@ndmu.edu.ph` | Personnel Portal (BSBA-FM Program Scope) |
| 10 | **Organization Moderator** | `demo.moderator@ndmu.edu.ph` | Personnel Portal (DEMO_JPIA Moderator Scope) |

---

## 5. Planned 10-Step Presentation Sequence

```text
[1. Student A] ─────────> [2. Coordinator A] ──────> [3. Student A (Verified)]
     │
     ▼
[4. OSAD Admin] ────────> [5. HR Admin] ───────────> [6. College Dean]
     │
     ▼
[7. Academic Personnel] ─> [8. Non-Academic] ───────> [9. Org Moderator]
     │
     ▼
[10. Student B / Coord B (Isolation Proof)]
```

1. **Student A (BSA):** Demonstrate portfolio dashboard, achievement submission categories, and view verified achievements with streaming PDF evidence.
2. **Program Coordinator A (BSA):** Show the BSA verification queue, open pending evidence, and demonstrate domain validation.
3. **Student A Re-visit:** Show instant badge status update, notification delivery, and Potential Candidate threshold evaluation.
4. **OSAD Administrator:** Present academic hierarchy (5 Colleges, 14 Academic Programs), Coordinator/Moderator assignments, and 15 institutional Award definitions.
5. **HR Administrator:** Demonstrate Personnel Directory, Academic/Non-Academic placements, Administrator Ranking scale (70/50/40 = 160 max, 120 passing), and Dean governance ownership.
6. **College Dean (CBA):** Demonstrate check-and-balance oversight on finalized HR evaluations and the Dean cross-college student award nomination workflow.
7. **Academic Personnel:** Show faculty accomplishment portfolio under CBA College placement.
8. **Non-Academic Personnel:** Show staff accomplishment portfolio under Administrative Unit placement.
9. **Organization Moderator (DEMO_JPIA):** Show organization activity verification restricted to assigned student organization scope.
10. **Student B & Coordinator B:** Demonstrate cross-program and cross-user authorization barriers (Student A records invisible to Coordinator B).

---

## 6. Truthful File Security & Evidence Claim Policy

When presenting file upload and evidence retrieval features:
- **State Truthfully:** Evidence storage is managed locally on protected filesystem disk (`writable/uploads/evidence/`) with token-authorized streaming.
- **Do Not Claim:** "Virus-free", "100% secure", "malware-clean", or "production-certified scanner".
- **Truthful Posture:** Displayed file security status is `pending` with `malware_scanner = none_deferred` (real-time virus scanner deferred to enterprise infrastructure).

---

## 7. Emergency Decision Tree & Troubleshooting

```text
                               ┌─────────────────────────────┐
                               │     Emergency Encountered   │
                               └──────────────┬──────────────┘
                                              │
                 ┌────────────────────────────┼────────────────────────────┐
                 ▼                            ▼                            ▼
      [ WAMP Orange / Red ]          [ Backend 8080 Port Conflict ] [ Stale Browser Session ]
                 │                            │                            │
                 ▼                            ▼                            ▼
      1. Wait 15s for MySQL.         1. Run:                      1. Click 'Sign Out'.
      2. Check Port 3306 / 80.          netstat -ano | findstr 8080 2. Close Chrome.
      3. Right-click WAMP ->         2. Terminate stale PID.      3. Reopen & Login.
         Restart All Services.       3. Re-run php -S server.
```

### Problem A: WAMP is Orange or Red
1. Wait 15–30 seconds for MySQL to complete initialization.
2. Check if another MySQL instance (e.g. MariaDB) is competing for port 3306.
3. Left-click WampServer icon -> **Restart All Services**.

### Problem B: Backend Port 8080 in Use
1. Run in PowerShell: `netstat -ano | findstr :8080`
2. Find the PID and terminate: `taskkill /PID <PID> /F`
3. Restart backend server: `& "C:\wamp64\bin\php\php8.2.29\php.exe" -S "127.0.0.1:8080" -t "public"`

### Problem C: Frontend Port 5173 in Use
1. Terminate stale Node processes: `Get-Process node | Stop-Process -Force`
2. Restart Vite: `npm run dev`

### Problem D: Health Check Returns HTTP 500
1. Verify MySQL service is active.
2. Confirm `backend/.env` exists in `backend/` directory.
3. Verify `achievenest_local` is accessible.

---

## 8. Disaster Recovery Emergency Fallback (Phase 18 Package)

If the local database becomes corrupted or needs instant restoration:

1. **Recovery Workspace:** `C:\Users\Admin\Documents\AchieveNest-Defense-Backup\`
2. **Authoritative SQL Dump:** `database\achievenest_local-20260828-143605.sql`
   - `SHA-256: 3D52B8833063847A10E572CE93D6318479CE21B34970A0E8F60EFCBBFE31257A`
3. **Protected Evidence ZIP:** `evidence\evidence-20260828-143605.zip`
   - `SHA-256: 7016C14A4401ADC6B65EA7574FB47706259CB3CB16953CA208DF263FC074EB0E`
4. **Instant Restore Command:**
   ```powershell
   & "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe" -u root -e "DROP DATABASE IF EXISTS achievenest_local; CREATE DATABASE achievenest_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   Get-Content "C:\Users\Admin\Documents\AchieveNest-Defense-Backup\database\achievenest_local-20260828-143605.sql" | & "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe" -u root achievenest_local
   ```
5. **Verify Restored Fingerprint:**
   ```powershell
   cd C:\Users\Admin\Documents\AchieveNest\backend
   & "C:\wamp64\bin\php\php8.2.29\php.exe" spark test:phase18-dr
   ```
   *Expected Result:* `16 / 16 PASSED`.

---

## 9. Pre-Panel Final Verification Checklist (< 3 Minutes)

- [ ] WampServer tray icon is **GREEN**.
- [ ] Backend health returns HTTP 200 (`http://127.0.0.1:8080/api/v1/health`).
- [ ] Frontend loads cleanly at `http://localhost:5173`.
- [ ] Wi-Fi / Internet disconnected (Zero-Supabase offline validation).
- [ ] Student A logs in and opens one PDF evidence item.
- [ ] Chrome zoom level set to 100% or standard presentation scale.
- [ ] Display resolution configured to match projector (e.g. 1366x768 or 1920x1080).
- [ ] Backup folder `AchieveNest-Defense-Backup` confirmed accessible on local drive.
