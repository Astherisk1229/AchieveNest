# Full-Time Academic Rank Dropdown Binding — Plan D2 Phase D2-1

## Summary
The free-text rank input in `OnboardPersonnelModal.jsx` and `EditMasterDataModal.jsx` has been replaced by a structured `<select>` dropdown backed by the authoritative Plan E 26-rank catalog fetched through `personnelMasterDataService.getFacultyRanks()` / `facultyRankCatalogService.fetchFullTimeFacultyRanks()`.

## Authoritative Catalog Shape
- Total ranks: 26 canonical ranks
- Ranks span 4 recognized tiers: Baccalaureate, Masteral, Doctoral, and University Professor
- Persistent identifier: Canonical rank title string backed by stable Plan E code (e.g. `PROFESSOR_I` -> `"Professor I"`)

## Form Controls Verified
- `OnboardPersonnelModal.jsx`: Select control with options populated from `masterData.fullTimeRanks`.
- `EditMasterDataModal.jsx`: Select control with options populated from `catalogs.fullTimeRanks`.
