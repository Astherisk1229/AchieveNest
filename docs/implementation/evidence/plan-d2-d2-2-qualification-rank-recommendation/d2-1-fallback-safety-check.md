# Phase D2-2: D2-1 Fallback Safety & Master-Data Source Check

## Audit of D2-1 Master-Data Dropdowns (Section 34 Requirement)
Before finalizing Phase D2-2, an audit was conducted on `personnelMasterDataService.js` regarding institutional office and department catalogs:

### Findings
1. **Primary Authoritative Source**:
   - The primary and authoritative source for Administrative Offices / Departments is the backend API endpoint `GET /api/v1/administrative-units` (backed by institutional configuration).
2. **Offline / Network Resilience**:
   - The static fallback list in `personnelMasterDataService.js` is strictly a non-authoritative fallback for unit testing and offline UI initialization, and is not treated as an alternate authoritative source.
3. **No Drift / No Direct Edit Collisions**:
   - All dropdowns load dynamically via `loadAdministrativeUnits()` and bind to canonical persisted unit codes.
