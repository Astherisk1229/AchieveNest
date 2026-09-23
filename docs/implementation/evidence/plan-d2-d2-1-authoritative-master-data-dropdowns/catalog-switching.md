# Full-Time / Part-Time Catalog Switching — Plan D2 Phase D2-1

## Behavior on Engagement Radio Change
1. When switching from Full-Time (`full_time_faculty`) to Part-Time (`part_time_faculty`), any selected Full-Time rank is cleared from the form state to prevent invalid payload submission.
2. When switching from Part-Time to Full-Time, any selected Part-Time title is cleared.
3. Compatible values (such as when re-selecting the active engagement mode) are safely retained.
4. No silent coercion or cross-mapping occurs between Full-Time ranks and Part-Time titles.
