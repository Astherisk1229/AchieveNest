# Owner-Authorized Complete Deletion Event Audit (Plan I / C5)

## Findings
- Complete portfolio purge (`PersonnelPortfolioSubmissionController::purge`) writes an event:
  - `event_type`: `'portfolio_purged'`
  - `performed_by`: Actor profile ID
  - `payload`: `{ target_profile_id, purged_by_role, purged_evaluations, purged_accomplishments, reason }`
  - `created_at`: Server timestamp
- Storage files and accomplishment rows are purged atomically.
