# AchieveNest — Student Achievement Entry & Dynamic Category-Based Structured Forms
## Final Student Interaction & Verification Workflow

---

### 1. Student Interaction Flow

```text
[1. Open Achievement Modal]
        │
        ▼
[2. Enter Basic Information] (Title, Organizer / Issuing Body, Start Date, End Date, Contextual Description)
        │
        ▼
[3. Select Primary Category] (1 of 9 Authoritative Categories)
        │
        ▼
[4. Select Subcategory] (Dynamically filtered by Category)
        │
        ▼
[5. Fill Structured Details] (Dynamic inputs: Role, Tier, Scope, Placement, etc.)
        │
        ▼
[6. Attach Evidence Files] (Certificates, Program Sheets, Photos via Canonical Uploader)
        │
   ┌────┴──────────────────────────┐
   ▼                               ▼
[Save Draft]                   [Submit for Verification]
(status = 'draft',             (status = 'submitted',
 incomplete allowed)            full validation enforced)
```

---

### 2. Category / Subcategory Discard UX

- If the student modifies the selected Category or Subcategory after entering non-trivial structured data:
  - The system triggers a **Discard Confirmation Modal**.
  - If confirmed: Category-specific structured inputs are cleared, but **Basic Information (Title, Organizer, Dates, Description) and Evidence Attachments are preserved**.
  - If canceled: The previous selection and entered details remain untouched.

---

### 3. Verification & Evaluation Lifecycle

1. **Draft (`draft`)**: Saved by student for future editing. Excluded from verification queue; excluded from award scoring.
2. **Submitted (`submitted`)**: Enters the assigned Program Coordinator's verification queue (`GET /api/v1/program-coordinator/verification-queue`).
3. **Under Review (`under_review`)**: Coordinator or OSAD reviews factual details and evidence.
4. **Revisions Requested (`revisions_requested`)**: Returned to the student with remarks for correction.
5. **Verified (`verified`)**: Confirmed by authorized personnel. Now eligible for internal OSAD award mapping.
6. **Rejected (`rejected`)**: Denied due to invalidity or policy violation. Excluded from scoring.
