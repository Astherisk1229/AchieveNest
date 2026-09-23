# Plan 06 Phase 4 — OSAD Action Inventory Matrix
## Comprehensive Action Inventory Across 10 Canonical OSAD Pages

| Page Component | Action Label | Control Type | Location | Handler / Destination | Hierarchy Classification |
|---|---|---|---|---|---|
| `OSADCommandCenterPage` | Refresh Metrics | Secondary Button | Header Toolbar | `onRefreshMetrics` | **Secondary** |
| `OSADAcademicProgramsPage` | Add Degree Program | Primary Button | Header Actions | `onOpenAddProgram` | **Primary** |
| `OSADAcademicProgramsPage` | Add College | Secondary Button | Header Actions | `onOpenAddCollege` | **Secondary** |
| `OSADAcademicProgramsPage` | Manage Coordinator | Row Action | Table Row | `onManageCoordinator` | **Contextual Row Action** |
| `OSADStudentAccountsPage` | Add Student Account | Primary Button | Header Actions | `onOpenAddStudent` | **Primary** |
| `OSADStudentAccountsPage` | View Portfolio | Row Action | Student Row | `navigate(/osad/review/:id)` | **Intentional Alternate Entry** |
| `OSADStudentAccountsPage` | Reset Password | Row Action | Student Row | `onResetStudentPassword` | **Destructive / High Impact** |
| `OSADStudentOrganizationsPage` | Add Organization | Primary Button | Header Actions | `onOpenAddOrg` | **Primary** |
| `OSADStudentOrganizationsPage` | Add Club | Secondary Button | Header Actions | `onOpenAddClub` | **Secondary** |
| `OSADStudentOrganizationsPage` | Assign Moderator | Row Action | Organization Row | `onAssignModerator` | **Contextual Row Action** |
| `OSADPasswordResetRequestsPage` | Approve Reset | Primary Button | Request Row | `onApproveReset` | **Primary Task Action** |
| `OSADPasswordResetRequestsPage` | Reject Request | Destructive Button | Request Row | `onRejectReset` | **Destructive Action** |
| `OSADAwardsAndCriteriaPage` | Create Award Category | Primary Button | Header Actions | `onOpenCreateAward` | **Primary** |
| `OSADAwardsAndCriteriaPage` | Edit Criteria | Row Action | Category Card | `onEditCriteria` | **Contextual Row Action** |
| `OSADAwardCandidateReviewPage` | Evaluate Portfolio | Row Action | Candidate Card | `onOpenReviewWorkspace` | **Primary Task Action** |
| `OSADAwardCandidateReviewPage` | Batch Confirm Awardees | Primary Button | Bulk Toolbar | `onBatchConfirm` | **Primary Batch Action** |
| `OSADCertificateTemplatesPage` | Create New Template | Primary Button | Header Actions | `onOpenCreateTemplate` | **Primary** |
| `OSADCertificateTemplatesPage` | Preview Template | Row Action | Template Card | `onPreviewTemplate` | **Contextual Row Action** |
| `OSADAccreditationReportsPage` | Export Report | Primary Button | Header Actions | `onExportReport` | **Primary** |
| `OSADSystemAuditLogsPage` | Export Audit Logs | Primary Button | Header Actions | `onExportLogs` | **Primary** |
