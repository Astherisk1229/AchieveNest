# AchieveNest — OSAD Organization Creation & Management
## Final Workflow Specification
**Authoritative Operational Workflow Document**

---

### 1. Creation Workflow

The creation workflow provides an integrated multi-step modal experience:

```text
[Create Student Organization]
  │
  ├── 1. Organization Information
  │      - Name (with non-destructive Title Case suggestion assist)
  │      - Acronym / Code (uppercased)
  │      - Classification / Category
  │      - Organizational Scope (University / College / Program)
  │      - Parent Academic College (required if College- or Program-scoped)
  │      - Optional Logo Image Upload (PNG/JPEG/WebP <= 5 MB)
  │
  ├── 2. Academic Program Scope
  │      - Degree program multi-selection (checkbox list filtered by parent college)
  │      - Classification-aware validation (required if Scope = Program)
  │
  ├── 3. Optional Initial Organization Moderator
  │      - Moderator selection (eligible active faculty / personnel)
  │
  ├── 4. Review & Confirmation
  │      - Full review of entered details and affiliations
  │
  └── 5. Authoritative Backend Creation
         - Single atomic transaction
         - Immediate reload into directory
```

---

### 2. Organization Directory & Navigation

```text
[OSAD Dashboard — Student Organizations Tab]
  │
  ├── Filter by Scope (All / University / College / Program)
  ├── Filter by Category
  │
  └── Organization Card Grid (Accessible & Keyboard Focusable)
         ├── Click Card Body / Press Enter ──► [Organization Details View]
         │                                       (?tab=organizations&orgId=:id)
         │
         └── Click "Assign / Reassign" ──────► [PersonnelSelectorModal]
             (Isolated with e.stopPropagation)
```

---

### 3. Post-Creation Management Workflow

All post-creation operations are centrally managed from `OSADOrganizationDetailsView`:

```text
                                [Organization Details View]
                                              │
         ┌──────────────────┬─────────────────┴─────────────────┬──────────────────┐
         ▼                  ▼                                   ▼                  ▼
[Edit Organization]  [Add Program Scope]             [Assign / Reassign Mod] [Remove Moderator]
 - Master Data only   - College-filtered search       - Opens candidate modal  - Confirmed action
 - Branding / Logo    - Atomic batch add               - Soft-deactivates old   - Soft-deactivates
 - Status transition  - Duplicate prevention           - Activates new tenure   - Sets Unassigned
                      - Remove program confirmation                            - Retains history
```

---

### 4. Organization Name Formatting Assistance

1. **Non-Destructive UX Pattern**:
   - The user types a name (e.g. `association of information technology students`).
   - The pure helper `formatOrganizationNameSuggestion` generates a suggestion (`Association of Information Technology Students`).
   - If the suggestion differs from the current input, a suggestion badge appears with a `Use Suggested Format` button.
   - The user may click to apply or ignore the suggestion.
2. **Review & Storage**:
   - The review step and API payload send the exact user-approved text.
   - The backend stores the submitted name verbatim without silent mutation.
