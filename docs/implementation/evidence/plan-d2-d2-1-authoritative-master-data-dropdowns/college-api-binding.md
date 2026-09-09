# College API Binding & Master-Data Sourcing — Plan D2 Phase D2-1

## Summary
The College dropdown options in `OnboardPersonnelModal.jsx`, `EditAssignmentModal.jsx`, and `HRPersonnelDirectoryPage.jsx` are sourced directly from institutional master-data services (`personnelMasterDataService.getColleges()`) and institutional API endpoints (`/api/v1/colleges`), completely decoupling option generation from loaded personnel records.

## Empty-State Repair (`D2-RISK-02`)
- **Prior Defect**: When the HR Personnel list was empty (`personnelList = []`), `collectPersonnelPlacementOptions` returned zero colleges.
- **Resolution**: `mergePlacementMasterData` integrates institutional master data independently, ensuring all active colleges are displayed even when no personnel accounts exist yet.
