# Privacy-Safe Error Responses

## 1. Information Leakage Prevention
When an unauthorized or cross-college actor attempts to access an evidence ID:
- The response returns a generic denial message: `"Access denied: Actor is not authorized to access this evidence."`
- The response **never** leaks the target user's name, candidate ID, institutional department, original filename, hash, or physical storage key.
- Observers cannot enumerate or extract personal information from evidence UUIDs.

## 2. Test Verification
- Test 7.3: `guarantees unauthorized error responses leak zero private metadata` (PASSED).
