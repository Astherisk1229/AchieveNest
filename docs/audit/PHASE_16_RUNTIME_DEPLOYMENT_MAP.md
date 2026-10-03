# AchieveNest — Phase 16: Local-Defense Runtime Deployment Map

> **Scope:** Architecture map of the local runtime deployment topology, execution ports, process isolation, data paths, and zero-cloud constraints.  
> **Status:** `PASSED / COMPLETED`  
> **Target Branch:** `audit/project-architecture-linkage`  
> **Starting HEAD:** `f97453d`

---

# 1. Deployment Topology

AchieveNest operates as a 100% self-contained local defense architecture with three distinct runtime process boundaries:

```mermaid
flowchart TD
    subgraph ClientBrowser [Client Browser Environment]
        UI[React 18 SPA / Vite Client]
    end

    subgraph HostLocalLoopback [Local Loopback Network (127.0.0.1)]
        ViteServer[Vite Dev Server :5173]
        CI4Server[PHP 8.2 Built-in Web Server :8080]
        MySQLServer[MySQL 8.4.7 Database Server :3306]
    end

    subgraph HostFileSystem [Local Protected Filesystem]
        Uploads[backend/writable/uploads/]
        SessionStorage[backend/writable/session/]
        ArchiveDB[archive/database/]
    end

    UI <-->|HTTP / JSON (Local)| ViteServer
    UI <-->|REST API / CORS (127.0.0.1:8080)| CI4Server
    CI4Server <-->|TCP / MySQLi Protocol (127.0.0.1:3306)| MySQLServer
    CI4Server <-->|Stream / Binary I/O| Uploads
    CI4Server <-->|File Lock / Temp I/O| SessionStorage
```

---

# 2. Process & Port Matrix

| Process Name | Binary / Runtime | Working Directory | Bound Host / Port | Network Protocol | Failure Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Dev Server** | Node.js v24.13.1 + Vite v8.1.5 | `frontend/` | `localhost:5173` | HTTP / HMR WebSockets | Reload / reconnect on fail |
| **Backend REST API** | PHP v8.2.29 CLI Server | `backend/public/` | `127.0.0.1:8080` | HTTP / JSON | Re-probe / 500 error |
| **Database Server** | MySQL Community Server v8.4.7 | `C:\wamp64\bin\mysql\...` | `127.0.0.1:3306` | MySQL Native / TCP | Health check reports error |
| **Evidence Storage** | PHP FileSystem Stream Driver | `backend/writable/uploads/` | Local I/O | Binary Stream | 404 / 403 on invalid file |

---

# 3. Data Ingestion & Storage Paths

1. **Authentication Token Storage:** Browser `sessionStorage` / `localStorage` stores Bearer session token; backend validates against `local_auth_sessions` table in MySQL.
2. **Physical Evidence Persistence:** Files uploaded via `POST /api/v1/portfolio/{id}/evidence` are validated for size/MIME, written to `backend/writable/uploads/`, and registered in `evidence_files` with SHA-256 integrity hash.
3. **Protected Evidence Streaming:** Files requested via `GET /api/v1/evidence/{type}/{id}` are checked against `EvidencePolicy`; authorized requests stream bytes with `Content-Type` headers directly from local disk.

---

# 4. Zero-Cloud Defense Boundary

- **External Network Access:** Completely disabled during testing; system operates identically in full airplane / offline mode.
- **Supabase Cloud Calls:** Exactly 0 network calls (verified by `supabaseZeroCallLocalDefense.test.js`).
- **Cloud CDNs:** All vendor libraries (React, Lucide icons, Tailwind, Axios) are bundled into local assets (`dist/assets/`).
