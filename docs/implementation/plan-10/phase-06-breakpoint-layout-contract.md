# PLAN 10 — Phase 6 Breakpoint & Layout Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Breakpoint Tier Specifications

| Breakpoint Tier | Target Screen Width | Display Mode | Layout Container Styling | Horizontal Scroll Status |
|---|---|---|---|---|
| **Large Desktop (2xl)** | `>= 1536px` | 4-Column Table | `w-full text-left text-xs border-collapse` | **0px (No scroll)** |
| **Standard Desktop (xl)** | `1280px - 1535px` | 4-Column Table | `w-full text-left text-xs border-collapse` | **0px (No scroll)** |
| **Laptop / Small Desktop (lg)** | `1024px - 1279px` | 4-Column Table | `w-full text-left text-xs border-collapse` | **0px (No scroll)** |
| **Tablet (md)** | `768px - 1023px` | 4-Column Table | `w-full text-left text-xs border-collapse` (compact padding) | **0px (No scroll)** |
| **Mobile (sm)** | `< 768px` | Card Stack | `block md:hidden divide-y divide-slate-100` | **0px (Card Stack)** |
