# Create Personnel Entry Points — Plan D2 Phase D2-0

| UI Entry Point | Route/Page | Component | Create/Edit | Data Source | Submit Target | Active? |
|---|---|---|---|---|---|---|
| **Add Personnel Button / Onboard Modal** | `/hr-admin/personnel-directory` | `OnboardPersonnelModal.jsx` | Create | Local state + `collectPersonnelPlacementOptions` | `POST /api/v1/provisioning/manual-personnel` | **YES (Production Active)** |
| **Legacy Create Personnel Modal** | Internal modal / legacy dialog | `CreatePersonnelAccountModal.jsx` | Create | Static `HRModel.COLLEGES`, `HRModel.ACADEMIC_RANKS` | `onSave` callback / local | **NO (Legacy Reference Only)** |
| **CSV/Excel Batch Roster Import** | `/hr-admin/personnel-directory` (Batch Tab) | `PersonnelDirectory.jsx` | Create (Batch) | Uploaded File / `previewRoster` API | `POST /api/v1/provisioning/commit-roster` | **YES (Batch Path)** |

### Findings on Active Create Flow (`OnboardPersonnelModal.jsx`)
1. Active modal is imported and rendered inside `PersonnelDirectory.jsx`.
2. Form fields for `positionTitle`, `currentRankTitle`, and `qualificationSummary` are unconstrained `<input type="text" />` elements.
3. Group & Side selection is implemented via interactive pills:
   - Personnel Group: `faculty` vs `non_teaching_faculty`
   - Organizational Side: `academic` vs `non_academic`
4. Engagement (`full_time_faculty` vs `part_time_faculty`) and Employment Status (`permanent` vs `probationary`) are independent radio options.
5. Submission invokes `provisioningService.provisionManualPersonnel(payload)`.
