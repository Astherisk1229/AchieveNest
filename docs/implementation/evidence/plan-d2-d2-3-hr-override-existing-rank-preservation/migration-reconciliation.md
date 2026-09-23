# Phase D2-3: Migration & Reconciliation Mode

## Context & Purpose
When onboarding or migrating historical personnel records whose existing official rank does not match standard entry-level qualification mappings:

1. **Explicit HR Selection**:
   - HR administrators can explicitly select the employee's true official seeded rank from the catalog.
2. **Audit Context**:
   - Master data update payloads record the prior and new rank along with the audit reason (e.g., `Official HR master data update` or `Legacy rank reconciliation`).
3. **Zero Progression Artifacts**:
   - Reconciling or overriding a rank creates no false promotion decision or evaluation result.
