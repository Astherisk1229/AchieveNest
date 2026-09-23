# Tampering Rejection Verification

## Defense Against Client-Side Tampering

Any client manipulation attempting to bypass authorization or caps is intercepted:

### Tampering Scenarios Blocked:
1. **Manipulated Points Above Cap**:
   - Sending `45.0` on Research criterion (max 40.0) is rejected server-side.
2. **Deterministic Overrides**:
   - Sending arbitrary points on degree criteria is rejected.
3. **Cross-College Dean Submissions**:
   - Dean submitting evaluation for another college is rejected with 403 Forbidden.
4. **Forged Secretary Evaluator**:
   - Secretary token attempting score entry is rejected with 403 Forbidden.
5. **Self-Rating Submissions**:
   - Candidate attempting self-evaluation is rejected with 403 Forbidden.
