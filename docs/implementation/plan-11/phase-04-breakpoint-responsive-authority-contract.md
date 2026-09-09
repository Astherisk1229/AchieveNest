# PLAN 11 — Phase 4 Breakpoint & Responsive Authority Contract
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Responsive Authority & Breakpoint Map

| Viewport Tier | Pixel Range | Canonical Breakpoint Source | Runtime Navigation Mode | Layout Structure |
|---|---|---|---|---|
| **Mobile (sm)** | `< 640px` | Tailwind CSS / DOM Viewport | `overlay` | Off-canvas drawer (0px width in page flow) |
| **Tablet (md)** | `640px - 1023px` | Tailwind CSS / DOM Viewport | `overlay` | Off-canvas drawer (0px width in page flow) |
| **Laptop (lg)** | `1024px - 1279px`| Tailwind CSS / DOM Viewport | `persistent` | Static sidebar (`w-64` in page flow) |
| **Desktop (xl)** | `1280px - 1535px`| Tailwind CSS / DOM Viewport | `persistent` | Static sidebar (`w-64` in page flow) |
| **Wide Desktop (2xl)**| `>= 1536px` | Tailwind CSS / DOM Viewport | `persistent` | Static sidebar (`w-64` in page flow) |

---

# 2. Invariant Rules
- Single authority count: **1** (Tailwind `lg = 1024px`).
- User-Agent detection: **0**.
- One-time width-read bugs: **0**.
