# Explainability Traces & Mathematical Calculation Examples

## 1. Unit Rule Explanation
- **Input**: `18 Ph.D. units completed`
- **Formula**: `floor(18 / 3) * 2 = 6 * 2 = 12 pts` -> Capped at `10 pts`
- **Generated Explanation**:
  `"Ph.D. Units: 18 units = 6 groups of 3 × 2 pts = 12 pts (Max 10). Raw score of 12 pts capped at criterion maximum of 10 pts."`

## 2. Multi-Factor Additive Sum Explanation (Administrators B.1)
- **Input**: Sponsoring Org = `External (2)`, Extent = `1 Day (3)`, Reach = `Regional (2)`, Role = `Resource Person (5)`
- **Generated Explanation**:
  `"4-Factor Additive Sum: Org(2) + Extent(3) + Reach(2) + Role(5) = 12 pts (Earned: 12 pts)."`

## 3. Scope + Publication Type Sum Explanation (Administrators B.2)
- **Input**: Scope = `International (8)`, Type = `Scholarly Paper (8)`
- **Generated Explanation**:
  `"Publication Sum: Scope(8) + Type(8) = 16 pts (Earned: 16 pts)."`

## 4. Evaluator Judgment Explanation (B.3 / B.6 / B.5)
- **Input**: Research Project Title
- **Generated Explanation**:
  `"Evaluator judgment required (Maximum accepted score: 40 pts). Points pending official evaluator deliberation."`

## 5. Server-Derived Service Years Explanation (C.3 / B.3)
- **Input**: `14 completed service years`
- **Formula**: `floor(14 / 2) * 1 = 7 pts`
- **Generated Explanation**:
  `"Years of Service at NDMU: 14 completed years = 7 pts (Max 10) (Earned: 7 pts)."`
