# AchieveNest User Role Input & Transaction Requirements Reference

This document details all required data input fields and parameters for every user role across all system transactions in the **AchieveNest Student & Personnel Achievement Management Platform**.

---

## 1. Student (`Student`)

### Transaction 1: Submitting an Achievement Claim
When a student submits an achievement for validation and portfolio inclusion:
* **Achievement Title**: Full title of the achievement, competition, or recognition.
* **Category**: Classification selection (*Academic, Leadership, Sports, Culture & Arts, Social Involvement, Research & Innovation, Certifications & Skills*).
* **Scope / Level**: Achievement tier (*Institutional, Regional, National, International*).
* **Date Completed / Awarded**: Date when the achievement was completed or the award was received.
* **Organizing Entity / Awarding Body**: Organization, institution, or body that issued the recognition.
* **Venue / Location**: Physical venue or online platform where the event took place.
* **Description / Summary**: Detailed summary of the achievement, roles held, and key outcomes.
* **Verification Proof File**: Uploaded document or photo (*PDF, PNG, JPG*) serving as evidence (e.g., certificate, medal photo, program bulletin).
* **Co-Authors / Group Members** *(Optional)*: Student IDs or names of co-participants if a group submission.
* **Skills / Tags** *(Optional)*: Associated competencies learned (*e.g., Web Development, Public Speaking*).

### Transaction 2: Updating Student Profile Information
When a student updates their personal account profile:
* **Full Name**: Student's registered full name.
* **Student ID Number**: Official NDMU student barcode ID number (*e.g., 2023-10492*).
* **Program & Course**: Enrolled degree program (*e.g., BS Computer Science*).
* **Year Level**: Current academic standing (*1st Year, 2nd Year, 3rd Year, 4th Year*).
* **College / Department**: Affiliated college (*e.g., CEAC - College of Engineering, Architecture, and Computing*).
* **NDMU Email Address**: Official institutional email address.
* **Contact Number**: Phone number for institutional notifications.
* **Personal Statement / Bio**: Brief self-summary for the achievement portfolio.
* **Profile Avatar**: Uploaded user profile picture.

### Transaction 3: Exporting & Filtering Student Achievement Portfolio
When a student generates their official achievement portfolio report:
* **Date Range Filter**: Start Date and End Date boundaries for included achievements.
* **Category Filter**: Multi-select options to filter included achievement categories.
* **Purpose of Export**: Intended recipient/use case (*Scholarship Application, Job/Employment, OSAD Accreditation, Graduate School Application*).
* **Portfolio Template Style**: Selection of layout theme (*Modern Slate, Professional Executive, Classic Academic*).
* **Custom Evaluator Cover Note**: Personal statement or letter to evaluators included in the header of the exported document.
* **Export Format**: Selected file format (*PDF Document, Digital Portfolio Link*).

### Transaction 4: Event Attendance Check-In (Barcode Scanning)
When a student presents their ID for event attendance check-in:
* **Digital Barcode / QR Code String**: Encrypted barcode representation of Student ID scanned by Student Officers.

---

## 2. Personnel (Faculty & University Staff) (`Personnel`)

### Transaction 1: Submitting a Professional Accomplishment
When a faculty or staff member submits a professional achievement:
* **Accomplishment Title**: Official title of the research, publication, certification, or extension service.
* **Accomplishment Type**: Classification selection (*Research Publication, Extension Service, Faculty Training / Seminar, Professional Certification, Award & Recognition, Community Leadership*).
* **Date of Completion**: Date when the activity or publication was completed.
* **Venue / Publisher / Issuer**: Organization, journal publisher, or agency granting the recognition.
* **Target Alignment**: Institutional alignment (*Institutional Development, Department Goals, Extension Service*).
* **Detailed Summary**: Full description of contribution, methodologies, and institutional impact.
* **Supporting Documents**: Uploaded proof file (*PDF, PNG, JPG*) such as publication copy, invitation, or certificate of completion.
* **Co-Faculty / Collaborators** *(Optional)*: Names of co-authors or co-investigators.

