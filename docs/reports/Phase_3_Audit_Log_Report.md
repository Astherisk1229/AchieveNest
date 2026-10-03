# Phase 3 — Audit Log and Decision Traceability Report
## Verification Decision History, Event Schemas, and Notification Pipeline

**Domain:** Audit Trail & Traceability  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:40:00 UTC+08:00  

---

## 1. Authoritative Audit Table Schema: `student_portfolio_verification_events`

Every transition affecting a student's portfolio verification state is immutably logged to the database:

```sql
CREATE TABLE IF NOT EXISTS public.student_portfolio_verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_record_id uuid NOT NULL REFERENCES public.student_portfolio_records(id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('submitted','revision_requested','resubmitted','verified','rejected')),
  previous_status text,
  new_status text NOT NULL,
  remarks text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 2. Event Types and Payload Examples

### 2.1 Event: `PORTFOLIO_SUBMITTED`
```json
{
  "id": "e0a1b2c3-d4e5-f6a7-b8c9-d0e1f2a3b4c5",
  "portfolio_record_id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
  "actor_profile_id": "std_001_profile_uuid",
  "action": "submitted",
  "previous_status": null,
  "new_status": "submitted",
  "remarks": "Submitted for Program Coordinator verification",
  "occurred_at": "2025-10-15 14:30:00"
}
```

### 2.2 Event: `PORTFOLIO_VERIFIED`
```json
{
  "id": "e0a1b2c3-d4e5-f6a7-b8c9-d0e1f2a3b4c6",
  "portfolio_record_id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
  "actor_profile_id": "coord_001_profile_uuid",
  "action": "verified",
  "previous_status": "submitted",
  "new_status": "verified",
  "remarks": "Verified publication against official December issue masthead.",
  "occurred_at": "2025-10-16 09:15:22"
}
```

### 2.3 Event: `PORTFOLIO_REVISION_REQUESTED`
```json
{
  "id": "e0a1b2c3-d4e5-f6a7-b8c9-d0e1f2a3b4c7",
  "portfolio_record_id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
  "actor_profile_id": "coord_001_profile_uuid",
  "action": "revision_requested",
  "previous_status": "submitted",
  "new_status": "revisions_requested",
  "remarks": "Please provide a higher-resolution scan of the editorial byline.",
  "occurred_at": "2025-10-16 09:18:40"
}
```

---

## 3. Real-Time Notification Pipeline Integration

Upon every review decision (`verified`, `revisions_requested`, `rejected`), the system emits a mandatory notification to the student:

```sql
INSERT INTO notifications (
    id,
    recipient_profile_id,
    actor_profile_id,
    notification_type,
    title,
    message,
    reference_type,
    reference_id,
    is_mandatory,
    created_at
) VALUES (
    'notif_uuid',
    'student_profile_id',
    'actor_profile_id',
    'portfolio_verified',
    'Portfolio Submission Verified',
    'Your portfolio submission \'Editorial: AI Ethics\' has been updated to verified. Remarks: Verified publication against official issue masthead.',
    'student_portfolio_records',
    'portfolio_record_id',
    1,
    NOW()
);
```
