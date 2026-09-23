# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Phase 7: UI Candidate Presentation & Transparency Architecture

> **Document:** `osad-award-phase7-ui-candidate-presentation.md`  
> **Phase:** 7 of 8  
> **Components:** `OSADPotentialCandidatesView.jsx`, `OSADAwardsAndCriteriaPage.jsx`, `OSADStudentAwardReviewWorkspace.jsx`  
> **Status:** AUDITED & OPERATIONAL  

---

## 1. Candidate Presentation UI Features

1. **Award-Specific Potential Candidates View (`OSADPotentialCandidatesView.jsx`)**:
   - Tab 1: **Potential Candidates (≥ 80%)** — displays all students who meet or exceed the normalized threshold.
   - Tab 2: **All Evaluated Results** — displays both qualified candidates and below-threshold students for complete transparency.
   - Governance notice prominently stating: *"Potential Candidate status is an automated portfolio qualification preselection... It does not constitute a final awardee selection or ranking cutoff."*
2. **Score & Threshold Transparency Metrics**:
   - Raw Portfolio Score: `40.00 / 50.00 pts`
   - Normalized Potential Score: `80.00%`
   - Universal Threshold: `≥ 80.00%`
   - Status Badge: `Potential Candidate` (Emerald) vs `Below Threshold` (Slate)
3. **No-Winner Language Enforcement**:
   - Zero occurrences of "Winner", "1st Place", "Podium", or "Top-N Cutoff".
   - Presentation sort order: `Portfolio Potential Score DESC, Student Name ASC`.
4. **Responsive Stacking Layout**:
   - Desktop: Balanced multi-column cards with independent metrics columns.
   - Mobile: Vertical stacked cards with high-contrast text and accessible touch targets.
