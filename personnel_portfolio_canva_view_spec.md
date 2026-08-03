# NDMU Personnel Portfolio Specification & Canva Booklet Presenter UX Plan
**Document Version:** 2.3.0 (Formal Academic Palette & Zero Page Scrollbars Revision)  
**System:** AchieveNest Student & Personnel Achievement Management Platform  
**Target Roles:** Personnel (Faculty & Staff), Department Secretary (`dep_sec`), Human Resources (`hr`)  
**Reference Document:** NDMU Rating Sheet for Ranking (Notre Dame of Marbel University) & [`personnel_accomplishment_logging_ux_plan.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/personnel_accomplishment_logging_ux_plan.md)

---

## 1. Formal Presentation & Zero Scrollbar Architecture

1. **Zero Internal Page Scrollbars**
   - Every slide page in [`PersonnelPortfolioCanvaView.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/components/personnel/PersonnelPortfolioCanvaView.jsx) is strictly sized at `w-[750px] h-[980px]` with `overflow-hidden`.
   - Embedded proof certificate preview images are capped at `h-[240px]` so the entire page layout fits inside `h-[980px]` with **zero vertical or horizontal scrollbars**.

2. **Restrained Formal Academic Color Palette**
   - **Primary Formal Accent:** Deep NDMU Forest Green (`#1b4332`).
   - **Neutral Paper Background:** Clean Pure White (`#ffffff`) and Crisp Off-White (`#f8fafc`).
   - **Typography:** Dark Charcoal Slate (`#0f172a` / `#1e293b`).
   - **Subdued Accent Badges:** Refined Warm Gold (`#d97706`) and Crisp Border Dividers (`#e2e8f0`).
   - Neon/flashy multi-color gradients removed in favor of high-end formal academic dossier aesthetics.

---

## 2. Complete Booklet Slide Deck Sequence

```
+-----------------------------------------------------------------------------------------------+
| CANVA PORTFOLIO BOOKLET SLIDE DECK SEQUENCE (ZERO PAGE SCROLLBARS)                            |
+-----------------------------------------------------------------------------------------------+
| Page 1  : Formal Official NDMU Cover Page (Logo, Profile Card, Employee ID, Status Seal)      |
| Page 2  : Hierarchical Table of Contents (Level 1 Area Headers -> Level 2 Sub-Category -> Item)|
| Page 3  : CATEGORY SEPARATOR SLIDE - AREA A: PROFESSIONAL DEVELOPMENT                         |
| Page 4  : Item Slide (A.1 Ph.D. in Computer Science)                                          |
| Page 5  : Item Slide (A.2 Philippine Computer Society)                                        |
| Page 6  : Item Slide (A.3 CHED AI Training)                                                   |
| Page 7  : CATEGORY SEPARATOR SLIDE - AREA B: PRODUCTIVITY AND CREATIVE WORK                   |
| Page 8  : Item Slide (B.1 DOST Keynote Address)                                               |
| Page 9  : Item Slide (B.2 IEEE Access Journal Paper)                                          |
| Page 10 : Item Slide (B.3 NDMU Institutional Research)                                        |
| Page 11 : Item Slide (B.4 NDMU Outstanding Research Award)                                    |
| Page 12 : Item Slide (B.5 Data Structures Laboratory Manual)                                  |
| Page 13 : CATEGORY SEPARATOR SLIDE - AREA C: SERVICE AND LEADERSHIP                           |
| Page 14 : Item Slide (C.1 Faculty Adviser: Computer Society)                                  |
| Page 15 : Item Slide (C.2 Koronadal LGU Extension Project)                                    |
| Page 16 : Formal Institutional Evaluator Sign-Off Page (DepSec & HR Signatures)               |
+-----------------------------------------------------------------------------------------------+
```

---

## 3. Verification & Build Audit

- **Automated Unit Test (`scratch/test_canva_view.js`)**: **PASSED**.
- **Production Build Audit (`npx vite build`)**: Clean build with 0 errors.
