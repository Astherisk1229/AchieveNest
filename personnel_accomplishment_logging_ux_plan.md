# NDMU Personnel Accomplishment Logging UX & Detailed Implementation Plan
**Document Version:** 2.0.0 (Category-Tailored Fields Revision)  
**System:** AchieveNest Student & Personnel Achievement Management Platform  
**Target Roles:** Personnel (Faculty & Staff), Department Secretary (`dep_sec`), Human Resources (`hr`)  
**Reference Document:** NDMU Rating Sheet for Ranking (Notre Dame of Marbel University)

---

## 1. Key UI / UX Improvement Recommendations

### A. Eliminate Generic Top-Level Fields & Flatten to a Single Dynamic Adaptive Form
* **The Issue with Generic Fields:** Displaying static fields like *"Title of Activity / Publication / Award"* and *"Sponsoring Org / Issuer"* at the top of the modal for **all** categories causes severe irrelevance. For example, when a user selects **A.1 Educational Qualifications / Degrees**, asking for *"Title of Activity"* or *"Sponsoring Org"* is confusing and inaccurate.
* **The Solution:** Use **Zero Static Generic Top Fields**. As soon as the user selects a Category (or launches from a shortcut chip), the form dynamically renders **only the specific, tailored fields** appropriate for that category.
* **Result:** No irrelevant field labels, reduced friction from 3 steps / 6 clicks down to **1 adaptive view / 2 clicks** (Fill & Submit).

---

### B. Category-Based Quick Action Shortcuts (Zero-Click Category Selection)
Instead of starting with a generic "Submit Accomplishment" modal:
* Provide quick action shortcut chips on the Personnel Dashboard:
  - `[+ Log Seminar/Training]`
  - `[+ Log Publication]`
  - `[+ Log Speaker / Consultancy]`
  - `[+ Log Org / Service]`
* Clicking any chip opens the modal with the Category pre-selected and its tailored fields already rendered.

---

### C. Smart Defaults & Live Point Preview Badge
* **Auto Academic Year:** Infer the Academic Year automatically based on the Date Achieved (e.g., selecting `08/03/2026` automatically sets `AY 2026-2027`).
* **Live Points Preview Badge:** Display an instant point badge in the modal header (e.g., `Estimated Points: +40.0 pts (Section A.1)`). This provides immediate visual feedback without clogging the screen.

---

## 2. Complete Category-Tailored Fields Breakdown

Below is the comprehensive matrix defining the exact, tailored fields required for each NDMU Category (with zero generic overlapping top fields):

### Area A: Professional Development (Section A)

#### A.1 Educational Qualifications / Degrees
* **Degree Level:** Ph.D. Holder (`40 pts`) | Ph.D. Units (`2 pts / 3 units`) | Master's Degree Holder (`20 pts`) | Master's Units (`1 pt / 3 units`)
* **Degree Title / Specialization:** Text (e.g., *Ph.D. in Computer Science*)
* **Conferring Institution / University:** Text (e.g., *Ateneo de Manila University*)
* **Units Completed (Only if Units option selected):** Number (e.g., `18 units`)
* **Date Conferred / Completed:** Date

#### A.2 Active Membership in Professional Organizations
* **Organization Name:** Text (e.g., *PSITE, Philippine Computer Society*)
* **Position / Role Held:** Officer (`10 pts`) | Regular Member (`5 pts`)
* **Specific Office Held (Only if Officer selected):** Text (e.g., *Vice President for External Affairs*)
* **Period Covered / School Year:** Text / School Year Dropdown

#### A.3 Attendance to Seminars / Trainings / Workshops
* **Seminar / Training Title:** Text (e.g., *National AI & Cloud Computing Summit 2026*)
* **Organizer / Issuing Entity & Venue:** Text (e.g., *CHED IX / NDMU Campus*)
* **Geographic Scope / Level:** In-House (`3 pts`) | City / Provincial (`4 pts`) | Regional (`6 pts`) | National (`8 pts`) | International (`10 pts`)
* **Date Conducted:** Date

---

### Area B: Productivity and Creative Work (Section B)

#### B.1 Guest Lecturer / Consultant / Judge / Resource Person
* **Event / Activity Title:** Text (e.g., *Keynote Address on Machine Learning in Analytics*)
* **Role Played:** Keynote Speaker (`10 pts`) | Resource Person / Consultant (`8 pts`) | Facilitator / Organizer (`6 pts`) | Judge / Evaluator (`5 pts`) | Reactor (`3 pts`)
* **Sponsoring Agency / Venue:** Text (e.g., *DOST Region XII / Ateneo*)
* **Scope / Level:** Local | Regional | National | International
* **Date Conducted:** Date

#### B.2 Publication (Scholarly Papers, Books, Articles)
* **Title of Published Work / Book:** Text (e.g., *Predictive Analytics in Higher Ed*)
* **Publication Type:** Book (`5 pts`) | Research Output (`5 pts`) | Scholarly Paper (`5 pts`) | Journal Article (`4 pts`) | Monograph (`4 pts`) | Compilation (`5 pts`)
* **Publisher / Journal Name & ISSN/ISBN:** Text (e.g., *IEEE Access Journal / ISSN 2169-3536*)
* **Reach / Scope:** Local | Regional | National | International / Scopus
* **Publication Date:** Date

