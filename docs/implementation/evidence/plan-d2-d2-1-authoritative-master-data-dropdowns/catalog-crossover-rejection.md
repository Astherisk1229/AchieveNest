# Catalog Crossover Rejection Audit — Plan D2 Phase D2-1

## Crossover Prevention Rules
1. **Full-Time + Part-Time Title**:
   - Condition: `faculty_engagement = 'full_time_faculty'` and `current_rank_title` is in `['Professorial Lecturer', 'Assistant Professorial Lecturer', 'Senior Lecturer', 'Lecturer']`.
   - Result: 422 Error with code `CATALOG_CROSSOVER_REJECTED` ("Part-Time faculty title cannot be assigned to Full-Time faculty.").
2. **Part-Time + Full-Time Rank**:
   - Condition: `faculty_engagement = 'part_time_faculty'` and `current_rank_title` is not in the Part-Time title list.
   - Result: 422 Error with code `CATALOG_CROSSOVER_REJECTED` ("Full-Time academic rank cannot be assigned to Part-Time faculty. Only Part-Time titles are allowed.").
