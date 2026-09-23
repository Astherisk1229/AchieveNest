# Upload Endpoint Inventory

| Endpoint Path | HTTP Method | Controller / Service | Auth Role | Payload / Fields | Storage Target | Status |
|---|---|---|---|---|---|---|
| `/api/v1/personnel/accomplishments/{id}/evidence` | `POST` | `PersonnelAccomplishmentController::addEvidence` | `academic_personnel`, `non_academic_personnel`, `personnel` | Multipart `file` or `evidence_file` | `writable/uploads/evidence/personnel/...` | Production Active |
| `/api/v1/personnel/accomplishments` | `POST` | `PersonnelAccomplishmentController::create` | Personnel Owner | JSON accomplishment metadata | DB only | Production Active |
| `/api/v1/evidence/personnel/{id}/download` | `GET` | `EvidenceController::personnelDownload` | Authenticated Owner / Dean / HR | None (Bearer token) | File Stream | Production Active |
| `/api/v1/evidence/personnel/{id}` | `GET` | `EvidenceController::personnelMetadata` | Authenticated Owner / Dean / HR | None (Bearer token) | JSON Metadata | Production Active |
| `/api/v1/personnel/portfolio/purge` | `POST` / `DELETE` | `PersonnelPortfolioSubmissionController::purge` | Owner / HR Admin on behalf | JSON confirmation `DELETE_PORTFOLIO` | DB Purge | Production Active |
