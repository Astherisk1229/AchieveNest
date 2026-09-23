# Phase 15 Backend Regression Sequence

This document outlines the authoritative sequence to execute the complete local backend regression suite before prefinal defense.

## 1. Prerequisites
- Local MySQL 8.4.7 running on port 3306 with database `achievenest_local`.
- PHP 8.3.28 (WAMP environment: `C:\wamp64\bin\php\php8.3.28\php.exe`).
- Environment configuration: `backend/.env` configured with local credentials and demo secret.

---

## 2. Deterministic Regression Sequence

```powershell
cd backend

# Step 1: Deterministic Baseline Demo Reset
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark demo:reset

# Step 2: Phase 7 Local Authentication & Session Registry
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark test:phase7-auth

# Step 3: Phase 8 Centralized CodeIgniter Authorization Matrix
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark test:phase8-authz

# Step 4: Phase 9 Protected Local Evidence File Storage
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark test:phase9-storage

# Step 5: Phase 11 Permanent Reference Data & Fingerprint
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark test:phase11-reference

# Step 6: Phase 12 Synthetic Demo Personas & Scenarios
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark test:phase12-demo

# Step 7: Phase 13 Step 4 Portfolio & Verification Lifecycle
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark test:phase13-step4

# Step 8: Phase 14 Award Evaluation Engine & Dean Nominations
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark test:phase14-awards

# Step 9: Phase 14 Remaining Local Defense Workflows
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark test:phase14-workflows

# Step 10: Master Phase 15 Aggregator & Orphan Checks
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark test:phase15-backend

# Step 11: Local Defense PHPUnit Suite
& "C:\wamp64\bin\php\php8.3.28\php.exe" vendor/bin/phpunit -c phpunit.local-defense.xml

# Step 12: Backend Routes Consistency Check
& "C:\wamp64\bin\php\php8.3.28\php.exe" spark routes
```

Alternatively, run the automated master script:
```powershell
.\scripts\phase15-backend-regression.ps1
```
