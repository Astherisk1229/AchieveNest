# HR Navigation & Module Health Check — Environment Specification

- **Platform:** AchieveNest Personnel Evaluation Track
- **Audit Date:** 2026-09-09
- **Environment:** Local Development / Windows / Node.js / Vite / Vitest / PHP 8.2 Backend
- **Frontend Architecture:** React 18, React Router v6, Lucide React, Tailwind-compatible vanilla styling
- **Data Model Baseline:**
  - Plan D Canonical Personnel Model (`personnel_group` [faculty, non_teaching_faculty], `organizational_side` [academic, non_academic])
  - Plan E Academic Rank & Title Catalog (26 Full-Time Ranks, 4 Part-Time Titles)
  - Plan F Phase F0/F1 Evaluation Scale Assignment Baseline
- **Regression Suite:** Vitest v3.2.7 (125 test files, 899 tests passing, 0 failures)
