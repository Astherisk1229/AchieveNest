# Authoritative Legacy Mapping Rule Freeze

| Case ID | Legacy Group Input | Institutional Assignment | Resolved Group | Resolved Side | Resolved Code | Resolution Status |
|---|---|---|---|---|---|---|
| LEG-01 | `non_teaching_personnel` | `administrative_unit_id` present (no College) | `non_teaching_faculty` | `non_academic` | `NON_TEACHING_FACULTY_NON_ACADEMIC` | Supported |
| LEG-02 | `non_teaching_personnel` | `college_id` present (no Admin Unit) | `non_teaching_faculty` | `academic` | `NON_TEACHING_FACULTY_ACADEMIC` | Supported |
| LEG-03 | `non_teaching_personnel` | None (no College, no Admin Unit) | `null` | `null` | `null` | **UNRESOLVED** |
| LEG-04 | `non_teaching_personnel` | Conflicting (both College & Admin Unit) | `null` | `null` | `null` | **UNRESOLVED** |
| LEG-05 | `non_teaching_personnel` | Active Creation API (`validatePair`) | N/A | N/A | N/A | **REJECTED (422)** |