#### B.3 Conduct of Research
* **Research Project Title:** Text (e.g., *AI-Driven Student Retention Framework*)
* **Research Role:** Lead Researcher | Co-Researcher
* **Funding Status / Source:** Completed Institutional (`15 pts`) | Externally Funded Project (`20 pts`) | Ongoing Commissioned (`10 pts`)
* **Completion Date:** Date

#### B.4 Professional Recognition or Awards
* **Award Title / Honor Received:** Text (e.g., *Outstanding Research Faculty of the Year*)
* **Conferring Body / Institution:** Text (e.g., *Notre Dame of Marbel University*)
* **Recognition Type:** Awardee | Nominee
* **Award Scope:** Local (`10 pts`) | Provincial / Regional (`30 pts`) | National / International (`40 pts`)
* **Date Conferred:** Date

#### B.5 Production of Instructional Materials
* **Title of Instructional Material:** Text (e.g., *Laboratory Manual for Data Structures*)
* **Material Type:** Workbooks / Exercises / Lecture Notes (Bound - `20 pts`) | Modules (Bound - `10 pts`) | Reviewers (Bound - `10 pts`) | Audio-Visual Aids / Software (`10 pts`)
* **Subject / Course Code Used In:** Text (e.g., *ITE 311 - Data Structures*)
* **Date Produced / Implemented:** Date

#### B.6 Creative Work
* **Description / Title of Creative Output:** Text (e.g., *University Digital Archiving Software*)
* **Venue / Medium / Exhibition:** Text
* **Release / Exhibition Date:** Date

---

### Area C: Service and Leadership (Section C)

#### C.1 School Involvement (Extracurricular / Organizations)
* **Service Sub-Type:**
  - C.1.1 Moderator of Clubs / Organizations (`20 pts max`)
  - C.1.2 Coach / Trainer (`20 pts max`)
  - C.1.3 Membership in Working Committees (`20 pts max`)
  - C.1.4 Intramurals / Special Event Service (`20 pts max`)
* **Name of Club / Committee / Event:** Text (e.g., *Computer Science Student Society*)
* **School Year / Period Covered:** Text / School Year Dropdown

#### C.2 Community & Civic Involvement
* **Service Sub-Type:**
  - C.2.1 Active Church Involvement (`25 pts max`)
  - C.2.2 Community / Civic Involvement (`25 pts max`)
  - C.2.3 Support to Charity & Community Projects (`5 pts max`)
* **Service Project / Outreach Description:** Text (e.g., *Barangay Smart Literacy Program*)
* **Sponsoring LGU / NGO / Parish Name:** Text (e.g., *Koronadal City LGU / Marist Parish*)
* **Date / Period Covered:** Date Range

---

## 3. Summary of Comparison

| Feature | Legacy 3-Step Wizard | Previous Shared Top Fields | Proposed Tailored Dynamic Card |
| :--- | :--- | :--- | :--- |
| **Field Relevance** | Low (Generic step inputs) | Poor (Irrelevant *"Title of Activity"* shown for Degrees) | **100% Relevant (Zero generic top fields; all fields category-specific)** |
| **Total Clicks to Submit** | 5 – 7 Clicks | 2 – 3 Clicks | **2 Clicks (Fill & Save)** |
| **Live Points Feedback** | Visible only at end | Header badge | **Real-time estimated points badge in header (`+40.0 pts`)** |
| **User Experience** | High friction | Slight clutter from generic fields | **Ultra-clean, zero-friction adaptive form** |

---

## 4. Multi-Phase Implementation Plan

### Phase 1: Comprehensive Refactoring of `PersonnelSubmissionModal.jsx` [x] COMPLETED
* **[x] Task 1.1: Remove Static Generic Top Fields**
  - Deleted static generic inputs (`title`, `issuingEntity`) from the top of the form layout.
* **[x] Task 1.2: Implement 100% Dynamic Category Field Components**
  - Built dynamic form templates for each of the 10 NDMU categories using the tailored field breakdown matrix.
* **[x] Task 1.3: Dynamic Field State Binding & Validation**
  - Mapped title and issuer properties dynamically from category-tailored inputs (`degreeTitle` $\rightarrow$ `title`, `institution` $\rightarrow$ `issuer`, `pubTitle` $\rightarrow$ `title`, `publisherIssn` $\rightarrow$ `issuer`).
* **[x] Task 1.4: Real-Time Points & Required Proof Hint Banners**
  - Computed points live in header badge (`Estimated: +X.X pts`) and rendered exact required proof hint banner (`Required Evidence: Official Diploma / Transcript of Records (TOR)`).

---

### Phase 2: Dashboard Shortcut Chips & Integration (`PersonnelDashboard.jsx`) [x] COMPLETED
* **[x] Task 2.1: Add Category Shortcut Chips**
  - Connected quick action chips (`[+ Log Seminar]`, `[+ Log Publication]`, `[+ Log Speaker]`, `[+ Log Org/Service]`) to launch the refactored modal with pre-selected category and tailored fields.

---

### Phase 3: Automated Testing & Build Audit [x] COMPLETED
* **[x] Task 3.1: Unit Test Verification (`scratch/test_tailored_modal.js`)**
  - Executed `node scratch/test_tailored_modal.js` — **PASSED** (Mapping of tailored category fields verified).
* **[x] Task 3.2: Production Build Verification**
  - Executed `npx vite build` — **1,840 modules transformed cleanly in 2.13s with 0 errors**.
