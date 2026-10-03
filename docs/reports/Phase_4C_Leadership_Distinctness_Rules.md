# Phase 4C — Leadership Distinctness Rules
## Leadership Role Accumulation, Distinctness Keys, and Double-Counting Defense

**Domain:** Leadership Distinctness & Accumulation  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:45:00 UTC+08:00  

---

## 1. Distinctness Key Construction

To prevent duplicate submissions or concurrent conflicting roles from inflating a student's score, the engine computes a canonical distinctness key for each leadership record:

$$\text{Distinctness Key} = \text{lowercase}\Big(\text{Outlet} \mathbin{\Vert} \text{Role Family} \mathbin{\Vert} \text{Academic Year / Term}\Big)$$

### Example Combinations:
- `the ndmu herald|officer|ay 2025-2026`
- `the ndmu herald|member / staff|ay 2024-2025`
- `marist gazette|officer|ay 2024-2025`

---

## 2. Distinctness Evaluation Scenarios

| Scenario | Record 1 | Record 2 | Total Points | Explainability Outcome |
|---|---|---|:---:|---|
| **Distinct Academic Years** | Officer (AY 2024-2025): 3 pts | Officer (AY 2025-2026): 3 pts | **5.00 / 5.00** | Both records counted; capped at 5.00. Uncapped = 6.00. |
| **Distinct Outlets** | Officer at *The Herald* (AY 2025-2026): 3 pts | Member at *Marist Gazette* (AY 2025-2026): 2 pts | **5.00 / 5.00** | Both distinct responsibilities counted; 3 + 2 = 5.00. |
| **Same Outlet & Same Year Duplicate** | Editor-in-Chief at *The Herald* (AY 2025-2026): 3 pts | Managing Editor at *The Herald* (AY 2025-2026): 3 pts | **3.00 / 5.00** | First record counted (3 pts); second marked `DUPLICATE_ROLE_EXCLUDED` (0 pts). |
| **Officer vs Member Family Conflict** | The same single record cannot be scored simultaneously as both an Officer and a Member. | Evaluated strictly by subcategory UUID (`ROLE_OFFICER_ID` vs `ROLE_MEMBER_ID`). |

---

## 3. Cap & Explainability Behavior

When distinct valid roles exceed the 5.00 point subsection limit (e.g. 2 Officer roles = $3 + 3 = 6\text{ pts}$), the engine awards 5.00 points, applies `cap_applied = true`, and reports `uncapped_points = 6.00`.
