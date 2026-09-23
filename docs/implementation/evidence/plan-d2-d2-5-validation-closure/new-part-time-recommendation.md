# New Part-Time Personnel Recommendation Journey

## Journey Walkthrough

1. **Actor**: HR Staff creates new personnel via OnboardPersonnelModal.
2. **Classification**: Selects `Faculty` + `Academic`.
3. **Engagement**: Selects `Part-time Faculty`.
4. **Qualification Input**: Enters qualification (e.g., "Ph.D. in Information Technology").
5. **Resolver Integration**: The form calls `personnelRankRecommendationService.resolveRecommendation()`, delegating to `partTimeFacultyTitleService.resolveTitleFromQualification`.
6. **Display & Preselection**:
   - Recommendation banner displays: "Recommended Title: Professorial Lecturer".
   - The Part-Time title dropdown preselects `Professorial Lecturer`.
   - Full-Time academic ranks are completely excluded.
7. **HR Discretion**: HR may retain the title or select another valid Part-Time title from the 4 seeded options.
8. **Save & Integrity**: Submitting persists the part-time title without generating ranking or progression side-effects.

## Test Proof
- `PersonnelRankRecommendationD2Phase2.test.jsx` (Tests 6–10) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Test 11) — PASSED
