# Administrative Unit Source & Persistence Audit — Plan D2 Phase D2-0

### Backend Table & Structure
- **Database Table**: `administrative_units`
- **Primary Key**: `id`
- **Columns**:
  - `unit_name` (`VARCHAR(255)`) — Official office / administrative unit title
  - `unit_code` (`VARCHAR(50)`) — Administrative code
  - `is_active` (`BOOLEAN`) — Status indicator
- **Foreign Key on Personnel**: `personnel_profiles.administrative_unit_id`

### Seeded Non-Academic Offices
Confirmed seeded records in `administrative_units`:
- `Records Section`
- `Library`
- `Business Office`

### Status of Non-Academic Office Master Data
- **Finding**: While essential offices like *Records Section*, *Library*, and *Business Office* exist, the broader comprehensive office list across all non-academic departments is incomplete.
- **Classification**: `OFFICE/DEPARTMENT MASTER DATA — INCOMPLETE`
- **Constraint**: Phase D2-0 does not invent or seed arbitrary office rows.
