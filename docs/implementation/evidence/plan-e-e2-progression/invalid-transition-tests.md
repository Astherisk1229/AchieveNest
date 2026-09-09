# Plan E Phase E2 — Invalid Transition Rejection Matrix

| Transition Attempt | Expected Outcome | Reason Code | Status |
| --- | --- | --- | --- |
| **Multi-step Jump**: `INSTRUCTOR_I` $\rightarrow$ `ASSISTANT_PROFESSOR_I` | **REJECTED** (`allowed: false`) | `invalid_transition` | **PASSED** |
| **Multi-step Jump**: `ASSISTANT_PROFESSOR_I` $\rightarrow$ `PROFESSOR_IV` | **REJECTED** (`allowed: false`) | `invalid_transition` | **PASSED** |
| **Reverse Progression**: `PROFESSOR_II` $\rightarrow$ `PROFESSOR_I` | **REJECTED** (`allowed: false`) | `invalid_transition` | **PASSED** |
| **Same Rank**: `PROFESSOR_I` $\rightarrow$ `PROFESSOR_I` | **REJECTED** (`allowed: false`) | `same_rank_transition` | **PASSED** |
| **Terminal Rank Advance**: `UNIVERSITY_PROFESSOR` $\rightarrow$ `UNIVERSITY_PROFESSOR_IV` | **REJECTED** (`allowed: false`) | `no_next_rank` | **PASSED** |
| **PhD Exception without Verified PhD**: `ASSISTANT_PROFESSOR_I` $\rightarrow$ `PROFESSOR_I` (`has_verified_phd: false`) | **REJECTED** (`allowed: false`) | `qualification_exception_not_satisfied` | **PASSED** |
| **Part-Time Context**: Any transition with `faculty_engagement = 'part_time_faculty'` | **REJECTED** (`allowed: false`) | `part_time_not_eligible` | **PASSED** |
| **Non-Teaching Context**: Any transition with `personnel_group = 'non_teaching_faculty'` | **REJECTED** (`allowed: false`) | `unsupported_personnel_group` | **PASSED** |
| **Unknown Rank Code**: `UNKNOWN_RANK_XYZ` $\rightarrow$ Any | **REJECTED** (`allowed: false`) | `rank_not_found` | **PASSED** |
