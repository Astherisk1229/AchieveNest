# AchieveNest Student Portal — Comprehensive System Features & Specification

> **Document Version**: 1.0  
> **Target Audience**: Students, Developers, System Administrators, Program Coordinators  
> **System Scope**: AchieveNest Student Co-Curricular & Academic Achievement Tracking System  

---

## 📋 Executive Overview

The **AchieveNest Student Portal** is a web-based platform designed to enable students to log, track, manage, verify, and showcase their academic accomplishments, co-curricular activities, leadership roles, and community involvement. It bridges the gap between student achievement logging and institutional verification by Program Coordinators and OSAD (Office of Student Affairs and Development).

---

## 📂 Core Architecture & System Foundations

The Student Portal strictly adheres to the **OOP (Object-Oriented Programming)** and **MVC (Model-View-Controller)** paradigm:

- **Domain Models (`src/models/`)**: Encapsulate student entity schemas, achievement validation rules, and status state logic ([UserModel.js](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/models/UserModel.js), `StudentModel`, `AchievementModel`).
- **Controllers (`src/controllers/`)**: Business logic for achievement submissions, portfolio compilations, CSV exports, and verification workflow processing.
- **Bridge Hooks (`src/hooks/`)**: Connect View components to Controllers via reactive React hooks.
- **Views & Pages (`src/pages/`, `src/components/student/`)**: High-aesthetic, responsive user interface designed with modern tailwind aesthetics, smooth micro-animations, green certificate themes, and accessible layouts.

---

## 🚀 Key Student Modules & Feature Breakdown

```
+-----------------------------------------------------------------------------+
|                            STUDENT PORTAL MODULES                           |
+-----------------------------------------------------------------------------+
| 1. Student Dashboard                | Overview, Quick Stats, Digital Barcode  |
| 2. Achievements Management Catalog  | Log, Filter, View & Edit Achievements   |
| 3. Achievement Submission Engine    | Multi-step Form & Document Upload       |
| 4. Student Portfolio & Canva Export | Curated Showcase & PDF Portfolio Builder|
| 5. Digital Student ID Barcode Card  | Campus Event Attendance Scanner Link    |
| 6. Account & Security Center        | Profile Settings, Password & 2FA        |
| 7. Real-Time Notification System    | Verification Alerts & Reviewer Feedback |
+-----------------------------------------------------------------------------+
```

---

### 1. 📊 Student Dashboard (`/student/dashboard`)

The central command hub for the student upon logging into AchieveNest.

#### Key Features:
- **Personalized Header Banner**:
  - Displays Student Name, Student ID (`STU-XXXX-XXXX`), Program/Degree, Year Level, and Profile Photo.
  - Verification Badge indicator (e.g., *Active Enrolled Student*).
- **KPI Statistical Cards**:
  - **Total Achievements**: Total number of logged accomplishments across all categories.
  - **Verified Achievements**: Count of achievements officially approved by Program Coordinators / OSAD.
  - **Pending Review**: Submissions currently under coordinator evaluation.
  - **Portfolio Completeness / Total Points**: Aggregated score/percentage towards co-curricular graduation requirements.
- **Digital Barcode ID Quick Access**:
  - Floating or embedded widget displaying the student's scannable digital barcode ID for fast event entry.
- **Quick Action Launchers**:
  - `Submit New Achievement`: Instantly launches the achievement submission modal.
  - `View Achievements Catalog`: Navigates to full filterable achievements list.
  - `Export Portfolio`: Opens the portfolio preview & export builder.
- **Activity & Verification Timeline**:
  - Real-time chronological log of recent submissions and review status changes (Verified, Pending Review, Returned with comments).
- **Category Filter Quick Pills**:
  - Quick-toggle category filter buttons (Academic, Leadership, Seminars, Competitions, Extension Services).

---

### 2. 🏆 Achievements Management Catalog (`/student/achievements`)

A centralized catalog where students can explore, search, filter, and manage all their logged achievements.

#### Key Features:
- **Dual View Layout Switcher**:
  - **Grid View**: Certificate-style graphic cards featuring green certificate top banners, category tags, date badges, and status pills.
  - **List View**: Compact horizontal row view ideal for dense listing and fast scanning.
