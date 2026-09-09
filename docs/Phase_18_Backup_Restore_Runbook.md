# AchieveNest — Phase 18 Backup & Disaster Recovery Runbook

> **Scope:** Operational disaster recovery, offline backup creation, integrity verification, and fixture restoration for AchieveNest on the local WAMP defense stack.  
> **Environment:** Windows 10/11 x64, WampServer 3.x (Apache 2.4.65, MySQL 8.4.7, PHP 8.2.29), Node.js v24.13.1.

---

## 1. Backup Directory Structure

All local defense backups are created outside repository tracking in:
```text
C:\Users\Admin\Documents\AchieveNest-Defense-Backup\
├── database\        # SQL schema & data dumps (achievenest_local-*.sql)
├── evidence\        # Compressed evidence archives (evidence-*.zip)
├── manifests\       # Checksum and inventory manifests
└── templates\       # Sanitized environment configuration templates
```

---

## 2. Standard Backup Creation Procedure

### Step 1: Export Local MySQL Database (`achievenest_local`)
Run from PowerShell:
```powershell
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDir = "C:\Users\Admin\Documents\AchieveNest-Defense-Backup"
$MysqldumpBin = "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysqldump.exe"

& $MysqldumpBin `
    --host=127.0.0.1 `
    --port=3306 `
    -u root `
    --single-transaction `
    --triggers `
    --default-character-set=utf8mb4 `
    achievenest_local `
    | Set-Content -Path "$BackupDir\database\achievenest_local-$Timestamp.sql" -Encoding utf8
```

### Step 2: Archive Protected Evidence Storage
```powershell
$EvidenceSource = "C:\Users\Admin\Documents\AchieveNest\backend\writable\uploads\evidence"
Compress-Archive -Path "$EvidenceSource\*" -DestinationPath "$BackupDir\evidence\evidence-$Timestamp.zip" -Force
```

### Step 3: Compute Cryptographic Hashes
```powershell
Get-FileHash "$BackupDir\database\achievenest_local-$Timestamp.sql" -Algorithm SHA256
Get-FileHash "$BackupDir\evidence\evidence-$Timestamp.zip" -Algorithm SHA256
```

---

## 3. Disaster Recovery / Restoration Procedure

If the defense laptop needs to restore the working database and evidence from a backup:

```text
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  1. Verify WAMP MySQL  │ ───> │  2. Create/Recreate DB  │ ───> │  3. Restore SQL Dump   │
│  (Port 3306 Running)   │      │   (achievenest_local)  │      │  (mysql.exe CLI)       │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                             │
                                                                             ▼
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  6. Validate Persona   │ <─── │ 5. Extract Evidence    │ <─── │ 4. Verify Reference    │
│  Logins & Workflows    │      │ (uploads/evidence/)    │      │ Fingerprint (SHA-256)  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

### Step 1: Recreate Target Database
```powershell
$MysqlBin = "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe"
& $MysqlBin -u root -e "DROP DATABASE IF EXISTS achievenest_local; CREATE DATABASE achievenest_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Step 2: Restore Database Dump
```powershell
$SqlDumpPath = "$BackupDir\database\achievenest_local-$Timestamp.sql"
Get-Content -Path $SqlDumpPath | & $MysqlBin -u root achievenest_local
```

### Step 3: Restore Evidence Files
```powershell
$EvidenceZip = "$BackupDir\evidence\evidence-$Timestamp.zip"
$EvidenceDest = "C:\Users\Admin\Documents\AchieveNest\backend\writable\uploads\evidence"

if (-not (Test-Path $EvidenceDest)) { New-Item -ItemType Directory -Path $EvidenceDest -Force | Out-Null }
Expand-Archive -Path $EvidenceZip -DestinationPath $EvidenceDest -Force
```

### Step 4: Verify Restoration via Automated Test
```powershell
cd C:\Users\Admin\Documents\AchieveNest\backend
& "C:\wamp64\bin\php\php8.2.29\php.exe" spark test:phase18-dr
```
Expected output: `Phase 18 Disaster Recovery Test Result: 16 / 16 PASSED`.

---

## 4. Authoritative Verification Baselines

| Verification Item | Authoritative Baseline Target |
| :--- | :--- |
| **Base Tables** | `57` base tables |
| **Reference Roles** | `7` authoritative system roles |
| **Reference Colleges** | `5` accredited colleges |
| **Academic Programs** | `14` active academic programs |
| **Administrative Units** | `19` administrative units |
| **Portfolio Categories** | `9` categories |
| **Portfolio Subcategories** | `57` subcategories |
| **Award Definitions** | `15` institutional awards |
| **Reference Fingerprint (SHA-256)** | `a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f` |
| **Demo Personas** | `10` active identities (`demo.*@ndmu.edu.ph`) |
| **Demo Credentials** | Maintained in local ignored environment (`backend/.env`) |
| **Evidence Physical Files** | Checksums match database metadata (`student_portfolio_evidence` & `personnel_accomplishment_evidence`) |

---

## 5. Security & Isolation Rules

- **Zero Plaintext Secrets:** Passwords and JWT secrets are never exported in backup filenames, manifests, or runbooks.
- **Isolated Testing:** Disaster recovery testing must always restore into temporary databases (`achievenest_restore_test`) and temporary folders (`writable/restore_test/`) to guarantee the original working environment is not disturbed.
- **No Internet Dependency:** Backup, restore, and integrity checks are 100% executable offline using local WAMP tools and PowerShell.
