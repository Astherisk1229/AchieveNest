# Phase D2-3: Edit Personnel Initialization

## Initialization Order
When opening `EditMasterDataModal.jsx` for an existing Personnel record:

1. **Load Official Saved Rank**:
   - `savedOfficialRank` is read directly from `personnel.current_rank_title` or `personnel.academic_rank`.
   - `form.currentRankTitle` initializes to this exact saved value.
2. **Load Authoritative Catalog**:
   - `catalogs.fullTimeRanks` (26 ranks) and `catalogs.partTimeTitles` (4 titles) are loaded asynchronously from `personnelMasterDataService`.
3. **Catalog Matching & Legacy Check**:
   - `isSavedRankInCatalog` checks if the saved rank exists in the active catalog.
   - If not in catalog, a dedicated legacy option `{form.currentRankTitle} (Saved / Legacy Record - Reconciliation Required)` is injected to ensure the saved value remains selected without loss.
4. **Separate Recommendation Computation**:
   - `personnelRankRecommendationService.resolveRecommendation` runs separately and populates the advisory badge.
   - At no point does the recommendation overwrite the saved current rank.
