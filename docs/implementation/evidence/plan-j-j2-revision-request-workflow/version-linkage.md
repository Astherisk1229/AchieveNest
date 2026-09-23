# Phase J2 Evidence: Version Linkage & Lineage Tracking

## Version Linkage Model
- Each revision request explicitly captures:
  - `portfolio_version_id`: ID of the evaluation version being returned (e.g. `EVAL-V1`).
  - `version_number`: Point-in-time version number (e.g. 1).
  - `resolved_by_version_id`: Assigned upon resubmission (e.g. `EVAL-V2`).
  - `resolved_by_version_number`: Assigned upon resubmission (e.g. 2).
- Ensures complete historical lineage across multiple return/resubmit cycles (e.g. V1 -> Rev1 -> V2 -> Rev2 -> V3).
