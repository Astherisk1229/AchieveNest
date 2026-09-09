# Wrong-Scale Rejection & Cross-Scale Contamination Prevention

## Architectural Boundary
The portfolio system strictly binds each evaluation cycle to one server-authoritative scale code (`evaluation_scale_code`).

When `evaluation_scale_code === 'ADMINISTRATORS_RANKING_SCALE'`, the validation engine (`PortfolioCriterionValidationService.php` on the backend and `RankingCriteriaModel.js` on the frontend) enforces strict whitelist matching:

---

## 1. Rejection of Non-Teaching Categories
The following Non-Teaching categories are strictly rejected under the Administrators scale:
- `NT_AREA_A_JOB_PERFORMANCE`
- `NT_AREA_B1_EDUCATION_TRAINING`
- `NT_AREA_B2_EXPERIENCE`
- `NT_AREA_B3_PERSONALITY_POTENTIAL`
- `NT_AREA_B4_AWARDS_COMMENDATIONS`
- `NT_AREA_B5_COMMUNITY_EXTENSION`

### Rejection Behavior:
- API payload containing an invalid area/criterion returns `422 Unprocessable Entity` with error: `"Invalid area code or criterion for the assigned Administrators Ranking Scale"`.
- No automatic fallback or silent category translation is performed.

---

## 2. Rejection of Forged/Client-Claimed Scores
- The backend recalculates all points deterministically from verified discrete factor inputs.
- Any client-submitted `score`, `claimed_points`, or `accepted_points` payload field is ignored or rejected.
- Evaluator-judgment criteria (`B.3`, `B.6`) cannot accept user-entered scores.
- Server-derived criteria (`C.3`) cannot accept user-entered service year scores.

---

## 3. UI Isolation
- The shared portfolio component filters displayed areas using `RankingCriteriaModel.getAreasForScale('ADMINISTRATORS_RANKING_SCALE')`.
- Non-Teaching areas and criteria are completely absent from the DOM and selector dropdowns for Administrators scale users.
