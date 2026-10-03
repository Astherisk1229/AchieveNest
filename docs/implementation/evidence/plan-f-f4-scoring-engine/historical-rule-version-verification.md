# Historical Rule-Version Verification

## Rule Version Immutability
- All scoring executions are stamped with the authoritative rule version `NDMU-PERSONNEL-RATING-V2`.
- When scoring a historical submission snapshot, the scoring engine uses the version recorded at submission time.
- Any attempt to score under an unapproved or altered version string (e.g. `NDMU-LEGACY-V1`) fails validation with HTTP 422:
- `"Invalid or unsupported rule version [<version>]. Authoritative version is [NDMU-PERSONNEL-RATING-V2]."`
