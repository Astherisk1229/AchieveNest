# Phase E3 Evidence: Non-Progression Enforcement

## Strict Non-Progression Principles

1. **Isolation from Full-Time Progression Graph**:
   - `faculty_rank_transitions` contains exactly 26 relational rows connecting Full-Time academic ranks.
   - Part-Time Faculty titles (`PT_PROFESSORIAL_LECTURER`, `PT_ASSISTANT_PROFESSORIAL_LECTURER`, `PT_SENIOR_LECTURER`, `PT_LECTURER`) are strictly excluded from the transitions table.
2. **Rejection in Progression Services**:
   - Attempting to query `FacultyRankProgressionService::getNextRank` with a Part-Time title code or a `part_time_faculty` profile context immediately returns an empty progression list with reason code `part_time_not_eligible`.
3. **UI / Presentation Safeguards**:
   - Frontend components do not render "Next Rank", "Progression Ladder", or "Promotion Eligibility" for personnel whose engagement is `part_time_faculty`.
   - Title assignment is displayed as a qualification-based title rather than a ranked stepping stone.
