# AchieveNest Plan 07 — Credential Handoff & Reset Procedure
## Standard Operating Procedures for OSAD & HR Administrators

---

## 1. Initial Credential Delivery Procedure

### Step 1: Provision Account
1. Open **OSAD Admin Portal** (for Students) or **HR Admin Portal** (for Personnel).
2. Complete the Provisioning form with verified institutional details.
3. Click **Submit**. Ensure the green success confirmation appears.

### Step 2: One-Time Credential Modal
1. The **One-Time Credential Modal** appears immediately displaying:
   - Account Owner Full Name;
   - Institutional ID;
   - Institutional Email (`@ndmu.edu.ph`);
   - 16+ Character Temporary Password;
   - Status: `Pending First Login`.
2. **Crucial Rule**: This modal is the **ONLY** time the temporary password will ever be visible. It cannot be reopened or retrieved from the database once closed.

### Step 3: Printing / Copying Credentials
1. Click **Print Credential Slip** to generate the official, minimal confidential slip.
2. Verify the print preview contains only:
   - Official AchieveNest header and confidentiality notice;
   - Account Owner Name & Institutional ID;
   - Login Email & Temporary Password;
   - Clear instructions that the recipient must change the password on first login.
3. If transmitting digitally through an approved internal channel, click **Copy Credentials** to copy formatted text to clipboard.

### Step 4: Physical Identity Verification & Handoff
1. The account owner must appear in person.
2. Request the owner's physical **Notre Dame of Marbel University ID card** or valid government ID.
3. Compare the name and Institutional ID on the card against the printed slip.
4. Hand the credential slip directly to the verified account owner.
5. Instruct the owner to visit the AchieveNest login portal immediately and establish their personal password.

### Step 5: Modal Dismissal
1. Click **Done / Close Modal**.
2. Frontend state and clipboard variables are wiped from memory.

---

## 2. In-Office Temporary Password Reset Procedure

When a student or personnel member loses their initial slip or is locked out:

### Step 1: Physical Identity Verification
1. The user must appear in person at the respective office (OSAD for Students, HR for Personnel).
2. Inspect the user's institutional ID card. Confirm identity matches system records.

### Step 2: Trigger Reset Transaction
1. Locate the user in **Account Management / Student Directory**.
2. Click **Reset Temporary Password**.
3. In the confirmation dialog:
   - Check the required box: *"I confirm that I have verified the physical identity of the account owner."*
   - Select the appropriate Reason (e.g. `Lost Initial Slip`, `Temporary Credential Expired`, `User Lockout`).
4. Click **Confirm Reset**.

### Step 3: Slip Generation & Delivery
1. The reset transaction atomically revokes all prior passwords and sessions, restores `pending_first_login`, and displays a new 16+ character passkey.
2. Click **Print Credential Slip** and hand the new slip directly to the owner.
3. Close the modal.

---

## 3. Explicit Administrative Prohibitions

> [!CAUTION]
> **Strict Operational Prohibitions**:
> 1. **NO Plaintext Storage**: Never screenshot, write down, or save temporary passwords in spreadsheets or personal notes.
> 2. **NO Third-Party Relaying**: Never hand a credential slip to a friend, classmate, or unauthorized colleague.
> 3. **NO Password "Recovery"**: Never attempt to inspect database hashes to "view" an existing password; the system does not support password retrieval. Use the administrative reset flow instead.
> 4. **Printing $\neq$ Activation**: Printing a slip does not activate an account; the account owner must independently log in and establish a personal password.
