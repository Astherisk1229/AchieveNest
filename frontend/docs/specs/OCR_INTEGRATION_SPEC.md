# AchieveNest System Specification: OCR (Optical Character Recognition) Integration (`OCR_INTEGRATION_SPEC.md`)

**Document Version:** 1.0.0  
**System:** AchieveNest Student & Personnel Achievement Management Platform  
**Target Architecture:** Document Auto-Parsing, Identity Matching, Tamper Risk Scoring, & Evaluator Workbench  
**Reference Specifications:** NDMU Rating Sheet for Ranking, [`PERSONNEL_FEATURES_SPEC.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/docs/specs/PERSONNEL_FEATURES_SPEC.md), [`PORTFOLIO_BOOKLET_SPEC.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/docs/specs/PORTFOLIO_BOOKLET_SPEC.md)

---

## 1. Executive Summary & Purpose

The **AchieveNest OCR Subsystem** is an intelligent document processing engine designed to streamline certificate submissions for students, faculty, department secretaries, and HR evaluators. 

By integrating Optical Character Recognition (OCR) combined with Pattern Matching (Regex) and Named Entity Recognition (NER), AchieveNest automates the extraction of key metadata from uploaded documentary proof files (PDFs, images, scanned certificates, diplomas, training records, and publication acceptance letters).

### Primary System Objectives:
1. **Zero-Manual-Typing Form Auto-Fill**: Automatically populate accomplishment titles, issuing organizations, dates, certificate serial numbers, and credit hours upon document upload.
2. **Identity Verification & Anti-Fraud**: Match extracted recipient names against logged-in user profile names (`employee_id` / `student_id`), generating an **Identity Match Score**.
3. **Smart Category Recommendation**: Classify scanned documents into NDMU Point System categories (Area A: Professional Development, Area B: Productivity & Creative Work, Area C: Service & Leadership).
4. **Evaluator Verification Workbench**: Provide Department Secretaries and HR Staff with side-by-side visual bounding-box highlighting for rapid verification audit.

---

## 2. End-to-End OCR Architectural Pipeline

```
+-----------------------------------------------------------------------------------------------------------------------+
| ACHIEVENEST OCR PIPELINE ARCHITECTURE                                                                                 |
+-----------------------------------------------------------------------------------------------------------------------+
| [ STEP 1: FILE INGESTION & CLIENT PREPROCESSING ]                                                                     |
|  - File Upload (PDF, PNG, JPEG, WEBP; max 15MB)                                                                       |
|  - HTML5 Canvas Preprocessing: Grayscale filter, binarization (Otsu thresholding), deskewing (+/- 15 deg auto-align)  |
|                                                                                                                       |
| [ STEP 2: OCR TEXT EXTRACTION & SPATIAL BOUNDING ]                                                                    |
|  - Hybrid Execution Engine: Client-side Tesseract.js (fast local preview) OR Cloud Vision / AWS Textract Service      |
|  - Output: Plain text string + hOCR JSON payload containing spatial bounding box coordinates (x, y, width, height)    |
|                                                                                                                       |
| [ STEP 3: NER & PATTERN MATCHING ENGINE (`OcrExtractionController.js`) ]                                             |
|  - Recipient Name Matcher (Levenshtein Distance & Token Sort Ratio against user profile name)                         |
|  - Date Normalizer (Converts "April 15, 2026", "15/04/2026", "15-Apr-2026" to ISO-8601 YYYY-MM-DD)                     |
|  - Issuer Classifier (Regex pattern matching: CHED, IEEE, PRC, DepEd, NDMU, Scopus, ISO, DOST)                         |
|  - Certificate Serial & Verification Code Extractor                                                                   |
|                                                                                                                       |
| [ STEP 4: NDMU CATEGORY RECOGNIZER & RISK RATING ]                                                                   |
|  - Keyword Weighting Matrix maps extracted terms to Area A, B, C subcategories                                        |
|  - Tamper & Risk Evaluator: Checks font consistency, image manipulation artifacts, and metadata mismatch              |
|                                                                                                                       |
| [ STEP 5: VIEW CONSUMPTION ]                                                                                          |
|  - Auto-fills `PersonnelSubmissionModal.jsx` and `AchievementSubmissionModal.jsx` with confidence indicators         |
|  - Stores structured payload in `AchievementModel.js` schema for `DepSecEvaluatorWorkbench.jsx`                       |
+-----------------------------------------------------------------------------------------------------------------------+
```

---

## 3. Key Operational Use Cases

