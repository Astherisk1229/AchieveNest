# Forged Payload Rejection & Server Authority Verification

## Server Authority Policy
> **The client submits classification inputs and evidence metadata. The backend validates the assigned scale and calculates only confirmed rules. Client-supplied final points are never trusted.**

---

## 1. Client Point Override Neutralization
- Client payload fields such as `claimed_points`, `awarded_points`, `score`, or `final_score` are strictly ignored during evaluation scoring.
- All points are computed on the server from verified discrete factor options (e.g. extent of talk, reach, scope, unit counts).

---

## 2. Tested Payload Injections
1. **Arbitrary Claimed Points**: Submitting `claimed_points: 999.0` for Ph.D. degree awards exactly `40.0 pts`.
2. **Forged Area Caps**: Client cannot alter Area A cap from 70 to 100.
3. **Forged Rule Version**: Submitting `rule_version: 'NDMU-LEGACY-V1'` is rejected with HTTP 422.
4. **Cross-Scale Injection**: Submitting an Administrators publication on Non-Teaching scale is rejected with HTTP 422.
5. **Non-Teaching Area A Post**: Attempting to post an accomplishment into Non-Teaching Area A is rejected with HTTP 409.
