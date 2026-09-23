# Administrators Scale Scoring Verification

## Scale Ceilings
- **Overall Maximum**: `160.0 points`
- **Passing Threshold**: `120.0 points`
- **Area A Maximum**: `70.0 points`
- **Area B Maximum**: `50.0 points`
- **Area C Maximum**: `40.0 points`

---

## Criterion-Level Results

### Area A: Professional Development
- `A.1 Degree/s`:
  - Ph.D. Degree: `40.0 pts` (Flat)
  - Ph.D. Units: `2 pts / 3 units`, capped at `10.0 pts`
  - MA Degree: `20.0 pts` (Flat)
  - MA Units: `1 pt / 3 units`, capped at `10.0 pts`
- `A.2 Active Membership`:
  - Member: `5.0 pts`
  - Officer: `10.0 pts` (requires position)
- `A.3 Seminars/Trainings`:
  - In-House: `3.0 pts`
  - City/Provincial: `4.0 pts`
  - Regional: `6.0 pts`
  - National: `8.0 pts`
  - International: `10.0 pts`
  - Category Sub-Ceiling: `20.0 pts`

### Area B: Productivity and Creative Work
- `B.1 Guest Lecturer / Consultant / Judge`:
  - Additive 4-Factor Sum: `Org (1..2) + Extent (1..5) + Reach (1..4) + Role (3..5)`
  - Range: `6.0` to `16.0 pts` per entry
- `B.2 Publication`:
  - Additive 2-Factor Sum: `Scope (3..8) + Publication_Type (2..10)`
  - Range: `5.0` to `18.0 pts` per entry
- `B.3 Conduct of Research`:
  - `evaluator_judgment_required = true`, Max `40.0 pts`, accepted score initially `null`
- `B.4 Recognition & Awards`:
  - 8-cell Nominee / Awardee x Scope matrix (`5.0` to `40.0 pts`)
- `B.5 Instructional Materials`:
  - Audio-Visual/Modules/Reviewers: `10.0 pts`
  - Others (Bound Workbook/Exercises): `20.0 pts`
- `B.6 Creative Work`:
  - `evaluator_judgment_required = true`, Max `20.0 pts`, accepted score initially `null`

### Area C: Service and Leadership
- `C.1 Extra-Curricular Activities`:
  - Moderator / Coach / Working Committee: `20.0 pts`, Rendered Service: `10.0 pts`
  - Sub-Ceiling: `30.0 pts`
- `C.2 Community Involvement`:
  - Church: `25.0 pts`, Civic: `25.0 pts`, Charity: `5.0 pts`
  - Sub-Ceiling: `30.0 pts`
- `C.3 Years of Service at NDMU`:
  - `floor(completed_years / 2) * 1`, Max `10.0 pts`, `server_derived = true`
