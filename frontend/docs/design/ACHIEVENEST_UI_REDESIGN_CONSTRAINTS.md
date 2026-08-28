# AchieveNest — UI/UX Redesign Constraints & Invariants

> **Scope:** Definitive constraints and architectural invariants governing the UI/UX cognitive-load reduction for the AchieveNest application.  
> **Authority:** These project-specific rules strictly override generic aesthetic suggestions from external design skills.

---

## 1. Core Brand & Visual Identity

- **Color Scheme:** Preserve the authoritative **Notre Dame of Marbel University (NDMU)** white and institutional dark green identity (`#1B4D3E` / emerald accents).
- **Functional Green Rule:** Institutional green must be semantic, intentional, and functional (e.g., active navigation, primary action button, verified status). It must **never** be used decoratively across multiple adjacent containers, icons, titles, and backgrounds simultaneously.
- **Calm Neutral Canvas:** Use light neutral background surfaces (`#F8FAFC` / `#F9FAFB`) with subtle 1px border separation (`#E2E8F0` / `#E5E7EB`).

---

## 2. Strict Architectural & Backend Invariants (DO NOT CHANGE)

The redesign is strictly a frontend presentation and cognitive-load optimization. The following systems and behaviors are **IMMUTABLE**:

1. **API Contracts & Routes:** Zero changes to API endpoints, URL paths, HTTP query parameters, payload structures, or response shapes.
2. **Authentication & Sessions:** Zero changes to JWT storage, session hydration (`/auth/me`), local token lifecycle, or password-reset workflows.
3. **Authorization & Role Scopes:**
   - Centralized RBAC and permission resolvers remain authoritative.
   - Program Coordinator scope remains strictly isolated (BSA Coordinator cannot access BSBA-FM students).
   - Dean governance remains check-and-balance oversight on HR evaluations and student award nominations.
   - OSAD Administrator exclusively manages Program Coordinator and Org Moderator assignments.
   - HR Administrator exclusively manages Dean assignments and Personnel evaluations.
4. **Institutional Hierarchy:**
   - **Academic:** College -> Academic Program (5 Colleges, 14 Programs). Zero legacy Department references.
   - **Non-Academic:** Administrative Units (19 Units).
5. **Potential Award Semantics:**
   - 80.00% candidate threshold invariant.
   - Status classification remains "Potential Candidate / Eligible for Interview". Zero "Final Awardee" concepts.
6. **File Security & Evidence Streaming:**
   - FormData upload signatures and token-authorized download routes remain unchanged.
   - Truthful security posture: `pending` status with `malware_scanner = none_deferred`. Zero fabricated "virus-free" claims.
7. **Offline Capability:** Zero introduction of external CDN scripts, remote fonts, or external runtime dependencies.

---

## 3. Cognitive-Load Reduction Guidelines

### A. Dashboard Header & Hero Streamlining
- **Eliminate Giant Marketing Banners:** Replace massive saturated dark-green hero containers with a compact, elegant page header (reduce header vertical height by ~40%).
- **De-clutter Setup Progress:** Remove oversized getting-started progress banners from primary viewport; integrate setup status cleanly into secondary contextual chips or collapsible sections.

### B. Metric & KPI Restraint
- **Actionable vs Passive:** Prominently elevate actionable queues (e.g., pending verification items, unassigned roles) over static informational counters.
- **Summary Strips:** Replace heavy, four-card boxed grids with lightweight summary strips or compact stat cards.

### C. Card & Container Nesting Elimination
- **Anti-Nesting Rule:** Strictly avoid `Card inside Card inside Card` patterns.
- **Table / List Direct Presentation:** Present structured data in clean tables or direct item rows rather than wrapping every single entity in an individual rounded card with borders and drop shadows.

### D. Typography & Micro-Hierarchy
- **Legible Minimums:** No essential readable text below 12px. Eliminate `text-[10px]` and `text-[11px]` on informative labels.
- **Sentence Case:** Eliminate excessive `uppercase tracking-wider` on body text, titles, descriptions, and table headers.

### E. Button & Action Hierarchy
- **Single Primary Action:** Each view should possess at most **one** visually dominant primary filled button (e.g., "+ Add Student" or "Create Program"). Secondary actions must use outline or ghost button styles.

---

## 4. Prohibited Visual Patterns

```text
[PROHIBITED]
- Brutalist or retro-futuristic styling
- Luxury or consumer marketing aesthetics
- Glassmorphism, backdrop blurs, or translucent frosted cards
- Large saturated gradient backgrounds
- Heavy drop shadows (shadow-xl, shadow-2xl)
- Decorative animations or looping micro-interactions
- Unconventional navigation layouts
- Proliferation of uncoordinated accent colors
- Card nesting deeper than 2 levels
```
