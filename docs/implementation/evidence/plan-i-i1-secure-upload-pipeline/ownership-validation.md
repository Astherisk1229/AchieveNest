# Personnel Ownership Validation

## Enforcement Rules
1. **Server-Derived Identity**:
   - The authenticated actor's profile ID is resolved directly from the validated Bearer JWT (`$actor['profile']['id']`).
   - Client-provided owner parameters, path variables, or query strings are never trusted as proof of ownership.
2. **Accomplishment Binding**:
   - Target accomplishment is loaded from the database using `$accomplishmentId`.
   - Verified that `$accomplishment['personnel_profile_id'] === $actor['profile']['id']`.
3. **Rejection Behaviors**:
   - Non-existent accomplishment: Returns `HTTP 404 NOT_FOUND`.
   - Cross-owner upload attempt (Actor A uploading to Actor B's accomplishment): Returns `HTTP 403 FORBIDDEN` (`FORBIDDEN`).
