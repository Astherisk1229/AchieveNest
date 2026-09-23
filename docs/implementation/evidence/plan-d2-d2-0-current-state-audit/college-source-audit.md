# College Source & Ownership Audit — Plan D2 Phase D2-0

### Authoritative Institutional Ownership
- **Database Table**: `colleges`
- **Owner Domain**: Academic Structure / Institutional Structure (OSAD Academic Structure Module)
- **Primary Model**: `College.php` / `AcademicStructureController.php` / `InstitutionalStructureController.php`
- **Primary Key**: `id` (`INT` or `BIGINT`)
- **Canonical Columns**:
  - `college_name` (`VARCHAR(255)`) — Official display title (e.g. *"College of Computer Studies"*, *"College of Engineering"*, *"College of Arts and Sciences"*)
  - `college_code` (`VARCHAR(50)`) — Stable institutional code (e.g. `CCS`, `COE`, `CAS`)
  - `status` / `is_active` (`BOOLEAN` / `VARCHAR`) — Active state indicator
- **Canonical Backend Endpoints**:
  - `GET /api/v1/colleges` (returns all active institutional colleges)
  - `GET /api/v1/academic-programs` (returns all programs with their parent `college_id`)

### Institutional Ownership Freeze Rule
- HR must **NOT** create a duplicate College catalog or own separate College rows.
- All HR provisioning, classification, assignment, and evaluation projections must bind directly to the institutional `colleges` table via foreign key `college_id`.
