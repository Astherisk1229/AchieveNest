# Duplicate Detection Privacy Controls

## 1. Privacy Protection Architecture
When comparing SHA-256 hashes across the institution, AchieveNest enforces strict privacy boundaries:

### 1. Same-Owner Matches:
- Returns detailed contextual information to the owner:
  - Previous upload timestamp
  - Original filename uploaded by the same user
  - Associated accomplishment title (if applicable)

### 2. Cross-Owner Matches (External Personnel):
- If a hash matches a file uploaded by another personnel member:
  - **Zero personal metadata is revealed**: The other user's name, user ID, institutional role, filename, or storage path are completely hidden.
  - Returns a generic message: `"Identical file content detected in system."`
  - `matching_items` is set to an empty array (`[]`).
  - No information leakage occurs.

## 2. Test Verification
- Verified by Test 5.4 in `PersonnelEvidenceIdentityI2.test.jsx`:
  `preserves privacy by hiding owner and filename on cross-owner hash match` (PASSED).
