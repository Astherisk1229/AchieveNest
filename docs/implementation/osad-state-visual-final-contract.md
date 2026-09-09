# OSAD State Handling & Visual Consistency Contract — Final Reference
## AchieveNest Plan 06: Final State & Visual Contract

---

## 1. State Differentiation Contract (`OSADStateBlock.jsx`)

The system strictly differentiates 5 operational UI states:

1. **`OSADLoadingState`**:
   - Presentation: Pulse skeleton card, spinning loader icon.
   - Purpose: Asynchronous data loading and API round-trips.
2. **`OSADEmptyState`**:
   - Presentation: Folder/Database icon, clear explanation, optional primary creation CTA.
   - Purpose: Database table has zero records.
3. **`OSADSearchEmptyState`**:
   - Presentation: Search icon, query term echo, reset filter button.
   - Purpose: Records exist, but active search/filter matches 0 rows.
4. **`OSADErrorState`**:
   - Presentation: Danger icon, user-friendly message, primary retry button, `role="alert"`.
   - Purpose: API failure or network timeout (shielding raw SQL/paths).
5. **`OSADPermissionState`**:
   - Presentation: Shield lock icon, access explanation, return navigation CTA.
   - Purpose: User lacks required role permissions for specific feature.

---

## 2. Visual Consistency & Design Tokens

- **Brand Primary**: NDMU Green `#176B43` (Hover `#125536`, Soft `#DCEBDD`).
- **Surface**: White `#FFFFFF` (Light), `#131E2E` (Dark).
- **Page Background**: `#F8FAF7` (Light), `#0B1320` (Dark).
- **Text Contrast**: Primary `#123D2A` (>=9.8:1), Secondary `#3F6B52` (>=4.7:1).
- **Gray-on-Gray Active Controls**: **0** (Completely prohibited).
- **Status Badges**: Combine color tint with explicit textual label (Active, Pending, Disqualified, etc.).
