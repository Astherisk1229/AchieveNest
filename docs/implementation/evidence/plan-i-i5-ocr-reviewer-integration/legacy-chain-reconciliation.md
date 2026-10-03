# Legacy Chain Reconciliation Boundary

## Boundary Rule
If legacy evidence or OCR records exist without a deterministic `evidence_id`:
- Backfilling is only performed when an exact 1-to-1 deterministic relationship can be proven.
- Filename matching alone is strictly prohibited for backfilling.
- Ambiguous records are marked `evidence_chain_reconciliation_required` without guessing.
