# Part-Time Faculty Title Dropdown Binding — Plan D2 Phase D2-1

## Summary
When `faculty_engagement = 'part_time_faculty'`, the Academic Rank/Title selector dynamically binds to the authoritative Plan E Part-Time title catalog sourced from `personnelMasterDataService.getPartTimeTitles()` / `partTimeFacultyTitleService.fetchPartTimeTitles()`.

## Canonical Part-Time Titles
1. `Professorial Lecturer` (`PT_PROFESSORIAL_LECTURER`)
2. `Assistant Professorial Lecturer` (`PT_ASSISTANT_PROFESSORIAL_LECTURER`)
3. `Senior Lecturer` (`PT_SENIOR_LECTURER`)
4. `Lecturer` (`PT_LECTURER`)

## Catalog Isolation
- Full-Time ranks are completely excluded when Faculty Status / Engagement is Part-Time.
- Part-Time titles are completely excluded when Faculty Status / Engagement is Full-Time.
