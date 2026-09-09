# Personnel Evaluation Track — Plan G — Phase G1: Dean Scope Verification

## Dean Academic Scope Isolation Audit

### 1. Intra-College Access Authorization
- Dean of College of Engineering, Architecture, and Computing (`COLLEGE-CEAC`) can access and evaluate submissions belonging exclusively to `COLLEGE-CEAC`.
- Dean of College of Business Administration (`COLLEGE-CBA`) can access and evaluate submissions belonging exclusively to `COLLEGE-CBA`.

### 2. Cross-College & Non-Academic Access Denials
- When Dean of CEAC attempts to access or query evaluations from `COLLEGE-CBA`, `filterReviewerQueue()` and `canReviewerAccessEvaluation()` strictly return `false` / empty queue.
- Non-Teaching Non-Academic evaluations are never visible in any Dean's queue.
- Dean's own evaluation is never routed to their own queue (routed to HR).

| Evaluator Context | Candidate Evaluation Scope | Authorization Result | Reason |
| :--- | :--- | :--- | :--- |
| Dean (`COLLEGE-CEAC`) | Faculty (`COLLEGE-CEAC`) | **AUTHORIZED (TRUE)** | Matching academic college |
| Dean (`COLLEGE-CEAC`) | Faculty (`COLLEGE-CBA`) | **DENIED (FALSE)** | Cross-college access blocked |
| Dean (`COLLEGE-CEAC`) | Non-Teaching (`non_academic`) | **DENIED (FALSE)** | Outside Dean scope |
| Dean (`COLLEGE-CEAC`) | Dean CEAC (Self-evaluation) | **DENIED (FALSE)** | Self-review prohibited |
