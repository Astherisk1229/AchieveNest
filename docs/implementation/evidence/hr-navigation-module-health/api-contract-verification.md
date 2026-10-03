# API Contract Verification for HR Endpoints

| HR Endpoint | Method | Expected Consumer Shape | Auth Guard | Backend Status | Verified |
|---|---|---|---|---|---|
| `/hr/personnel` | GET | `Array<PersonnelProfile>` | `hr_staff` | 200 OK | PASS |
| `/hr/dashboard` | GET | `{ stats: object }` | `hr_staff` | 200 OK | PASS |
| `/hr/audit` | GET | `Array<AuditLog>` | `hr_staff` | 200 OK | PASS |
| `/hr/personnel/:id/dean-role` | POST | `{ success: boolean }` | `hr_staff` | 200 OK | PASS |
| `/hr/personnel/:id/master-data` | GET/PUT | `{ data: PersonnelMasterData }` | `hr_staff` | 200 OK | PASS |
| `/hr/personnel/:id/status` | PUT | `{ success: boolean }` | `hr_staff` | 200 OK | PASS |
| `/hr/personnel/:id/classification` | PUT | `{ success: boolean }` | `hr_staff` | 200 OK | PASS |
| `/hr/personnel/:id/eligibility` | GET | `{ is_eligible: boolean, ... }` | `hr_staff` / `dean` | 200 OK | PASS |
