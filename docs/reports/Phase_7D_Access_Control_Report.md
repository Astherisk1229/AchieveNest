# Phase 7D — Report Access Control and Permissions Report
## Role-Based Access Control, Program-Level Scope Enforcement, and Export Security

**Domain:** Report Access Control & Authorization  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 23:05:00 UTC+08:00  

---

## 1. Role-Based Report Permissions Matrix

| User Role | Candidate Summary Report | Detailed Scoring Report | CSV / Spreadsheet Export | Verification Audit | Deliberation Notes / State |
|---|:---:|:---:|:---:|:---:|:---:|
| **OSAD Staff** (`osad_staff`) | **Campus-Wide** | **Campus-Wide** | **Allowed (Full)** | **Allowed** | **Full Access (Edit/View)** |
| **College Dean** (`dean`) | **College Scope** | **College Scope** | **Allowed (College)** | **View Only** | **View Only** |
| **Program Coordinator** (`program_coordinator`) | **Program Scope** | **Program Scope** | **Allowed (Program)**| **View Only** | **View Only** |
| **Student** (`student`) | **DENIED (403)** | **Own Score Only** | **DENIED (403)** | **DENIED (403)** | **DENIED (403)** |
| **Unauthenticated** | **DENIED (401)** | **DENIED (401)** | **DENIED (401)** | **DENIED (401)** | **DENIED (401)** |

---

## 2. Server-Side Scope Policy Verification

Program Coordinator requests to export candidates are automatically filtered by `student_program_enrollments.academic_program_id IN (assigned_program_ids)`. Any URL query tampering attempting to access candidates outside assigned academic programs is rejected with HTTP 403 `FORBIDDEN`.
