# Phase 5D — OSAD Deliberation UI Map
## Committee Deliberation Flow, Human Evaluation Integration, and Discovery Boundaries

**Domain:** OSAD Deliberation & Governance UI  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:50:00 UTC+08:00  

---

## 1. Separation of Concerns: Discovery vs. Official Deliberation

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ AchieveNest Automated Discovery (Phase 1-4 Engine)                      │
│ - Verified Publication Evidence: Max 60.00 pts                          │
│ - Leadership in Campus Journalism: Max 10.00 pts                        │
│ - 70-Point Portfolio Computable Raw Score                               │
│ - Threshold Gate: Raw >= 56.00 (Potential >= 80.00%)                    │
│ - Output Label: "Portfolio-Based Potential Candidate"                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ OSAD Committee Human Evaluation (Official In-Person Deliberation)       │
│ - Moral Character & Exemplary Conduct: 20.00 pts (Manual evaluation)    │
│ - Panel Interview & Final Deliberation: 10.00 pts (Manual evaluation)   │
│ - Quality of Publication: Human review of writing & journalistic merit   │
│ - Official Award Conformance: 100.00 Total Official Rubric Basis        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Clear Disclaimers & Language Standards

1. **Portfolio-Based Candidate Label**: Every candidate row and detail view explicitly labels the student as a *Potential Candidate (Portfolio-Based Discovery)*.
2. **Quality of Publication Clarification**: Clarifies that AchieveNest provides evidence counting and compliance verification; final journalistic quality remains subject to OSAD review.
3. **Non-Computable Criteria Isolation**: Moral Character ($20\text{ pts}$) and Panel Interview ($10\text{ pts}$) are displayed as *Not automatically scored by AchieveNest* and are excluded from the 70-point computable denominator.
