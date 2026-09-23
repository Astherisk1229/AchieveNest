# Status-to-Event Transition Mapping

```
[Draft Working Portfolio]
         │
         ▼  (submit)
     submitted  ───────────────► portfolio_submitted
         │
         ▼  (open reviewer workspace)
   in_evaluation  ─────────────► review_started
         │
         ├───► (return) ───────► returned_for_revision ──► revision_requested
         │                              │
         │                              ▼  (resubmit)
         │                          submitted  ──────────► portfolio_resubmitted
         │                              │
         ▼ (all scored)                 ▼
ready_for_finalization ────────► evaluation_ready_for_finalization
         │
         ▼ (finalize)
     completed  ───────────────► evaluation_finalized
```
