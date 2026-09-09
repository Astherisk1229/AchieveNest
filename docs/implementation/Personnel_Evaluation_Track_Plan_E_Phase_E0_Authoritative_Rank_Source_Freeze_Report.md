# Personnel Evaluation Track — Plan E — Phase E0
# Authoritative Rank Source Freeze Report

**Track:** Personnel Evaluation Track  
**Plan:** Plan E — Faculty Rank Catalog, Seeding & Progression Rules  
**Phase:** Phase E0 — Authoritative Rank Source Freeze  
**Document Status:** Approved & Formally Frozen  
**Execution Timestamp:** 2026-09-08T23:18:45+08:00  

---

## 1. Executive Summary & Purpose

Phase E0 (**Authoritative Rank Source Freeze**) is a read-only source-governance phase that establishes the frozen source matrix for all subsequent phases in Plan E (E1 Full-Time Ranks Seed, E2 Part-Time Titles Seed, E3 Progression Rules Engine, and E4 Validation & Closure).

This phase establishes the verbatim catalogue of official NDMU Academic Ranks, Part-Time Faculty Titles, and Qualification Standards, strictly prohibiting any inference, guessing, or automated rank elevation without explicit institutional authority.

---

## 2. Governing Boundaries

| Plan | Scope Ownership | Strict Architectural Invariants |
| --- | --- | --- |
| **Plan D** | Personnel identity, master data classification, faculty engagement, employment status, and Dean Annual Review eligibility. | Plan E does not alter master data or bypass Dean Annual Review clearance. |
| **Plan E** | Faculty rank/title catalogue, qualification mappings, seed migrations, progression validation rules, and approved exceptions. | Plan E does NOT score evaluations, auto-promote personnel, or make rank progression decisions. |
| **Plan F / F1** | Evaluation scale catalogue, criteria scoring rules, and dynamic portfolio configuration. | Plan E references scale criteria but does not compute portfolio scores. |
| **Plan G** | Reviewer routing, assignment, and evaluation workspace. | Plan E provides valid rank metadata to reviewer workflows. |
| **Plan H** | Final evaluation deliberation, Institutional Promotion Board decisions, and official rank updates. | Plan H is the sole authority permitted to mutate personnel `current_rank_title` upon promotion approval. |

---

## 3. Authoritative Source Inventory & Provenance

- **Document ID**: `NDMU-DOC-ACAD-RANKS-2026-V1`
- **Document Title**: *Notre Dame of Marbel University — Official Academic Ranks, Faculty Titles & Qualification Standards Matrix*
- **Custodian**: Office of Human Resource Development (HRD), Notre Dame of Marbel University
- **Approval Date / Version**: Academic Year 2026–2027 / Release Edition 1.0
- **Document SHA-256**: `c829e1d305b8a071d02c89f5c22e434f41d99e039474779872590740a6b18991`

---

## 4. Frozen Verbatim Rank & Title Matrix

### 4.1 Full-Time Faculty Academic Ranks (`full_time_faculty`)

Total: 26 discrete rank/level entities across 4 qualification tiers:

1. **Doctoral Tier (`Ph.D./Ed.D.`)**:
   - `University Professor` (Top / Unnumbered)
   - `University Professor IV`, `University Professor III`, `University Professor II`, `University Professor I`
   - `Professor IV`, `Professor III`, `Professor II`, `Professor I`
2. **Master's / Professional / Religious Tier (`MA/MS/MAT/MD/LL.B./Priests or Equivalent`)**:
   - `Associate Professor` (Unnumbered)
   - `Associate Professor IV`, `Associate Professor III`, `Associate Professor II`, `Associate Professor I`
   - `Assistant Professor` (Unnumbered)
   - `Assistant Professor IV`, `Assistant Professor III`, `Assistant Professor II`, `Assistant Professor I`
3. **Professional Board / Licensure Tier (`CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/SOCIAL WORKER/ARCHITECT/DMD`)**:
   - `Senior Instructor` (Unnumbered)
   - `Senior Instructor IV`, `Senior Instructor III`, `Senior Instructor II`, `Senior Instructor I`