### Transaction 2: Updating Personnel Profile & Credentials
When faculty or staff update their professional profile:
* **Full Name & Academic Titles**: Name with titles (*e.g., Dr. Maria Santos, Ph.D.*).
* **Employee ID Number**: NDMU faculty/staff identification number.
* **Academic Rank / Designation**: Position rank (*Assistant Professor, Associate Professor, Staff*).
* **Department / Unit**: Affiliated department or administrative unit.
* **Specialization & Research Interests**: Fields of expertise.
* **Institutional Email & Contact Number**: Official contact details.
* **Office Location & Hours**: Office room assignment and consultation schedule.

### Transaction 3: Generating Professional Accomplishment Report
When faculty/staff compile reports for evaluation or promotion:
* **Evaluation Period**: Academic Year and Semester selection.
* **Category Filters**: Selected accomplishment types to include.
* **Target Recipient**: Destination authority (*HR Office, Department Chair, Promotion Board*).
* **Output Format**: Export choice (*PDF Summary Report, CSV Spreadsheet*).

---

## 3. Program Coordinator (`Program Coordinator`)

### Transaction 1: Reviewing & Verifying Student Achievement Claims
When a Program Coordinator reviews a student's submitted achievement:
* **Verification Decision**: Selection (*Approve & Verify, Request Revision, Reject*).
* **Verification Remarks / Feedback**: Mandatory written feedback explaining the decision, required corrections, or approval notes.
* **Category / Point Weight Override** *(Optional)*: Adjustment to the scope or point assignment of the achievement.
* **Digital Verification Stamp**: Evaluator signature authorization.

### Transaction 2: Batch Verification & Bulk Endorsement
When verifying multiple student submissions simultaneously:
* **Selected Submissions List**: Multi-select list of pending student achievement claims.
* **Bulk Verification Note**: Common review comment applied across all selected claims.
* **Batch Action Trigger**: Single action execution (*Bulk Approve, Bulk Request Revision*).

### Transaction 3: Student Roster Management & Record Overrides
When managing enrolled students in the department:
* **Search & Filter Parameters**: Search queries (*Student ID, Name, Program, Year Level, Verification Status*).
* **Manual Student Record Update**:
  * Status Override (*Active, On-Leave, Graduated*).
  * Program / Course Transfer.
  * Standing Correction Notes.

### Transaction 4: Compiling Program Accreditation & Analytics Reports
When generating department-level compliance metrics:
* **Academic Term & Year Range**: Selected academic period.
* **Program Selection**: Specific degree program or multi-program view.
* **Accreditation Criteria Baseline**: Compliance standard selection (*PACUCOA Standard, CHEd Requirement, Institutional Benchmark*).
* **Report Output Format**: Export option (*PDF Executive Summary, Detailed CSV Roster*).

---

## 4. Organization Moderator (`Organization Moderator`)

### Transaction 1: Creating a Campus Event
When an Organization Moderator registers a new organization event:
* **Event Title**: Name of the event (*e.g., Computer Society Tech Summit 2026*).
* **Event Category**: Type of activity (*Summit, Workshop, Competition, Seminar, Community Service, General Assembly*).
* **Scheduled Date & Time**: Event date and start/end time schedule.
* **Venue Location**: Physical room or facility location (*e.g., NDMU Convention Center*).
* **Event Description & Objectives**: Narrative overview of the event purpose and target outcomes.
* **Target Audience**: Intended participants (*e.g., All College Students & Faculty, CEAC Students Only*).
* **3D Banner Graphic Type**: Graphic theme selection for event card rendering.
* **Attendance Check-In Window**: Start time and End time when student check-in is allowed.
* **OSAD Certificate Template**: Assigned official certificate format (*e.g., OSAD-TPL-01 to OSAD-TPL-05*).
* **Verified Signatories**:
  * Primary Signatory Name & Designation (*e.g., Club Moderator*).
  * Secondary Signatory Name & Designation (*e.g., OSAD Director*).

### Transaction 2: Editing & Managing Event Status
When updating an existing event:
* **Updated Event Metadata**: Editable fields (*Title, Schedule, Venue, Description, Attendance Window*).
* **Event Status Override**: Manual lifecycle state selection (*Upcoming, Ongoing, Completed, Archived*).

