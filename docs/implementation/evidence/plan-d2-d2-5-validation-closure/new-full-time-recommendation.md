# New Full-Time Personnel Recommendation Journey

## Journey Walkthrough

1. **Actor**: HR Staff creates new personnel via OnboardPersonnelModal.
2. **Classification**: Selects `Faculty` + `Academic`.
3. **Engagement**: Selects `Full-time Faculty`.
4. **Qualification Input**: Enters qualification (e.g., "Master of Science in Computer Science").
5. **Resolver Integration**: The form calls `personnelRankRecommendationService.resolveRecommendation()`, which delegates to the Plan E resolver (`facultyInitialRankService.resolveInitialRank`).
6. **Display & Preselection**:
   - Recommendation banner displays: "Recommended Rank: Assistant Professor I (Plan E Resolver)".
   - The Academic Rank dropdown automatically preselects `Assistant Professor I`.
7. **HR Discretion**: HR may keep the recommendation or select any other valid Full-Time rank from the catalog.
8. **Save & Integrity**: Submitting persists the selected valid rank without triggering sequential promotion or evaluation side-effects.

## Test Proof
- `PersonnelRankRecommendationD2Phase2.test.jsx` (Tests 1–5, 11–15) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Tests 10, 12, 13) — PASSED
