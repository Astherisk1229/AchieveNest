# Phase 3 — Verification API Map
## Endpoints, Request Schemas, Response Contracts, and Error Responses

**Domain:** Verification API Contract  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:40:00 UTC+08:00  

---

## 1. Summary of Verification Endpoints

| HTTP Method | Route / Endpoint | Authorized Roles | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/program-coordinator/verification-queue` | Program Coordinator, OSAD | Fetches reviewable pending portfolio submissions for scoped program. |
| `POST` | `/api/v1/portfolio/{id}/verify` | Program Coordinator, OSAD | Approves a submitted record, transitioning status to `verified`. |
| `POST` | `/api/v1/portfolio/{id}/request-revision` | Program Coordinator, OSAD | Returns record to student with required feedback remarks. |
| `POST` | `/api/v1/portfolio/{id}/reject` | Program Coordinator, OSAD | Rejects record with required justification remarks. |
| `POST` | `/api/v1/portfolio/{id}/resubmit` | Student (Owner) | Resubmits revised record back to verification queue. |

---

## 2. API Request and Response Specifications

### 2.1 Verify Record (`POST /api/v1/portfolio/{id}/verify`)
- **Headers:** `Authorization: Bearer <jwt_token>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "remarks": "Verified publication against official December issue masthead."
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "data": {
      "message": "Record successfully verified.",
      "id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
      "status": "verified",
      "action": "verified"
    }
  }
  ```

### 2.2 Request Revision (`POST /api/v1/portfolio/{id}/request-revision`)
- **Request Body:**
  ```json
  {
    "remarks": "Please provide a higher-resolution scan of the editorial byline."
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "data": {
      "message": "Record successfully revisions_requested.",
      "id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
      "status": "revisions_requested",
      "action": "revisions_requested"
    }
  }
  ```

### 2.3 Reject Record (`POST /api/v1/portfolio/{id}/reject`)
- **Request Body:**
  ```json
  {
    "remarks": "The submitted article is an unpublished personal blog post, not an official campus publication."
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "data": {
      "message": "Record successfully rejected.",
      "id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
      "status": "rejected",
      "action": "rejected"
    }
  }
  ```