### Transaction 3: Managing Live Attendance Sessions & Officer Duty Link
When managing live attendance scanning for an event:
* **Session Control Action**: Command execution (*Start Live Scanning, Pause / Lock Session, Force Close Session*).
* **Auto-Lock Guard Toggle**: Enable/disable automated session locking.
* **Manual Student Attendance Override**:
  * Student ID Number.
  * Student Full Name & Program.
  * Override Reason Note.
* **Session Safeguard Confirmation**: Confirmation prompt execution for high-risk session overrides.

### Transaction 4: Updating Organization Profile
When editing student organization account details:
* **Organization Full Name**: Registered name (*e.g., Computer Society NDMU*).
* **Organization Code / Acronym**: Official acronym (*e.g., CEAC*).
* **Department Affiliation**: Associated college or department unit.
* **Academic Year**: Active academic year.
* **Faculty Adviser Name**: Appointed faculty adviser.
* **Description & Mission**: Organizational summary.
* **Contact Email**: Official organization email.
* **Social Media Link**: Facebook page or website URL.
* **Established Year**: Foundation year.

### Transaction 5: Issuing Digital Certificates & Exporting Attendance CSV
When finalizing event attendance:
* **Certificate Delivery Action**: Dispatch trigger (*Manual Dispatch, Auto-Dispatch on Session Close*).
* **CSV Export Filters**: Attendance filter selection (*All Scanned Attendees, Verified Only*).

---

## 5. Department Secretary (`Department Secretary`)

### Transaction 1: Reviewing Faculty Accomplishment Submissions
When reviewing department faculty/staff accomplishments before HR submission:
* **Review Decision**: Action choice (*Endorse to HR Office, Return to Faculty for Revision*).
* **Secretary Feedback Remarks**: Required feedback text explaining the decision or requesting additional documentation.
* **Evidence Check**: Verification confirmation of attached supporting documents.

### Transaction 2: Batch Endorsement to HR Office
When forwarding verified department accomplishments to HR:
* **Selected Faculty Accomplishments**: Multi-select checklist of verified faculty submissions.
* **Batch Cover Letter / Endorsement Note**: Official cover letter note attached to the batch.

### Transaction 3: Managing Department Personnel Roster
When maintaining department staff assignments:
* **Roster Filter Criteria**: Department unit, academic rank, or employment status.
* **Faculty Assignment Update**:
  * Department Assignment.
  * Committee & Administrative Roles.

---

## 6. OSAD - Office of Student Affairs & Services (`OSAD Administrator`)

### Transaction 1: Managing Official OSAD Certificate Templates
When creating or updating institutional certificate formats:
* **Template Title & ID**: Official template designation (*e.g., OSAD-TPL-01 Certificate of Participation*).
* **Institutional Graphic Assets**: Uploaded watermarks, security seals, and border designs.
* **Accreditation Standard Mapping**: Category mapping (*Institutional Leadership, Extension, Academic Excellence*).
* **Signatory Slot Configurations**: Roles and layout positions for required signatures.

### Transaction 2: Organization Accreditation & Renewal Review
When reviewing annual student organization recognitions:
* **Accreditation Decision**: Status selection (*Recognized, Probation, Pending Renewal, Revoked*).
* **Submitted Document Checklist**:
  * Officer Roster Verification.
  * Constitution & By-Laws Document.
  * Financial Report Approval.
* **Accreditation Assessment Remarks**: Detailed OSAD evaluation notes and recommendations.

### Transaction 3: Global Achievement Audit & Dispute Override
When auditing student achievement submissions across the university:
* **Audit Action**: Decision (*Confirm Verification, Revoke Approval, Flag for Re-Investigation*).
* **Dispute Resolution Notes**: Written justification for audit interventions or overrides.

### Transaction 4: University Institutional Accreditation Reporting
When producing university-wide achievement compliance reports:
* **Academic Term & Year Range**: Selected multi-year or semester range.
* **College / Department Selection**: University-wide or specific college selection.
* **Accreditation Agency Standards**: Target framework (*PACUCOA, CHEd Institutional Quality, ISO*).
* **Report Customization Parameters**: Executive notes, metric inclusion toggles, and export format (*PDF, Excel CSV*).
