# Phase D2-3: Existing-Rank Preservation Invariant

## Invariant Formula
```text
No explicit HR rank field change
→ current_rank_title in payload matches saved value
→ 0 rank mutations in database
```

## Verified Behaviors
- **Qualification-Only Change**: Changing from `Master's` to `PhD` updates the recommendation indicator to `Professor I`, but the form rank remains `Associate Professor II`.
- **College-Only Change**: Moving personnel between Colleges does not alter rank.
- **Department-Only Change**: Moving personnel between administrative units does not alter rank.
- **Employment Status Change**: Switching between `Permanent` and `Probationary` does not alter rank.
