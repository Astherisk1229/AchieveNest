# PLAN 10 — Phase 6 CSS Cleanup & Token Reuse Report
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Cleaned-Up Legacy CSS References

- Removed 10-column width constraints (`w-24`, `w-32`, `colSpan="10"`).
- Replaced table colspans with standardized `colSpan="4"`.
- Cleaned up obsolete standalone column styling for `Email`, `Sex`, `Enrollment`, `Program`, `College`, and `Year Level`.

---

# 2. Design System Token Reuse Inventory

| Token Category | AchieveNest Design System Tokens Used | Purpose |
|---|---|---|
| **Border Radius** | `rounded-2xl`, `rounded-xl`, `rounded-lg`, `rounded-md` | Container, button, and badge rounding |
| **Typography** | `font-sans`, `font-mono`, `text-sm`, `text-xs`, `text-[10px]` | Text sizes, hierarchy, and monospace IDs |
| **Primary Theme** | `bg-[#1B4D3E]`, `text-[#16834a]`, `bg-emerald-50` | Primary action buttons and badges |
| **Status Tokens** | `bg-amber-50`, `bg-emerald-50`, `bg-rose-50`, `bg-slate-100` | Account status pills and highlights |
| **Backgrounds** | `bg-white`, `dark:bg-[#131E2E]`, `bg-slate-50/80` | Cards, tables, and page containers |
