# Personnel Evaluation Track — Plan E — Phase E0
## Progression Fact Register & Unresolved Rules Catalog

**Document Reference**: `PFR-NDMU-E0-2026`  
**Phase**: Plan E Phase E0 (Authoritative Rank Source Freeze)  
**Status**: Formal Fact Register (Explicit vs Unresolved)  

---

### 1. Progression Fact Register

| Candidate Progression / Seeding Rule | Source Classification | Authoritative Treatment in Plan E | Justification & Policy Reference |
| --- | --- | --- | --- |
| **1. Normal Faculty Entry Rank**<br>Faculty members enter at `Assistant Instructor` unless an approved qualification mapping applies. | **EXPLICIT** | **Confirmed for E1/E2 baseline** | Tier 4 of `NDMU-DOC-ACAD-RANKS-2026-V1/P1` lists `Assistant Instructor` as the base rank for `AB/BSE/BS or Equivalent`. |
| **2. Board-Passer Fast-Track**<br>Verified professional board passers move directly from `Assistant Instructor` $\rightarrow$ `Senior Instructor`. | **UNRESOLVED** | **Blocked from automated progression in E3** | The source groups board qualifications under Senior Instructor, but does not provide an explicit automated transition policy. Requires signed institutional policy before activation. |
| **3. Sequential Step Progression**<br>Normal rank progression moves one sub-level at a time (e.g., `Instructor I` $\rightarrow$ `Senior Instructor I`, or `Assistant Professor I` $\rightarrow$ `II`). | **EXPLICIT** | **Confirmed for E3 sequential validation** | Numbered sequence I through IV across all middle and senior tiers in official source. |
| **4. Doctoral Jump Rule**<br>Faculty with verified Ph.D./Ed.D. at `Assistant Professor I` can leap directly to `Professor I`. | **UNRESOLVED** | **Blocked / Handled as Manual Exception Only** | Not stated as an automatic jump in the source matrix; requires institutional deliberation and Plan H approval. |
| **5. Degree-Change Tier Qualification Mapping**<br>Earning Master's elevates qualification tier to `Assistant Professor` bracket; Doctoral elevates to `Professor` bracket. | **EXPLICIT (for eligibility)**<br>**UNRESOLVED (for auto-promotion)** | **Permitted as Eligibility Constraint; Blocked as Auto-Promotion** | Tier groupings define qualification ceilings/floors for ranks, but promotion requires full Plan C/F evaluation and Plan H decision. |
| **6. Non-Teaching Faculty + Non-Academic Rank Treatment**<br>Applying Academic Rank progression to Non-Academic personnel. | **NOT PRESENT (UNRESOLVED)** | **Strictly Excluded from Plan E Catalogue** | Non-Academic personnel are governed outside the Dean Academic Annual Review and Academic Rank catalogue. |
| **7. Part-Time Title Progression**<br>Part-Time titles participating in Full-Time rank step progression. | **NOT PRESENT (UNRESOLVED)** | **Strictly Blocked in Plan E** | Part-time titles (`Lecturer`, `Senior Lecturer`, `Assistant Professorial Lecturer`, `Professorial Lecturer`) are static appointment titles without sub-levels (I–IV) or rank progression. |

---

### 2. Guardrails for Subsequent Phases (E1–E4)

1. **Zero Guessing Principle**: Any candidate rule marked `UNRESOLVED` or `NOT PRESENT` shall NOT be coded into automated transitions in Phase E3 or E4.
2. **Read-Only Qualification Reference**: Qualification mappings establish eligibility bounds, not automatic rank re-assignments.
3. **Strict Separation of Catalogue Types**: Full-Time Faculty Ranks (`full_time_faculty_rank`) and Part-Time Faculty Titles (`part_time_faculty_title`) remain completely separate entities in database seeding (Phase E1 & E2).
