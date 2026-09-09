# Qualification Field Boundary Declaration — Plan D2 Phase D2-1

## Boundary Rule
- In Phase D2-1, the `qualification_summary` field is persisted and loaded as structured text in onboarding and edit forms.
- **Qualification-driven automated rank recommendation** (`POST /api/v1/faculty-ranks/resolve-initial` / `FacultyInitialRankService`) is explicitly **DEFERRED to Phase D2-2**.
- Modifying qualifications in D2-1 does not automatically alter or overwrite the selected rank.
