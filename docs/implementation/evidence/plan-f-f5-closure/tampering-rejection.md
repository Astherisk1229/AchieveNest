# Personnel Evaluation Track — Plan F — Phase F5: Client Tampering Rejection & Security

## Tampering Protection Specifications

The backend result engine rejects any client payload attempting to forge or manipulate authoritative result attributes:

1. **Client Forged Outcome Label**:
   - Client sends: `{ final_result: "Passed" }` for an evaluation with accepted points = 50.0 (below passing threshold).
   - Server Action: Tampering detected and exception thrown: `Tampering detected: Client-supplied final result [Passed] does not match authoritative calculated result [Retained].`

2. **Client Forged Passing Threshold**:
   - Client sends: `{ passing_score: 50.0 }` to lower the passing bar.
   - Server Action: Tampering detected and exception thrown: `Tampering detected: Client-supplied passing score [50] does not match canonical threshold [120].`

3. **Client Forged Maximum Ceiling**:
   - Client sends: `{ maximum_score: 200.0 }` to inflate the scale.
   - Server Action: Tampering detected and exception thrown: `Tampering detected: Client-supplied maximum score [200] does not match canonical maximum [150].`

4. **Claimed / Advisory Score Substitution**:
   - Client sends claimed or advisory points.
   - Server Action: Server computes final total solely from official accepted points (`accepted_points` / evaluator ratings), completely ignoring advisory or claimed points.
