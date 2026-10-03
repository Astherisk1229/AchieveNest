# Full-Time / Part-Time Catalog Crossover Audit — Plan D2 Phase D2-0

### Findings on Catalog Crossover Risk
1. **Current UI Vulnerability**:
   - Because `currentRankTitle` in `OnboardPersonnelModal.jsx` and `EditMasterDataModal.jsx` is a free-form `<input type="text" />`, an HR administrator can manually type a Part-Time title (e.g. *"Lecturer"*) for a Full-Time faculty member, or a Full-Time rank (e.g. *"Assistant Professor I"*) for a Part-Time faculty member.
   - The UI currently lacks validation preventing this crossover.
2. **Backend Domain Isolation**:
   - In the database and backend services, Full-Time ranks live in `faculty_rank_catalog` (26 ranks) and Part-Time titles live in `part_time_faculty_titles` (4 titles).
   - `PartTimeFacultyTitleService.php` and `FacultyInitialRankService.php` strictly separate the two catalogs.
3. **Action Required in Phase D2-2**:
   - The UI rank dropdown must dynamically switch between the Full-Time catalog (`GET /api/v1/faculty-ranks`) and Part-Time title catalog (`GET /api/v1/faculty-titles/part-time`) based on `facultyEngagement`.
