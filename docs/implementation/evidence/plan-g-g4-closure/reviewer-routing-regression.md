# Reviewer Routing Regression Verification

## Canonical Routing Matrix Verification

All canonical routing rules established in Phase G0 and implemented in Phase G1 remain 100% stable and verified:

1. **Faculty + Academic** -> `College Dean` (College Academic Scope)
2. **Non-Teaching Faculty + Academic** -> `College Dean` (College Academic Scope)
3. **Non-Teaching Faculty + Non-Academic** -> `HR Staff` (University HR Scope)
4. **Dean (Academic)** -> `HR Staff` (University HR Scope)
5. **VP for Academics** -> `HR Staff` (University HR Scope)
6. **VP for Administration** -> `HR Staff` (University HR Scope)
7. **Exclusions**:
   - Department Secretary is strictly excluded from evaluator routing.
   - Candidate self-evaluation is strictly prohibited.
   - Unresolved routes produce zero guessed reviewers.
