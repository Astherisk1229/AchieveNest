# Personnel Evaluation Track — Plan F — Phase F5: Plan H Boundary Verification

## Integration Boundary: Plan H (Deliberation, Promotion Approval & Rank Updates)

### Core Architectural Invariant:
$$\text{Passed} \neq \text{Promoted}$$

### Plan H Responsibilities:
- University Rank and Promotion Committee (URPC) deliberation;
- Formal promotion approval / denial decisions;
- Presidential confirmation;
- Academic and Non-Teaching rank catalog update execution;
- Promotion certificate issuance.

### Verification of Plan F Boundaries:
1. **No Automatic Promotion**: A `Passed` result from Plan F signifies that the candidate has met or exceeded the numerical evaluation threshold (120.00 or 75.00). It **never** automatically advances rank, generates a promotion certificate, or skips Plan H committee deliberation.
2. **Result DTO Cleanliness**: The Plan F `determineResult()` DTO contains strictly evaluation metrics (`final_accepted_total`, `passing_score`, `final_result`, `result_status`, `explanation`, `areas`) and zero Plan H promotion fields (`promotion_approved`, `new_rank`, `approved_by`).
3. **Retained Handling**: A `Retained` result preserves the current rank without triggering promotion workflows unless an institutional review process dictates otherwise.
