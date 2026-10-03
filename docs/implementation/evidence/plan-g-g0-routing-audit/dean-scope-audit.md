# Personnel Evaluation Track — Plan G — Phase G0: Dean Scope Audit

## Dean Authority & Scope Boundary Audit

### 1. Scope Derivation Source
A Dean's evaluation scope is strictly derived from:
- `dean_assignments` table (`college_id`, `is_active = 1`);
- Candidate's `personnel_college_affiliations` (`college_id`, `is_active = 1`) established under Plan D master data.

### 2. Isolation Guarantees
- **Intra-College Authorization**: A Dean has evaluator authority exclusively over Faculty and Academic Non-Teaching Faculty actively assigned to the Dean's specific college (e.g., Dean of CEAC evaluates CEAC faculty).
- **Cross-College Prohibition**: A Dean attempting to view, rate, or finalize evaluations from another college (e.g., Dean of CEAC accessing CBA faculty) is rejected with HTTP 403 / Domain Access Denial.
- **Dean Self-Evaluation**: When a Dean submits an evaluation, the Dean cannot evaluate themselves; their evaluation is routed to HR Office.
