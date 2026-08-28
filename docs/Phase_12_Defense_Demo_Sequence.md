# Phase 12 Defense Demo Sequence

This document provides the recommended presentation script and action sequence for demonstrating AchieveNest during the prefinal defense.

---

## Presentation Workflow Sequence

### 1. Student Submission & Taxonomy Walkthrough
1. **Login as Demo Student A** (`demo.student.a@ndmu.edu.ph`).
2. **View Student Dashboard & Portfolio Taxonomy**:
   - Showcase the 9 authoritative categories and 57 subcategories rendered locally from MySQL.
3. **Inspect Existing Records**:
   - `DEMO-PORT-01`: Draft research paper (editable, private to Student).
   - `DEMO-PORT-02`: Submitted leadership record with PDF evidence attached.
   - `DEMO-PORT-03`: Verified regional hackathon achievement (already verified for awards).
   - `DEMO-PORT-04`: Revision requested with Coordinator remarks.
   - `DEMO-PORT-05`: Sports achievement with structured metadata attributes.
4. **Live Action Candidate**: Upload evidence and submit a new accomplishment or resubmit `DEMO-PORT-04`.

---

### 2. Cross-Program Denial Demonstration (Security Boundary)
1. **Login as Demo Coordinator B** (`demo.coordinator.b@ndmu.edu.ph`).
   - Assigned Program: `BSBA-FM`.
2. **Attempt Access to Student A Verification Queue**:
   - Navigate to `/api/v1/program-coordinator/verification-queue` or attempt to review Student A (`BSA`) records.
   - **Expected Outcome**: Access strictly denied (`403 Forbidden` / records filtered out). Proves program-scoped check-and-balance.

---

### 3. Program Coordinator Verification Workflow
1. **Login as Demo Coordinator A** (`demo.coordinator.a@ndmu.edu.ph`).
   - Assigned Program: `BSA`.
2. **Open Verification Queue**:
   - View `DEMO-PORT-02` (President of NDMU JPIA).
3. **Stream Protected Evidence**:
   - Download/view `CSS_President_Appointment_Order.pdf` streamed via authenticated backend endpoint.
4. **Take Verification Action**:
   - Verify the record or enter revision remarks.
   - Notification immediately dispatched to Student A.

---

### 4. OSAD Honors & Awards Evaluation Workflow
1. **Login as Demo OSAD Administrator** (`demo.osad.admin@ndmu.edu.ph`).
2. **View Active Award Cycle**:
   - Inspect `AY 2025-2026 Annual Student Honors & Awards`.
3. **Evaluate Potential Candidates**:
   - Trigger automated evaluation against verified achievements.
   - Student A evaluates with 80%+ threshold based on verified achievements.
4. **View Dean Nomination**:
   - Inspect independent endorsement letter submitted by the Dean of CBA.

---

### 5. Personnel Accomplishments & HR Ranking Oversight
1. **Login as Demo Academic Personnel** (`demo.academic.personnel@ndmu.edu.ph`).
   - View submitted research paper publication (`IEEE Transactions`).
2. **Login as Demo HR Administrator** (`demo.hr.admin@ndmu.edu.ph`).
   - View Personnel Directory across academic and non-academic classifications.
   - Inspect Administrator Ranking Scale (Professional Development, Productivity/Creative Work, Service/Leadership).

---

### 6. Organization Moderator Scoped View
1. **Login as Demo Moderator** (`demo.moderator@ndmu.edu.ph`).
   - Access designated student organization (`DEMO_JPIA`).
   - Perform collegiate governance reviews.