### A. Faculty & Personnel Accomplishment Auto-Fill
- **Trigger**: Personnel member clicks **Log Accomplishment** (`PersonnelSubmissionModal.jsx`) and drops a certificate file (e.g. *CHED Faculty Training Certificate.pdf*).
- **Execution**:
  1. OCR Engine scans the document within ~1.2 seconds.
  2. Extracted fields populate form inputs:
     - **Title**: *"Regional Seminar on Advanced AI Curriculum Integration"*
     - **Issuer**: *"Commission on Higher Education (CHED IX)"*
     - **Date**: *"2025-12-04"*
     - **Category**: Auto-selects `Area A.3: Seminars, Workshops & Training` (Confidence: 98%).
  3. Visual badge appears next to inputs: `✨ Auto-filled by OCR (98% Confidence)`.

---

### B. Identity Matching & Fraud Prevention
- **Challenge**: Preventing users from submitting certificates earned by colleagues or internet templates.
- **OCR Logic**:
  - Extracts the recipient name block (e.g., *"This certificate is awarded to Dr. Maria Santos"*).
  - Calculates string similarity ratio against `currentUser.full_name`:
    $$\text{Match Ratio} = \text{TokenSortRatio}(\text{ExtractedName}, \text{UserProfileName})$$
  - **Rules**:
    - **Score $\ge 90\%$**: `GREEN_MATCH` (Identity Confirmed).
    - **Score $70\% - 89\%$**: `AMBER_PARTIAL_MATCH` (e.g., maiden name or missing middle initial; flagged for human review).
    - **Score $< 70\%$**: `RED_MISMATCH` (Triggers alert: *"Warning: Recipient name on document does not match logged-in user profile"*).

---

### C. Smart NDMU Category Keyword Mapping Matrix

The OCR Engine utilizes a weighted keyword classifier to suggest official NDMU Ranking Categories:

| Extracted Keyword Patterns | Target Category Code | Target Category Name | Point Ceiling |
| :--- | :--- | :--- | :--- |
| `Doctor of Philosophy`, `Ph.D.`, `Master of Science`, `M.S.`, `Transcript` | `Area A.1` | Higher Educational Attainment | Area A Max: 70 pts |
| `Member`, `Fellow`, `IEEE`, `ACM`, `PIChE`, `PRC Board` | `Area A.2` | Professional Organizations & Licenses | Area A Max: 70 pts |
| `Certificate of Completion`, `40 Hours`, `Seminar`, `CHED`, `DOST`, `Workshop` | `Area A.3` | Seminars, Conferences & Workshops | Area A Max: 70 pts |
| `Scopus`, `Web of Science`, `IEEE Access`, `Springer`, `Elsevier`, `Journal`, `Author` | `Area B.1` | Published Research & Books | Area B Max: 50 pts |
| `Keynote Speaker`, `Resource Person`, `Lecturer`, `Guest Speaker` | `Area B.2` | Professional Lectures & Presentations | Area B Max: 50 pts |
| `Patent`, `Utility Model`, `Copyright`, `Software Registration` | `Area B.3` | Inventions, Patents & Creative Work | Area B Max: 50 pts |
| `Community Extension`, `Barangay Outreach`, `Volunteer`, `Project Lead` | `Area C.1` | Extension Services & Community Leadership | Area C Max: 40 pts |
| `Committee Chair`, `Department Coordinator`, `Moderator`, `Adviser` | `Area C.2` | Institutional Service & Governance | Area C Max: 40 pts |

---

### D. Evaluator Verification Workbench Integration (`DepSecEvaluatorWorkbench.jsx` & `HRDashboardView.jsx`)

When a Department Secretary or HR Officer reviews a submitted portfolio:
1. **Split-Screen Interactive Review**:
   - Left Side: Original PDF/Image Certificate viewer.
   - Right Side: Submitted accomplishment details with **OCR Extracted Metadata Panel**.
2. **Bounding Box Spatial Highlighting**:
   - Clicking on the **Title** field highlights the exact green bounding box on the PDF preview where the title was extracted.
   - Clicking on **Issue Date** highlights the date region on the document.
3. **One-Click Audit Trail**:
   - Evaluator can click `Accept OCR Extraction` or `Override Field`.

---

## 4. Domain Data Model Schema (`AchievementModel.js`)

To support OCR metadata, `AchievementModel.js` is extended with the `ocr_metadata` object:

