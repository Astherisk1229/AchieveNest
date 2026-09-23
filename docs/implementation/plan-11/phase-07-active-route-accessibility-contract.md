# PLAN 11 — Phase 7 Active-Route Accessibility Contract
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Multi-Modal Active State Verification

| Sensory Channel | Active Indicator Strategy | Accessible Standard |
|---|---|---|
| **Programmatic / Assistive**| `aria-current="page"` attribute attached to active `<Link>` | WCAG 2.1 SC 4.1.2 / 1.3.1 (PASS) |
| **Visual Structure** | Emerald container background (`bg-[#dcebdd] dark:bg-emerald-950/70`) | Distinct contrast from transparent list items |
| **Border Accent** | 1px accent boundary (`border-[#dde6dd] dark:border-emerald-700/50`) | Structural outline |
| **Typography Weight** | Heavy bold weight (`font-extrabold text-xs text-[#123D2A]`) | Distinct from normal weight items |
| **Icon Fill** | Solid dark green icon pill (`bg-[#176B43] text-white`) | Instant recognition |

---

# 2. Invariant Rule
- Color is never the sole differentiator of active navigation state.
