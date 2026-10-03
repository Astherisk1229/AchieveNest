# Stable ID & Canonical Identifier Persistence — Plan D2 Phase D2-1

## Persistence Contracts
- **Colleges**: Persisted via canonical `college_id` foreign key.
- **Departments**: Persisted via canonical `administrative_unit_id` foreign key.
- **Academic Ranks / Titles**: Persisted via canonical `current_rank_title` string matching the canonical Plan E catalog label, backed by stable Plan E codes.
- **Display Isolation**: Dropdown display labels (e.g. `"CAS — College of Arts and Sciences"`) are purely presentation-layer projections and never stored as database primary identifiers.