- **Rich Search & Filtering Engine**:
  - **Text Search**: Real-time keyword search across achievement titles, issuing bodies, host organizations, and locations.
  - **Category Filters**:
    - *Academic Excellence* (Dean's List, Academic Honors, Scholarships)
    - *Leadership & Student Organizations* (Student Council, Org Officer, Committee Chair)
    - *Seminars & Workshops* (Attended or Facilitated Professional/Skill Trainings)
    - *Competitions & Awards* (Inter-school, Regional, National, International contests)
    - *Community Service & Extension* (Outreach programs, Volunteering, Community Extension)
    - *Co-Curricular & Special Projects* (Exhibits, Capstone Showcases, Publications)
  - **Status Filters**: Filter by `All`, `Verified`, `Pending Review`, `Returned`.
- **Card Context Actions (3-Dot Options Menu)**:
  - **View Details**: Full modal preview of the achievement and attached proof document.
  - **Edit Submission**: Edit details for pending or returned submissions.
  - **Download Proof**: Download the attached certificate file (PDF, PNG, JPG).
  - **Copy Reference ID**: Copy the submission reference code to clipboard.
  - **Delete Submission**: Remove unverified or draft submissions.
- **Data Export Feature**:
  - **Export CSV**: One-click download of the filtered achievements table as a structured CSV report for official academic records.

---

### 3. 📝 Achievement Submission Engine (`/components/student/AchievementSubmissionModal.jsx`)

An intuitive, guided modal form allowing students to submit new accomplishments along with supporting evidence for verification.

#### Key Features:
- **Form Fields & Metadata Capture**:
  - **Title of Accomplishment**: Exact name of award, certificate, seminar, or position.
  - **Category Selection**: Standardized dropdown mapped to co-curricular scoring guidelines.
  - **Event / Achievement Date**: Date of issuance or event completion.
  - **Issuing Agency / Organization**: Host institution, organization, or university body.
  - **Scope / Level**: Institutional, Municipal, Regional, National, or International.
  - **Description & Remarks**: Brief detail on responsibilities, achievements, or honors received.
- **Proof Document Uploader**:
  - Drag-and-drop or click-to-upload interface supporting PDF, PNG, JPG formats.
  - File size validation and instant file attachment preview.
- **Real-Time Verification Workflow Status**:
  - Automatically initializes submission status to `Pending Review`.
  - Routes submission to the designated Program Coordinator or OSAD Officer verification queue.

---

### 4. 🎨 Student Portfolio & Canva Export Engine (`/student/portfolio`)

A showcase and compilation module where students transform their verified achievements into a professional co-curricular portfolio.

#### Key Features:
- **Curated Achievements Showcase**:
  - Displays top featured verified achievements.
  - Groups accomplishments by category and academic year.
- **Student Profile Info Editor (`EditStudentInfoModal.jsx`)**:
  - Allows updating contact info, career objectives summary, personal bio, major, and specialization.
- **Export Portfolio Builder & Preview (`ExportPortfolioPreviewModal.jsx`)**:
  - **Template Selection**:
    - *Executive Modern*: Sleek green-accented corporate layout.
    - *Minimalist Academic*: Clean formal layout suited for graduate school/scholarships.
    - *Vibrant Portfolio*: Modern dynamic layout with graphics and badges.
  - **Customization Controls**:
    - Toggle profile picture inclusion.
    - Select specific achievements to include or exclude.
    - Toggle scannable verification QR code badge (verifies authenticity on campus portal).
  - **Live Print & Export**:
    - Real-time printable preview modal.
    - Export directly to high-resolution PDF or trigger browser print engine.

---

### 5. 💳 Digital Student ID & Barcode Attendance Link (`DigitalBarcodeIDCard.jsx`)

A virtual student ID card enabling contactless event attendance logging across campus.

#### Key Features:
- **Scannable Barcode & QR Display**:
  - Generates high-contrast Code-128 barcode and QR code derived from the student's unique ID (`STU-XXXX-XXXX`).
- **Campus Event Integration**:
  - Event officers using the Officer Scanner (`/scanner/:eventId`) can scan the student's digital ID to instantly record co-curricular event attendance.
- **Automatic Attendance Logging**:
  - Attended events automatically log co-curricular attendance points into the student's achievement timeline.

---

### 6. 🔐 Account & Security Management (`/student/account` & `/student/settings`)

Comprehensive user account management and security preferences.

#### Key Features:
- **Profile Photo & Avatar Upload**: Update personal profile image.
- **Password Management**: Change password with validation requirements.
- **Two-Factor Authentication (2FA)**: View 2FA security status.
- **Active Session Audit**: View active devices and sessions logged into the student account.
- **System Theme & Notification Preferences**: Toggle email notification alerts for submission review updates (Approved, Returned, Feedback Added).

---

### 7. 🔔 Real-Time Notification Center (`/student/notifications`)

Stay updated on achievement review statuses and campus announcements.

#### Key Features:
- **Verification Alerts**: Instant notification when a submission status changes (`Verified`, `Returned for Revision`, `Document Requested`).
- **Reviewer Feedback Display**: View comments left by Program Coordinators explaining why a document needs revision.
- **Read / Unread Filtering**: Filter notifications and mark all as read.

---

## 🛠️ Data Model & Verification Flow Diagram

```
 +------------------+      Submits       +-----------------------+
 |  Student User    | -----------------> | AchievementSubmission |
 +------------------+                    +-----------------------+
          |                                          |
          | Views / Exports                          | Status: "Pending Review"
          v                                          v
 +------------------+                    +-----------------------+
 | Digital Portfolio|                    | Verification Queue    |
 | & Barcode ID     |                    | (Program Coordinator) |
 +------------------+                    +-----------------------+
                                                     |
                                            Evaluates / Approves
                                                     v
                                         +-----------------------+
                                         | Status: "Verified"    |
                                         | (Points Awarded)      |
                                         +-----------------------+
```

---

## 📌 Summary of Student User Capabilities

| Feature Area | Primary Action | Result / Output |
| :--- | :--- | :--- |
| **Dashboard** | View metrics & quick links | Real-time overview of points, achievements, and barcode ID |
| **Achievement Catalog** | Search, filter, switch grid/list | Interactive catalog with CSV export option |
| **Submission Modal** | Upload document proof & metadata | Submission enters coordinator verification queue |
| **Portfolio Builder** | Choose template & customize | Professional PDF portfolio for job applications |
| **Digital Barcode ID** | Display barcode for scanner | Instant attendance recording at campus events |
| **Notification Center** | Check alerts & reviewer notes | Real-time feedback on verification progress |

---
*Document managed under AchieveNest System Architecture standard.*
