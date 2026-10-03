# Phase 3 Deliverable: Canonical Data Source & Field Map

**Document Identifier:** `docs/audits/osad-award-phase3-data-source-map.md`  
**Phase:** 3 of 8 (Eligibility Gate Engine)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **DATA SOURCES AUDITED & MAPPED**

---

## 1. Executive Summary

This document maps all canonical persisted database fields, normalization algorithms, and fallback resolution rules used by the Eligibility Gate Engine.

---

## 2. Canonical Field Mapping Table

| Domain Concept | Authoritative DB Source | Table Name | Data Type | Canonical Values / Normalization Rules | Fallback Source |
|---|---|---|---|---|---|
| **Award ID** | `id` | `award_definitions` | `CHAR(36)` | Canonical UUID | N/A |
| **Award Code** | `code` | `award_definitions` | `VARCHAR(50)` | Uppercase alphanumeric (e.g. `NOTRE_DAME_AWARD`) | N/A |
| **Award Status** | `status` | `award_definitions` | `VARCHAR(20)` | `'active'`, `'draft'`, `'archived'` | N/A |
| **Graduation Gate** | `graduating_only` | `award_definitions` | `TINYINT(1)` | `1` = Graduating Only, `0` = Open Pool | N/A |
| **Sex Gate** | `gender_restriction` | `award_definitions` | `VARCHAR(20)` | `'female'`, `'male'`, or `NULL` (Normalized to `FEMALE`, `MALE`, `null`) | N/A |
| **Student Identity** | `id` | `profiles` | `CHAR(36)` | Canonical UUID (`account_type = 'student'`) | N/A |
| **Student Active State** | `status` | `profiles` | `VARCHAR(20)` | `'active'` (Rejects `'suspended'`, `'inactive'`, `'archived'`) | N/A |
| **Official Student Sex** | `gender` / `Sex` | `profiles` | `VARCHAR(20)` | `'Female'`, `'Male'` (Normalized via `normalizeSex()` to `FEMALE`, `MALE`) | N/A (Never client-supplied) |
| **Student Year Level** | `year_level` | `student_program_enrollments` | `VARCHAR(20)` | `'4'`, `'4th Year'`, `'Fourth Year'`, `'Graduating'`, `'Senior'` = Graduating (`true`); `'1'`, `'2'`, `'3'` = Undergrad (`false`) | `profiles.year_level` |

---

## 3. Data Integrity & Missing Data Policy

- **Missing Year Level on Graduating-Only Award**: Excluded with `GRADUATING_STATUS_MISSING` (Never assumed `true`).
- **Missing Sex on Sex-Gated Award**: Excluded with `SEX_VALUE_MISSING`.
- **Missing Sex on Non-Sex-Gated Award**: Passed (Sex is irrelevant to non-sex-gated awards).
- **Client Input Isolation**: The engine queries only persisted server-side records and ignores untrusted client payloads.
