# Phase 4 Deliverable: Evidence Mapping & Students for Evaluation Engine Architecture

**Document Identifier:** `docs/audits/osad-award-phase4-evidence-mapping-engine.md`  
**Phase:** 4 of 8 (Verified Evidence Mapping & Students for Evaluation Engine)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **MAPPING ENGINE IMPLEMENTED & VERIFIED**

---

## 1. Executive Summary

Phase 4 establishes the authoritative bridge between each student's **single verified master portfolio** and the 15 award-specific evaluation models.

The engine operates in [`AwardEvidenceMappingService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/AwardEvidenceMappingService.php) and enforces:
1. **Master Portfolio Preservation**: One master portfolio per student. Records are referenced across multiple awards, never cloned or duplicated.
2. **Hard Verification Gate**: Only records with `status === 'verified'` enter award mapping.
3. **Structured Taxonomy Evaluation**: Uses the 9-category student portfolio taxonomy and structured metadata fields without free-text keyword guessing.
4. **Duplicate Subsection Boundary**: Prevents multiple counts of the same underlying event/activity within the same scoring subsection.
5. **Students for Evaluation Generation**: Generates the pre-scoring review pool of students who satisfy Phase 3 Award-Level Eligibility AND possess $\ge 1$ relevant verified mapped record.

---

## 2. End-to-End Evaluation Flow

```text
Selected Award
    │
    ▼
Phase 3 Award-Level Eligibility
    │
    ├── FAIL ──► Exclude student with Phase 3 diagnostics
    └── PASS
          │
          ▼
    Load Verified Master Portfolio (status = 'verified')
          │
          ▼
    Phase 4 Award-Relevance Mapping
          │
          ▼
    At least 1 relevant verified record?
          │
          ├── NO  ──► Excluded from Students for Evaluation
          └── YES ──► Included in "Students for Evaluation" Queue
                          │
                          ▼
                      Award-Specific Relevant Evidence View
                          │
                          ▼
                      Phase 5 Rubric Scoring (Next Phase)
```

---

## 3. Strict Boundary Invariant

- **Phase 4 Scope**: Identifies which verified records are relevant to which computable criteria and components.
- **Strict Invariant**: Does **NOT** calculate earned criterion points, does **NOT** sum raw scores, does **NOT** apply caps, does **NOT** calculate normalized percentages, does **NOT** rank students, and does **NOT** designate Potential Candidates.
