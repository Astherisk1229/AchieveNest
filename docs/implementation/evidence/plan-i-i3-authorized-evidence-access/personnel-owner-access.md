# Personnel Owner Evidence Access

## 1. Owner Authorization Rules
1. **Direct Ownership**: Authenticated personnel can view, preview, and download their own attached evidence files across active portfolio drafts and submissions.
2. **Identity Verification**: The backend matches `actor.profile_id` against `evidence.personnel_id` (or `uploader_id`).
3. **Client-Tampering Immunity**: Submitting arbitrary owner IDs in client headers or body payloads is ignored; identity is exclusively derived from the verified session token.
4. **Cross-Owner Denial**: Attempting to view or download another candidate's evidence ID returns HTTP 403 `FORBIDDEN` (`evidence_access_forbidden`).

## 2. Test Verification
- Test 1.1: `allows Personnel owner to preview their own evidence` (PASSED)
- Test 1.2: `allows Personnel owner to download their own evidence` (PASSED)
- Test 1.3: `denies access when another Personnel member attempts to access evidence` (PASSED)
- Test 1.4: `ignores client attempts to forge owner ID in request metadata` (PASSED)
