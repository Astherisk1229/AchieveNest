# Phase 16 Department Occurrence Audit

- Prior reported baseline: 94 broad `Department` matches before the latest remediation batches.
- Current matching source lines reviewed: 8
- ACTIVE-UI candidates: 0
- ACTIVE-LOGIC candidates: 0
- Compatibility/legacy/test/documentation candidates retained: 8
- Department Secretary active-source gate: see `frontend/scripts/phase16-terminology-audit.ps1`.
- Status: IN PROGRESS until every OPEN row is resolved or reclassified with evidence.

## Classification policy

Compatibility properties may remain only when inert. Local-defense placement and governance must use College, Academic Program, Administrative Unit, or Organization as applicable. Automated classification is conservative: every OPEN row requires code review.

## Occurrences

| # | File | Line | Current Reference | Classification | Active in Local Defense? | Action | Replacement/Reason | Status |
|---:|---|---:|---|---|---|---|---|---|
| 1 | `frontend/src/models/__tests__/OSADAcademicHierarchy.test.js` | 22 | `expect(StudentOrganizationModel.validateScope({ scopeType: 'department', collegeId: 'col-ceac' }, colleges, programs).isValid).toBe(false)` | TEST | No | Review fixture | Test fixture or compatibility assertion | REVIEWED |
| 2 | `frontend/src/pages/osad-admin/__tests__/OSADAcademicHeaderActions.test.js` | 29 | `expect(['department', 'degree_program']).not.toContain(getRecommendedCreationAction({ collegeCount: 1, academicProgramCount: 0 }))` | TEST | No | Review fixture | Test fixture or compatibility assertion | REVIEWED |
| 3 | `frontend/src/services/authService.js` | 147 | `department_id: user.department_id \|\| null,` | COMPATIBILITY-FIELD | No | Keep inert | Preserved response/session compatibility; not an authorization source | REVIEWED |
| 4 | `frontend/src/utils/__tests__/personnelPlacement.test.js` | 22 | `it('formats Academic affiliation without a Department fallback', () => expect(formatPersonnelPlacement({ personnel_classification: 'academic', college_code: 'CEAC', program_affiliations: [{ code: 'BSCS' }] })).toBe('CEAC • BSCS'))` | TEST | No | Review fixture | Test fixture or compatibility assertion | REVIEWED |
| 5 | `frontend/src/utils/__tests__/roleContext.test.js` | 34 | `expect(normalizeRoleContext('department_secretary')).toBe(CANONICAL_ROLES.DEAN)` | TEST | No | Review fixture | Test fixture or compatibility assertion | REVIEWED |
| 6 | `frontend/src/utils/roleContext.js` | 76 | `// Transitional aliases only. Department Secretary is no longer a valid` | DOCUMENTATION | No | Review wording | Comment or migration note | REVIEWED |
| 7 | `frontend/src/utils/roleContext.js` | 78 | `// compatibility code cannot resurrect a separate Department Secretary role.` | DOCUMENTATION | No | Review wording | Comment or migration note | REVIEWED |
| 8 | `frontend/src/utils/roleContext.js` | 81 | `case 'department_secretary':` | COMPATIBILITY-FIELD | No | Keep after review | Non-UI shape retained only when it has no local authority | REVIEWED |

## Exit summary

- Total matching source lines reviewed: 8
- Active structural candidates still open: 0
- Resolved structural blockers: pending row-by-row remediation
- Remaining confirmed structural blockers: pending row-by-row remediation
- Compatibility/history/test/documentation candidates: 8
