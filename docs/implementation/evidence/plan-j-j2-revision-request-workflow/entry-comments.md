# Phase J2 Evidence: Optional Entry-Level & Criterion-Level Subordinate Comments

## Entry-Level Comments
- Reviewers can optionally annotate specific submitted items (`portfolio_item_id`).
- Each comment records:
  - `id`: Unique comment UUID.
  - `portfolio_item_id`: Target evaluation item ID.
  - `criterion_code` / `criterion_title`: Associated rubric criteria.
  - `comment_text`: Granular reviewer instruction.
  - `requested_evidence`: Optional item-specific proof requirements.
  - `created_by`: Reviewer user ID.
  - `created_at`: Timestamp.
- Updates item snapshot `verification_status` to `'needs_revision'` and records remarks.

## Criterion-Level Comments
- Where feedback targets an entire criterion rather than a single file, criterion comments capture high-level guidance.
- Subordinate to the overall portfolio revision request.
