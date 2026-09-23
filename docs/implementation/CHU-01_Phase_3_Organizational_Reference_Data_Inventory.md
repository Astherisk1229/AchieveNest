# CHU-01 Phase 3 — Organizational Reference Data Inventory

**Document:** `CHU-01_Phase_3_Organizational_Reference_Data_Inventory.md`
**Parent Plan:** CHU-01 — Core System Stabilization, Personnel Rules, and Demo Readiness
**Phase:** Phase 3 — Organizational and Demo Data Preparation
**Date:** 2026-09-10
**Status:** **AUDITED, FROZEN & COMPLETE**

---

## 1. Executive Summary

This reference data inventory audits and documents all institutional entities (colleges, academic programs, administrative units, student enrollments, personnel affiliations, and role assignments) in AchieveNest.

All institutional structures are proven active, non-orphaned, and compliant with canonical NDMU organizational taxonomy.

---

## 2. Institutional College Inventory (`colleges`)

| College Code | College Name | Description / Scope | Status | Active Programs Count |
|---|---|---|---|---|
| **CET** | College of Engineering and Technology | Engineering, Computing, and Architecture Disciplines | `active` | 4 (BSCS, BSIT, BSCE, BSEE) |
| **CBA** | College of Business and Accountancy | Business, Management, and Accountancy Programs | `active` | 3 (BSA, BSBA-FM, BSBA-MM) |
| **CAS** | College of Arts and Sciences | Liberal Arts, Social Sciences, and Natural Sciences | `active` | 3 (AB-COMM, AB-POLSCI, BS-PSYCH) |
| **CTE** | College of Teacher Education | Teacher Education and Pedagogical Formation | `active` | 2 (BSED, BEED) |
| **CHS** | College of Health Sciences | Nursing and Allied Health Professions | `active` | 2 (BSN, BSMT) |
| **CEAC** | College of Engineering, Architecture, and Computing | Specialized Computing & Architecture Division | `active` | Shared Engineering/Computing |

---

## 3. Academic Program Inventory (`academic_programs`)

| Program Code | Program Name | Parent College | Degree Level | Status | Demo Student Assigned |
|---|---|---|---|---|---|
| **BSCS** | Bachelor of Science in Computer Science | CET | `undergraduate` | `active` | Test Students |
| **BSIT** | Bachelor of Science in Information Technology | CET | `undergraduate` | `active` | Test Students |
| **BSCE** | Bachelor of Science in Civil Engineering | CET | `undergraduate` | `active` | None |
| **BSEE** | Bachelor of Science in Electrical Engineering | CET | `undergraduate` | `active` | None |
| **BSA** | Bachelor of Science in Accountancy | CBA | `undergraduate` | `active` | **Student A (`demo.student.a`)** |
| **BSBA-FM** | BS in Business Administration - Financial Management | CBA | `undergraduate` | `active` | **Student B (`demo.student.b`)** |
| **BSBA-MM** | BS in Business Administration - Marketing Management | CBA | `undergraduate` | `active` | None |
| **AB-COMM** | Bachelor of Arts in Communication | CAS | `undergraduate` | `active` | None |
| **AB-POLSCI** | Bachelor of Arts in Political Science | CAS | `undergraduate` | `active` | None |
| **BS-PSYCH** | Bachelor of Science in Psychology | CAS | `undergraduate` | `active` | None |
| **BSED** | Bachelor of Secondary Education | CTE | `undergraduate` | `active` | None |
| **BEED** | Bachelor of Elementary Education | CTE | `undergraduate` | `active` | None |
| **BSN** | Bachelor of Science in Nursing | CHS | `undergraduate` | `active` | None |
| **BSMT** | Bachelor of Science in Medical Technology | CHS | `undergraduate` | `active` | None |

---

## 4. Administrative & Non-Academic Unit Inventory (`administrative_units`)

| Unit Code | Official Unit Name | Unit Type | Status | Linked Demo Persona |
|---|---|---|---|---|
| **HR** | Human Resources Office | `central_office` | `active` | **HR Admin (`demo.hr.admin`)** |
| **OSAD** | Student Affairs & Development | `central_office` | `active` | **OSAD Admin (`demo.osad.admin`)** |
| **PPS** | Physical Plant & Security | `central_office` | `active` | None |
| **CM** | Campus Ministry | `central_office` | `active` | None |
| **CEPE** | Community Extension and Peace & Environment | `central_office` | `active` | None |
| **SC_NSTP** | Socio-Cultural & NSTP | `central_office` | `active` | None |
| **CMRE** | CMRE | `central_office` | `active` | None |
| **IRO** | International Relations | `central_office` | `active` | None |
| **IPO** | Intellectual Property Office | `central_office` | `active` | None |
| **ATH** | Athletics and Sports | `central_office` | `active` | None |
| **REG** | Office of the Registrar | `central_office` | `active` | **Staff Non-Acad (`demo.nonacademic.personnel`)** |

---

## 5. Organizations & Moderators (`organizations`)

| Org Code | Organization Name | Parent College / Unit | Scope | Category | Moderator Assigned |
|---|---|---|---|---|---|
| **CSS** | Computer Science Society | CET | `college` | `academic_college` | Academic Faculty Moderator |
| **DEMO_JPIA** | Demo Junior Philippine Institute of Accountants | CBA | `college` | `academic_college` | **Demo Moderator (`demo.moderator`)** |

---

## 6. Structural Reconciliation Decisions

| Current Entity | Parent Relationship | Verified Source | Required Action | Decision |
|---|---|---|---|---|
| College of Business and Accountancy (CBA) | University Academic Division | Institutional Master Catalog | Retain | **KEEP** |
| BSA & BSBA-FM Programs | Assigned to CBA | Institutional Master Catalog | Retain | **KEEP** |
| Student A Enrollment | Assigned to BSA (CBA) | Synthetic Demo Plan | Retain | **KEEP** |
| Student B Enrollment | Assigned to BSBA-FM (CBA) | Synthetic Demo Plan | Retain | **KEEP** |
| College Dean (CBA) | Assigned to CBA | Synthetic Demo Plan | Retain | **KEEP** |
| Coordinator A | Assigned to BSA | Synthetic Demo Plan | Retain | **KEEP** |
| Coordinator B | Assigned to BSBA-FM | Synthetic Demo Plan | Retain | **KEEP** |
| Moderator | Assigned to DEMO_JPIA | Synthetic Demo Plan | Retain | **KEEP** |
| HR Office | Central Administrative Unit | Institutional Master Catalog | Retain | **KEEP** |
