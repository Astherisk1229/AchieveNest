# Phase D2-2: Catalog Compatibility Validation

## Defense Against Drift
To prevent discrepancies between resolver outputs and frontend master-data catalogs, `personnelRankRecommendationService` validates every resolved code against the active catalog prior to rendering or preselection.

### Full-Time Validation
- Code must exist in `personnelMasterDataService.getFullTimeFacultyRanks()` (26 canonical ranks).
- If a resolver returns a code not present in the catalog (e.g. `INVALID_RANK_XYZ`), the service rejects the recommendation, transitions to `'error'`, and logs a catalog mismatch warning.

### Part-Time Validation
- Code must exist in `personnelMasterDataService.getPartTimeFacultyTitles()` (4 canonical titles).
- If a Full-Time rank (e.g. `ASST_1`) is returned in a Part-Time context, or vice versa, the response is discarded as an invalid cross-catalog leakage.
