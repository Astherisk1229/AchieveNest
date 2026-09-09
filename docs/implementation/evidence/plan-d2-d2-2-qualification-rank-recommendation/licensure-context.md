# Phase D2-2: Licensure Context & Professional Board Verification

## Licensure Path Handling
Plan E defines special initial placement rules for degree holders with verified professional board licensure (e.g. CPA, Registered Nurse, Licensed Teacher, Registered Engineer):

1. **Explicit Licensure Context**:
   - When verified licensure metadata is passed (`has_verified_licensure: true` or `is_board_passer: true`), the resolver applies the licensed professional path:
     - **Full-Time**: Resolves to `Assistant Professor I` (`ASST_1`) instead of entry-level `Instructor I`.
     - **Part-Time**: Resolves to `Senior Lecturer` (`SR_LECTURER`) instead of entry-level `Lecturer`.
2. **No Unverified Guessing**:
   - If licensure status is unverified or false, the resolver does not guess board passage from the degree title alone and safely applies the standard baccalaureate path.
