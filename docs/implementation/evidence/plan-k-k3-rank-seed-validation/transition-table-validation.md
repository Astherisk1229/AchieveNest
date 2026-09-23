# Authoritative Faculty Rank Transition Graph

| From Rank | To Rank | Rule Type | Active? | Source |
|---|---|---|---|---|
| `ASSISTANT_INSTRUCTOR` | `INSTRUCTOR_I` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `INSTRUCTOR_I` | `SENIOR_INSTRUCTOR_I` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `SENIOR_INSTRUCTOR_I` | `SENIOR_INSTRUCTOR_II` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `SENIOR_INSTRUCTOR_II` | `SENIOR_INSTRUCTOR_III` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `SENIOR_INSTRUCTOR_III` | `SENIOR_INSTRUCTOR_IV` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `SENIOR_INSTRUCTOR_IV` | `SENIOR_INSTRUCTOR_V` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `SENIOR_INSTRUCTOR_V` | `ASSISTANT_PROFESSOR_I` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSISTANT_PROFESSOR_I` | `ASSISTANT_PROFESSOR_II` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSISTANT_PROFESSOR_II` | `ASSISTANT_PROFESSOR_III` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSISTANT_PROFESSOR_III` | `ASSISTANT_PROFESSOR_IV` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSISTANT_PROFESSOR_IV` | `ASSISTANT_PROFESSOR_V` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSISTANT_PROFESSOR_V` | `ASSOCIATE_PROFESSOR_I` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSOCIATE_PROFESSOR_I` | `ASSOCIATE_PROFESSOR_II` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSOCIATE_PROFESSOR_II` | `ASSOCIATE_PROFESSOR_III` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSOCIATE_PROFESSOR_III` | `ASSOCIATE_PROFESSOR_IV` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSOCIATE_PROFESSOR_IV` | `ASSOCIATE_PROFESSOR_V` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSOCIATE_PROFESSOR_V` | `PROFESSOR_I` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `PROFESSOR_I` | `PROFESSOR_II` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `PROFESSOR_II` | `PROFESSOR_III` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `PROFESSOR_III` | `PROFESSOR_IV` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `PROFESSOR_IV` | `PROFESSOR_V` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `PROFESSOR_V` | `PROFESSOR_VI` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `PROFESSOR_VI` | `PROFESSOR_VII` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `PROFESSOR_VII` | `COLLEGE_PROFESSOR` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `COLLEGE_PROFESSOR` | `UNIVERSITY_PROFESSOR` | normal_sequential | Yes | Plan E / FacultyRankProgressionService |
| `ASSISTANT_PROFESSOR_I` | `PROFESSOR_I` | verified_phd_exception | Yes | Plan E / Plan H / Verified PhD Path |
