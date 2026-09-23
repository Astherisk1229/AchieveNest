# Final Security Validation Summary

- **Locked Version Protection**: Direct mutation of finalized/locked records is denied (409).
- **Cross-User Access**: Users cannot view or modify other users' portfolios (403).
- **Cross-College Access**: Deans cannot access portfolios outside their assigned College (403).
- **Self-Evaluation**: Reviewers cannot evaluate their own portfolios.
- **Department Secretary Exclusion**: Secretary accounts cannot score evaluations.
- **Direct Score Tampering**: Direct client modification of calculated scores is rejected.
- **Direct Promotion Bypass**: Rank updates require HR approved promotion decision.
- **Unauthorized Deletion**: Deletion without owner authorization is blocked (403).
