# OSAD Student Organization Detail Component Map
## Plan 02 Phase 4 Component & Interaction Map

```
OSADDashboardPage (?tab=organizations&orgId=:orgId)
  │
  ├── [tab === 'organizations' & !orgId]
  │     └── OSADStudentOrganizationsPage
  │           ├── Header & Stats Banner
  │           │     └── Create Student Organization Button -> [CreateOrganizationModal]
  │           ├── Scope & Category Filter Bar
  │           └── Organization Cards Grid
  │                 └── Organization Card Entity (role="button", tabIndex=0, onKeyDown, onClick -> onSelectOrganization(org.id))
  │                       ├── Scope & Category Badges
  │                       ├── Logo Image / Initials Avatar
  │                       ├── Organization Name & Code ([CSS])
  │                       ├── Parent College Display ([CEAC])
  │                       ├── Program Scope Summary ([N] Programs / University-wide)
  │                       ├── "View Details →" Affordance
  │                       └── Moderator Summary Box
  │                             ├── Current Moderator Name / "Unassigned"
  │                             └── Nested Action Button ("Assign" / "Reassign")
  │                                   └── onClick (e.stopPropagation()) -> Opens PersonnelSelectorModal
  │
  └── [tab === 'organizations' & orgId]
        └── OSADOrganizationDetailsView (organizationId={orgId})
              ├── Top Breadcrumb & Actions Bar
              │     ├── "Back to Student Organizations" Button (clears orgId)
              │     ├── Breadcrumb: Student Organizations / [CODE] Name
              │     ├── "Edit Details" Action Button (Phase 5 reservation)
              │     └── "Assign / Reassign Moderator" Action Button -> [PersonnelSelectorModal]
              │
              ├── Overview Grid
              │     ├── Profile & Branding Card
              │     │     ├── Organization Logo / Initials Avatar
              │     │     ├── Scope, Category, Status Badges
              │     │     ├── Parent College Context
              │     │     └── Configuration Completeness Indicator (Fully Configured / Partially Configured)
              │     │
              │     └── Organization Moderator Leadership Card
              │           ├── Moderator Avatar & Active Faculty Badge
              │           ├── Full Name, Employee ID, Email, Designation
              │           └── In-Card "Assign Now" / "Reassign" Action
              │
              ├── Academic Program Scope Section
              │     ├── Total Programs Header Count
              │     ├── Empty State (Informational for University/College scopes vs Alert for Program scope)
              │     └── Program List Rows
              │           ├── Program Code ([BSCS]) & Degree Name
              │           ├── College Badge
              │           └── "Active Scope" Badge
              │
              └── Moderator Assignment History Section
                    ├── Historical Timeline / Table Rows
                    │     ├── Moderator Name & Employee ID
                    │     ├── Designation & Email
                    │     ├── Tenure Dates (Effective From → Effective Until / Present)
                    │     └── Status Badge ("Active" vs "Ended")
                    └── Empty History State ("No moderator assignment history recorded yet.")
```
