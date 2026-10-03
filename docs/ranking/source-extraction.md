# Official ranking criteria source extraction

This is the implementation authority extracted directly from the table cells and merged headers in the two supplied DOCX files. The files were read as OOXML. Visual PNG rendering was unavailable because the local Python launcher has no installed runtime and LibreOffice is not installed.

## Administrators Ranking Scale — Faculty

Source: `Administrators_Ranking_Scale_Faculty_Intuitive_Breakdown_Tables.docx`
Tables extracted: 12

1. **Degrees:** Ph.D. Holder, completed Ph.D., 40 points, maximum 40. Ph.D. Units: 3/6/9/12/15+ units → 2/4/6/8/10, maximum 10. MA Holder, completed MA, 20 points, maximum 20. MA Units: 3 through 30+ in three-unit steps → 1 through 10, maximum 10.
2. **Professional membership:** Member, 5 per membership; Officer/Position Held, 10; category maximum 10. Organization identity and evidence are required.
3. **Seminar/training:** grouped Activity Information columns (activity, venue, date) and Equivalent Points by Level: In-house 3, City/Provincial 4, Regional 6, National 8, International 10; maximum 20.
4. **Guest lecturer/consultant/judge/resource person:** Sponsoring Organization (NDMU 1, External/Other Schools 2); Extent (1 hour 1, half day 2, one day 3, two days 4, more than two days 5); Participants (Local 1, Regional 2, National 3, International 4); Role (Judge 3, Lecturer/Consultant/Resource Person/Guest Speaker 5); maximum 40.
5. **Publication:** Scope (Local 3, Regional 4, National 6, International 8); Type (Commentary 2, Reviews 4, Compilation 5, Article 5, Scholarly Paper 8, Monograph 8, Research Output 10, Book 10); maximum 40.
6. **Conduct of Research:** no lower-level source breakdown; manual/HR-defined; maximum 40.
7. **Recognition:** Nominee by scope: Local 5, Provincial/Regional 15, National 20, International 20. Awardee by scope: Local 10, Provincial/Regional 30, National 40, International 40. Maximum 40.
8. **Instructional Materials:** Audio Visual Aids 10, Modules 10, bound Reviewers 10, Other Bound Workbooks/Exercise Books 20; maximum 40.
9. **Creative Work:** no lower-level source breakdown; manual/HR-defined; maximum 20.
10. **School Involvement:** Moderator/Officer 20, Coach/Trainer 20, Working Committees 20, Rendered School Service 10; shared cap 30; date/school year/period required.
11. **Community Involvement:** Church Activities 25, Community/Civic Activities 25, Charity/Community Project Support 5; shared cap 30; date/school year/period required.
12. **Years of Service:** 2/4/6/8/10/12/14/16/18/20+ years → 1/2/3/4/5/6/7/8/9/10 points; maximum 10.

## Non-Teaching Personnel Ranking Scale

Source: `Non_Teaching_Personnel_Ranking_Scale_Intuitive_Breakdown_Tables.docx`
Tables extracted: 8

1. **Job Performance:** weight .50, maximum 50, manual until official bands are supplied.
2. **Personal Attitudes and Qualities:** weight .10, maximum 10, manual until official bands are supplied.
3. **Efficiency:** weight .30, maximum 30, manual until official bands are supplied.
4. **School Activities:** Moderator/Officer 30, Trainer/Coach 20, Working Committees 20, Rendered School Service 10; shared cap 30; supporting activity/role/period evidence required.
5. **Community Involvement:** Church Activities 25, Community/Civic Activities 25, Charity/Community Projects 5; shared cap 30; supporting organization/period evidence required.
6. **Years of Service:** 2 through 20+ years in two-year steps → 1 through 10 points; maximum 10.
7. **Judge/Lecturer/Resource Person:** 5 per eligible engagement, capped at 30.
8. **Recognition/Meritorious Award:** no lower-level award-scope breakdown; manual/HR-defined; maximum 30.

## Source-safety decisions

- Grouped headers are stored as option groups and rendered with semantic `colgroup` headers.
- Progressions are stored as ordered option rows, not generated only from display text.
- Shared-cap category maximums remain visually distinct from subcategory maximums.
- Research, Creative Work, weighted performance criteria, and Non-Teaching recognition remain explicitly manual.
- Stable option IDs make repeated seeds and version comparisons deterministic.
