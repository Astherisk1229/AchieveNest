# Evidence Validation Verification

## Verification Policy
For all criteria where `evidence_required = true`, the scoring engine verifies the presence of an active evidence reference (`evidence_reference` or `proof_file_name`).

## Rejection on Missing Proof
- An accomplishment submission without a verifiable proof reference fails validation with HTTP 422:
- `"Verification evidence proof attachment is required for [<Criterion Name>]."`

## Evaluator Access
- The evidence document reference is preserved in the scoring result payload for immediate evaluator inspection during Plan G review.