```javascript
/**
 * Achievement Data Model Schema (Extended for OCR Capability)
 */
export const AchievementSchema = {
  id: 'ach-2026-8891',
  user_id: 'EMP-2021-0842',
  title: 'Machine Learning Frameworks in Education Analytics',
  category: 'Research & Publications',
  category_code: 'B.1.a',
  academic_year: 'AY 2025-2026',
  issuer: 'IEEE Access Journal (Scopus Indexed)',
  date: '2026-04-15',
  status: 'Pending Review',
  attached_file_name: 'ieee_paper_scopus_santos_2026.pdf',
  attached_file_url: 'blob:https://achievenest.ndmu.edu.ph/proofs/ieee_paper_2026.pdf',
  
  // OCR Metadata Sub-Schema
  ocr_metadata: {
    scanned_at: '2026-08-12T22:15:00Z',
    ocr_engine_version: 'Tesseract-v5.3 / AchieveNest-NER-v1',
    overall_confidence_score: 0.96,
    tamper_risk_rating: 'LOW_RISK', // 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK_FLAGGED'
    
    extracted_fields: {
      recipient_name: {
        raw_text: 'Dr. Maria Santos',
        normalized_text: 'MARIA SANTOS',
        confidence: 0.99,
        is_identity_matched: true,
        match_score: 0.98,
        bounding_box: { x: 120, y: 340, width: 450, height: 42 }
      },
      title: {
        raw_text: 'Machine Learning Frameworks in Education Analytics',
        confidence: 0.95,
        bounding_box: { x: 110, y: 410, width: 680, height: 65 }
      },
      issuer: {
        raw_text: 'IEEE Access Journal',
        confidence: 0.94,
        bounding_box: { x: 200, y: 150, width: 300, height: 35 }
      },
      issue_date: {
        raw_text: 'April 15, 2026',
        iso_value: '2026-04-15',
        confidence: 0.98,
        bounding_box: { x: 500, y: 720, width: 180, height: 30 }
      },
      certificate_serial_id: {
        raw_text: 'IEEE-ACC-2026-99012',
        confidence: 0.92,
        bounding_box: { x: 650, y: 80, width: 210, height: 25 }
      }
    },

    suggested_category: {
      category_code: 'B.1.a',
      category_name: 'Published Research (Scopus / WoS)',
      confidence_score: 0.97,
      matched_keywords: ['IEEE Access', 'Scopus Indexed', 'Journal', 'Author']
    }
  }
}
```

---

## 5. Software Architecture Component Responsibilities

| Layer | Component Name | Primary OCR Responsibility |
| :--- | :--- | :--- |
| **Model** | [AchievementModel.js](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/models/AchievementModel.js) | Defines `ocr_metadata` schema, confidence thresholds, and bounding box formats. |
| **Controller** | `OcrExtractionController.js` | Coordinates image preprocessing, regex extraction, NER parsing, and NDMU category weighting algorithms. |
| **Controller** | `SecurityController.js` | Performs identity match validation and flags tamper/mismatch risk scores. |
| **Hook** | `useOcrScanner.js` | Custom React hook providing loading states, progress percentages, and parsed field output. |
| **View (Form)** | `PersonnelSubmissionModal.jsx` | Renders file drag-and-drop zone with OCR scan trigger and auto-filled field badges. |
| **View (Form)** | `AchievementSubmissionModal.jsx` | Student submission view with certificate OCR auto-complete. |
| **View (Audit)** | `DepSecEvaluatorWorkbench.jsx` | Department Secretary split-screen audit view with clickable bounding box overlays. |
| **View (Audit)** | `HRDashboardView.jsx` | HR Admin master audit view displaying system-wide OCR identity match logs. |

---

## 6. Error Handling & Edge Cases

1. **Low Resolution or Blurry Image**:
   - If `overall_confidence_score < 0.60`, OCR falls back gracefully.
   - User receives friendly alert: *"Image text quality is low. Form fields left open for manual typing."*
2. **Name Discrepancy (e.g. Married Name / Maiden Name)**:
   - Evaluator workbench displays amber notice: *"Extracted Name (Maria Alonzo) differs from Profile Name (Maria Santos). Please confirm legal document."*
3. **Non-English / Multilingual Certificates**:
   - OCR engine includes Latin-script support with UTF-8 character encoding (e.g., accents, special symbols).

---

## 7. Verification & Testing Plan

### Automated Tests
- Unit test regex parsing for 50 sample certificate layouts (IEEE, CHED, PRC, NDMU, DepEd, Coursera).
- Test identity matching algorithm against exact matches, partial matches, and complete mismatches.

### Manual Verification
- Upload sample certificate PDFs in `PersonnelSubmissionModal.jsx` and confirm form fields auto-fill within 2 seconds.
- Open `DepSecEvaluatorWorkbench.jsx` and verify bounding box visual highlights align with PDF text regions.
