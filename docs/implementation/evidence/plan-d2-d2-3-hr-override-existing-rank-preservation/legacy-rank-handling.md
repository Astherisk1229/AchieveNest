# Phase D2-3: Legacy Rank Handling & Reconciliation

## Legacy Record Preservation
When an existing Personnel record contains a historical or unmapped rank string (e.g. `Legacy Senior Instructor Unranked` or `Instructor II`):

1. **Explicit Option Injection**:
   - `EditMasterDataModal.jsx` checks `isSavedRankInCatalog`.
   - If false, the saved value is explicitly rendered as:
     `<option value="{rank}">{rank} (Saved / Legacy Record - Reconciliation Required)</option>`
2. **Reconciliation Warning**:
   - A warning banner alerts HR:
     `⚠️ Saved rank "{rank}" is not in the active catalog. Explicit HR reconciliation required before replacing.`
3. **No Automatic Mapping**:
   - The system never silently coerces or approximates a legacy string to the nearest catalog rank.
   - The value is preserved until HR deliberately selects a canonical Plan E catalog rank.
