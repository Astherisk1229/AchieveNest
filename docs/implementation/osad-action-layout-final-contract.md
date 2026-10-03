# OSAD Action & Layout Contract — Final Reference
## AchieveNest Plan 06: Final Action & Layout Contract

---

## 1. Action Hierarchy & Sizing Rules

- **Primary Action (CTA)**:
  - Single primary action per page header action zone.
  - Sizing: `min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#176B43] dark:bg-emerald-600 text-white font-extrabold text-xs`.
  - Focus Ring: `focus:outline-none focus:ring-2 focus:ring-[#16834a] focus:ring-offset-2`.
- **Secondary Action**:
  - Visually quieter, high-contrast alternative.
  - Sizing: `min-h-[44px] px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-[#123D2A] dark:text-slate-200 border border-[#dde6dd] dark:border-slate-700`.
- **Destructive Action**:
  - Distinct caution styling for deletions/disqualifications.
  - Sizing: `min-h-[44px] px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800`.
  - Must require confirmation modal prior to execution.
- **Ghost / Tertiary Action**:
  - Transparent base with visible hover state (`hover:bg-slate-100 dark:hover:bg-slate-800`).

---

## 2. Intentional Alternate Entries

Three alternate entry points were audited and confirmed as intentional context-dependent shortcuts:
1. **View Student Portfolio**: Available in Student Account table rows as well as direct portfolio review.
2. **Reset Password Row Action**: Available directly in Password Reset queue rows as well as Student Account edit modal.
3. **Dual-CTA Onboarding Widget**: Docked sidebar guide providing contextual quick-start actions for new administrators.

---

## 3. Placement & Alignment Rules

- **Header Alignment**: Page title, subtitle, and breadcrumbs left-aligned; primary actions placed in the top-right header action zone (or stacked in responsive mobile views).
- **Search & Filters**: Placed directly above controlled list/table content.
- **Grid Layout**: Standardized responsive grid gutters (`gap-4 sm:gap-6`).
- **Modal Dialog Action Alignment**: Cancel button on left of footer cluster, Confirm/Submit primary button on right of footer cluster.
