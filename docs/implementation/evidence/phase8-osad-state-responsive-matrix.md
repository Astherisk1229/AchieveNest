# Phase 8 Evidence: OSAD State Responsive Matrix

| View / State | Mobile Viewport (<640px) | Tablet Viewport (640px - 1024px) | Desktop Viewport (>1024px) | Dark Mode Styling |
| :--- | :--- | :--- | :--- | :--- |
| `OSADLoadingState` | Centered spinner with wrapped text | Centered spinner with inline subtext | Full-width padded card | `dark:bg-[#131E2E] dark:text-slate-300` |
| `OSADEmptyState` | Full-width stacked icon, text, and button | Centered card, horizontal CTA | Centered bounded card | `dark:bg-[#131E2E] dark:border-slate-800` |
| `OSADSearchEmptyState` | Compact stacked reset button | Centered reset button with full text | Inline reset button with full text | `dark:bg-[#131E2E] dark:border-slate-800` |
| `OSADErrorState` | Full-width alert card, full-width retry CTA | Centered alert card with retry CTA | Centered alert card with retry CTA | `dark:bg-rose-950/40 dark:border-rose-800` |
| `OSADPermissionState` | Full-width warning card, full-width return CTA | Centered warning card with return CTA | Centered warning card with return CTA | `dark:bg-amber-950/40 dark:border-amber-800` |
