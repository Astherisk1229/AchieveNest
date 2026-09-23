# Plan E Phase E5 Evidence: Qualification Mapping Reconciliation

## Cross-Phase Mapping Consistency Matrix

| Qualification Group | Authoritative Qualifications | Full-Time Initial Seed (Phase E4) | Part-Time Canonical Title (Phase E3) |
|---|---|---|---|
| **Doctoral** | PhD, EdD | `PROFESSOR_I` (Professor I) | `PT_PROFESSORIAL_LECTURER` (Professorial Lecturer) |
| **Master's / Professional Graduate** | MA, MS, MAT, MD, LL.B, Priests / Equiv | `ASSISTANT_PROFESSOR` (Assistant Professor) | `PT_ASSISTANT_PROFESSORIAL_LECTURER` (Assistant Professorial Lecturer) |
| **Professional Licensure** | CPA, ENGR, MEDTECH, CHEMIST, NURSE, DVM, ARCHITECT, DMD (+ Licensure Verified) | `SENIOR_INSTRUCTOR` (Senior Instructor) | `PT_SENIOR_LECTURER` (Senior Lecturer) |
| **Baccalaureate / Baseline** | AB, BSE, BS, or Professional degree without verified licensure | `ASSISTANT_INSTRUCTOR` (Assistant Instructor) | `PT_LECTURER` (Lecturer) |

## Invariant Guarantees
- Mapping is 100% deterministic and source-traceable.
- Unverified qualifications return `qualification_not_verified` with zero guessing.
