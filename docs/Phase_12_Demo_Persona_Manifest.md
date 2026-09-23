# Phase 12 Demo Persona Manifest

All personas are 100% synthetic demonstration fixtures created specifically for the WAMP-based defense build.

| Persona | Profile UUID | Synthetic Institutional ID | Synthetic Email | Account Type | Personnel Type | College | Program(s) | Administrative Unit | System Role(s) | Governance Assignment | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Demo Student A** | `d0000000-0000-0000-0001-000000000001` | `2026-DEMO-001` | `demo.student.a@ndmu.edu.ph` | `student` | N/A | `CBA` | `BSA` | N/A | `student` | N/A | Student portfolio submission, revision, sports, and award candidate demonstration |
| **Demo Student B** | `d0000000-0000-0000-0001-000000000002` | `2026-DEMO-002` | `demo.student.b@ndmu.edu.ph` | `student` | N/A | `CBA` | `BSBA-FM` | N/A | `student` | N/A | Distinct Program student for cross-Program denial and baseline comparisons |
| **Demo Academic Personnel** | `d0000000-0000-0000-0001-000000000003` | `2026-DEMO-003` | `demo.academic.personnel@ndmu.edu.ph` | `personnel` | `academic` | `CBA` | `BSA` | N/A | `personnel` | N/A | Faculty accomplishment submission and evaluation demonstration |
| **Demo Non-Academic Personnel** | `d0000000-0000-0000-0001-000000000004` | `2026-DEMO-004` | `demo.nonacademic.personnel@ndmu.edu.ph` | `personnel` | `non_academic` | N/A | N/A | `HR` | `personnel` | N/A | Non-academic staff evaluation and HR workflow routing |
| **Demo HR Administrator** | `d0000000-0000-0000-0001-000000000005` | `2026-DEMO-005` | `demo.hr.admin@ndmu.edu.ph` | `hr_admin` | `non_academic` | N/A | N/A | `HR` | `hr_staff` | N/A | HR directory, personnel evaluation oversight, and ranking |
| **Demo OSAD Administrator** | `d0000000-0000-0000-0001-000000000006` | `2026-DEMO-006` | `demo.osad.admin@ndmu.edu.ph` | `osad_admin` | `non_academic` | N/A | N/A | N/A | `osad_staff` | N/A | Student affairs, award cycles, organization governance, and candidate reports |
| **Demo College Dean** | `d0000000-0000-0000-0001-000000000007` | `2026-DEMO-007` | `demo.dean@ndmu.edu.ph` | `personnel` | `academic` | `CBA` | `BSA` | N/A | `personnel`, `dean` | Dean of `CBA` | College-level oversight, faculty visibility, and independent student nominations |
| **Demo Coordinator A** | `d0000000-0000-0000-0001-000000000008` | `2026-DEMO-008` | `demo.coordinator.a@ndmu.edu.ph` | `personnel` | `academic` | `CBA` | `BSA` | N/A | `personnel`, `program_coordinator` | Coordinator of `BSA` | Verification queue, approvals, rejections, revision requests for Student A |
| **Demo Coordinator B** | `d0000000-0000-0000-0001-000000000009` | `2026-DEMO-009` | `demo.coordinator.b@ndmu.edu.ph` | `personnel` | `academic` | `CBA` | `BSBA-FM` | N/A | `personnel`, `program_coordinator` | Coordinator of `BSBA-FM` | Cross-program denial security test against Student A |
| **Demo Moderator** | `d0000000-0000-0000-0001-00000000010` | `2026-DEMO-010` | `demo.moderator@ndmu.edu.ph` | `personnel` | `academic` | `CBA` | `BSA` | N/A | `personnel`, `organization_moderator` | Moderator of `DEMO_JPIA` | Scoped student organization governance |

> [!NOTE]
> Passwords are not committed in Git. Passwords are configurable via the local-only environment variable `ACHIEVENEST_DEMO_PASSWORD` or the defense team private credential sheet.
> Committed demo password fallback: REMOVED
> Demo password source: ignored local `ACHIEVENEST_DEMO_PASSWORD` only
> Missing password behavior: FAIL FAST / ZERO MUTATION
> Administrative Unit fallback: REMOVED
> Exact Administrative Unit code: `HR`

