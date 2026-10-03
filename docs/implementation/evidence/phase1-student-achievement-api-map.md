# AchieveNest — Plan 04 Phase 1
## Evidence: API & Route Map

---

### 1. Portfolio & Achievement API Routes

| Method | Endpoint | Controller Action | Purpose | Auth / Role Gate |
|---|---|---|---|---|
| `GET` | `/api/v1/portfolio/categories` | `StudentPortfolioController::categories` | Fetch all 9 active categories with nested 57 subcategories | Public / Authenticated |
| `GET` | `/api/v1/portfolio` | `StudentPortfolioController::index` | List authenticated student's portfolio records | Student (Own records) / Coordinator / OSAD |
| `GET` | `/api/v1/portfolio/{id}` | `StudentPortfolioController::get` | Retrieve single portfolio record with evidence and verification events | Scoped to owner or verifier |
| `POST` | `/api/v1/portfolio` | `StudentPortfolioController::create` | Create new portfolio fact record (draft or submitted) with structured metadata | Student only |
| `PUT` | `/api/v1/portfolio/{id}` | `StudentPortfolioController::update` | Update draft or revisions-requested portfolio record | Student only |
| `POST` | `/api/v1/portfolio/{id}/evidence` | `StudentPortfolioController::uploadEvidence` | Upload file attachment to local storage and link to record | Student only |
| `POST` | `/api/v1/portfolio/{id}/submit` | `StudentPortfolioController::submit` | Transition draft record to `submitted` status | Student only |
| `GET` | `/api/v1/verification/queue` | `VerificationQueueController::queue` | List submitted records pending verification | Verifiers (Coordinator, Moderator, OSAD) |
| `POST` | `/api/v1/verification/{id}/decide` | `VerificationQueueController::decide` | Approve (`verified`), reject (`rejected`), or return (`revisions_requested`) | Verifiers (Coordinator, Moderator, OSAD) |

---

### 2. Payload Structure for `POST /api/v1/portfolio`

```json
{
  "title": "Basketball Champion - NDMU Intramurals 2026",
  "category_id": "2d20d412-bf34-46b4-a21d-d7131d4b514a",
  "subcategory_id": "40000007-0001-0000-0000-000000000001",
  "organizer_or_body": "NDMU Sports Development Office",
  "occurrence_date": "2026-02-14",
  "description": "Point guard for champion varsity team",
  "structured_metadata": {
    "competition_type": "inter-collegiate",
    "event_level": "institutional",
    "placement": "champion",
    "academic_year": "2025-2026",
    "semester": "2nd Semester"
  },
  "submit_now": true
}
```
