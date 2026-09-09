# Edit Personnel Entry Points — Plan D2 Phase D2-0

| UI Entry Point | Route/Page | Component | Create/Edit | Data Source | Submit Target | Active? |
|---|---|---|---|---|---|---|
| **Edit Master Data** | `/hr-admin/personnel-directory` (Action Menu) | `EditMasterDataModal.jsx` | Edit | Row `personnel` object via props | `PUT /api/v1/hr/personnel/{id}/master-data` | **YES (Production Active)** |
| **Edit Assignment** | `/hr-admin/personnel-directory` (Action Menu) | `EditAssignmentModal.jsx` | Edit | Row `personnel` + `placementOptions` | `PUT /api/v1/hr/personnel/{id}/assignment` | **YES (Production Active)** |
| **Edit Classification** | `/hr-admin/personnel-directory` (Action Menu) | `EditClassificationModal.jsx` | Edit | Row `personnel` object via props | `PUT /api/v1/hr/personnel/{id}/classification` | **YES (Production Active)** |
| **Toggle Status (Lock/Archive)** | `/hr-admin/personnel-directory` (Action Menu) | `PersonnelDirectory.jsx` | Edit | Row `personnel` object via props | `PUT /api/v1/hr/personnel/{id}/status` | **YES (Production Active)** |

### Findings on Active Edit Flow (`EditMasterDataModal.jsx`)
1. Data population: Values are initialized directly from `personnel.faculty_engagement`, `personnel.employment_status`, `personnel.position_title`, `personnel.current_rank_title`, and `personnel.qualification_summary`.
2. Existing Rank Preservation: `current_rank_title` is populated with the saved official rank and is NOT automatically mutated or cleared if `qualification_summary` or `employment_status` is changed in the UI.
3. Audit Requirement: Modal enforces entering a mandatory `reason` text before submission.
4. Submission Target: Invokes `hrAdminService.updatePersonnelMasterData(personnel.id, payload)`.