4. **Baccalaureate Baseline Tier (`AB/BSE/BS or Equivalent`)**:
   - `Instructor I`
   - `Assistant Instructor` (Baseline Entry)

### 4.2 Part-Time Faculty Titles (`part_time_faculty`)

Total: 4 discrete appointment titles across 4 qualification tiers:

1. **Doctoral Tier (`Ph.D./Ed.D.`)**: `Professorial Lecturer`
2. **Master's / Professional / Religious Tier (`MA/MS/MAT/MD/LL.B./Priests or Equivalent`)**: `Assistant Professorial Lecturer`
3. **Professional Board / Licensure Tier (`CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/ARCHITECT/DMD`)**: `Senior Lecturer`
4. **Baccalaureate Baseline Tier (`AB/BSE/BS or Equivalent`)**: `Lecturer`

---

## 5. Progression Fact Register (Explicit vs Unresolved)

| Rule / Transition | Classification | Treatment in Plan E (E1–E4) |
| --- | --- | --- |
| **Normal Entry Rank** | **EXPLICIT** | Baseline entry is `Assistant Instructor` for baccalaureate holders. |
| **Sequential Step Progression** | **EXPLICIT** | Sequential sub-levels I $\rightarrow$ II $\rightarrow$ III $\rightarrow$ IV verified for standard progression. |
| **Board-Passer Fast-Track** | **UNRESOLVED** | Blocked from automated progression in E3 pending written HR fast-track policy. |
| **Doctoral Leap Exception** | **UNRESOLVED** | Blocked from automated transition; requires manual Plan H Institutional Board exception. |
| **Degree-Change Elevation** | **EXPLICIT (Ceiling/Floor)**<br>**UNRESOLVED (Auto-Promotion)** | Sets qualification eligibility bracket; does NOT automatically mutate rank without evaluation. |
| **Non-Academic Personnel Treatment** | **NOT PRESENT** | Strictly excluded from Plan E Faculty Rank catalogue. |
| **Part-Time Title Progression** | **NOT PRESENT** | Strictly excluded; Part-Time titles are static appointment titles without rank step advancement. |

---

## 6. Frozen Data-Model Design Decisions for E1/E2

1. **Separate Catalogue Types**: `academic_ranks` (`catalogue_type = 'full_time_rank'`) and `faculty_titles` (`catalogue_type = 'part_time_title'`) shall be stored as distinct relational entities with unique stable keys (e.g., `FULL_TIME_ASST_PROF_I`, `PART_TIME_SR_LECTURER`).
2. **Decoupled from Profile State**: The rank catalogue is an immutable reference dimension; it does not directly alter `personnel_profiles.position_title` or `personnel_profiles.current_rank_title`.
3. **Zero Inference Policy**: Missing sub-levels (such as `Instructor II`, `Instructor III`, or `Assistant Instructor I–IV` which are not in the source) shall NOT be fabricated or interpolated.

---

## 7. Deliverables & Evidence Package

All frozen artefacts are stored in `docs/implementation/evidence/plan-e-e0-freeze/`:

- [`plan-e-rank-source-inventory.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-e-e0-freeze/plan-e-rank-source-inventory.md)
- [`plan-e-rank-title-source-matrix.csv`](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-e-e0-freeze/plan-e-rank-title-source-matrix.csv)
- [`plan-e-rank-title-source-matrix.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-e-e0-freeze/plan-e-rank-title-source-matrix.md)
- [`plan-e-progression-fact-register.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-e-e0-freeze/plan-e-progression-fact-register.md)
- [`checksum-manifest.md`](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-e-e0-freeze/checksum-manifest.md)

---

## 8. Exit Gate Declaration

Phase E0 is fully satisfied: the source reference is frozen verbatim, all qualification mappings and rank/title strings are traceably catalogued, unresolved items are quarantined, and zero database mutations were introduced.

$$\mathbf{PHASE\ E0\ COMPLETE\ —\ AUTHORITATIVE\ RANK\ SOURCE\ FROZEN}$$

**Ready for Next Phase**: **Phase E1 — Full-Time Faculty Rank Seed Migration**.
