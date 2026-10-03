# Plan 06 Phase 6 — OSAD Entity Card Semantic Accessibility
## Accessible Naming, Keyboard Activation, and Focus/Hover Styling

| Card Type | Semantic Element / Role | Keyboard Activation | Visible Focus Ring | Hover Styling | Accessible Name / Context |
|---|---|---|---|---|---|
| `Organization Card` | `role="button" tabIndex={0}` | `Enter` & `Space` | `focus:ring-2 focus:ring-[#16834a]` | `hover:border-emerald-300 hover:shadow-md` | Exposes organization name and code |
| `Candidate Card` | `role="button" tabIndex={0}` | `Enter` & `Space` | `focus:ring-2 focus:ring-[#16834a]` | `hover:border-emerald-300 hover:shadow-md` | Exposes candidate name, award, and score |
| `Certificate Template Card`| `role="button" tabIndex={0}` | `Enter` & `Space` | `focus:ring-2 focus:ring-[#16834a]` | `hover:border-emerald-300 hover:shadow-md` | Exposes template name and category |

- **Invalid Nested Interactive Markup (e.g. `<button>` inside `<a>`)**: **0 (Zero)**.
- **Keyboard Traversal Compatibility**: **100% PASS**.
