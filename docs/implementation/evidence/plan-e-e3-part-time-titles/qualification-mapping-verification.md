# Phase E3 Evidence: Qualification Mapping & Deterministic Resolution

## Authoritative Qualification Mapping Matrix

| Qualification Group | Authoritative Degrees / Licensures | Resolved Part-Time Title | Reason Code |
|---|---|---|---|
| **Doctoral** | PhD, EdD | `PT_PROFESSORIAL_LECTURER` (Professorial Lecturer) | `resolved_doctoral` |
| **Master's / Professional Graduate** | MA, MS, MAT, MD, LL.B, Priests / Equiv | `PT_ASSISTANT_PROFESSORIAL_LECTURER` (Assistant Professorial Lecturer) | `resolved_masters_professional` |
| **Professional Licensure** | CPA, ENGR, MEDTECH, CHEMIST, NURSE, DVM, ARCHITECT, DMD | `PT_SENIOR_LECTURER` (Senior Lecturer) | `resolved_licensed_professional` |
| **Baccalaureate** | AB, BSE, BS | `PT_LECTURER` (Lecturer) | `resolved_baccalaureate` |

## Strict Resolution Boundaries
1. **Unverified Qualifications**:
   - Return status: `unresolved`
   - Reason code: `qualification_not_verified`
   - Title returned: `null` (No guessing or default assignment)
2. **Unmapped Qualifications**:
   - Return status: `unresolved`
   - Reason code: `qualification_unmapped`
   - Title returned: `null`
3. **Personnel Scope Enforcement**:
   - Full-time Faculty passed to resolver: Rejected with reason `not_part_time_faculty`.
   - Non-Teaching Staff / personnel passed to resolver: Rejected with reason `unsupported_personnel_group`.
4. **Position Independence**:
   - Changes in administrative appointments, position titles, or honorarium do not alter the qualification-resolved title.
