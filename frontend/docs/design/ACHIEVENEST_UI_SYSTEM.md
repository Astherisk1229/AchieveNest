# AchieveNest — Design System Specification

> **System Name:** Institutional Calm UI System  
> **Target Framework:** React + Tailwind CSS + Lucide Icons  
> **Brand Identity:** Notre Dame of Marbel University (NDMU) Institutional Green & Clean Neutral Canvas

---

## 1. Color Palette Tokens

```text
Canvas & Surfaces:
- page-bg:        #F8FAFC (slate-50) / dark: #0B1120
- surface:        #FFFFFF (white)    / dark: #131E2E
- surface-muted:  #F1F5F9 (slate-100)/ dark: #1E293B
- surface-hover:  #F8FAFC (slate-50) / dark: #1E293B (80% opacity)

Borders & Dividers:
- border-subtle:  #E2E8F0 (slate-200)/ dark: #1E293B
- border-divider: #F1F5F9 (slate-100)/ dark: #1E293B

Typography:
- text-primary:   #0F172A (slate-900)/ dark: #F8FAFC
- text-secondary: #475569 (slate-600)/ dark: #94A3B8
- text-muted:     #64748B (slate-500)/ dark: #64748B
- text-link:      #1B4D3E (brand)    / dark: #34D399

Brand & Semantic Accents:
- brand-primary:  #1B4D3E (dark institutional green)
- brand-hover:    #143B30
- brand-light:    #E7F5EA (emerald-50) / dark: #064E2B (30% opacity)
- status-success: #059669 (emerald-600) -> bg: #ECFDF5, border: #A7F3D0
- status-warning: #D97706 (amber-600)   -> bg: #FFFBEB, border: #FDE68A
- status-danger:  #DC2626 (rose-600)    -> bg: #FFF1F2, border: #FECDD3
- status-info:    #2563EB (blue-600)    -> bg: #EFF6FF, border: #BFDBFE
```

---

## 2. Typography Hierarchy

| Level | Tailwind Utility Classes | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight` | 20–24px | 700 | 1.25 |
| **Section Title**| `text-base sm:text-lg font-semibold text-slate-900 dark:text-white` | 16–18px | 600 | 1.35 |
| **Module Title** | `text-sm font-semibold text-slate-800 dark:text-slate-200` | 14px | 600 | 1.4 |
| **Body Text** | `text-sm text-slate-700 dark:text-slate-300` | 14px | 400 | 1.5 |
| **Subtext / Helper**| `text-xs text-slate-500 dark:text-slate-400 font-normal` | 12px | 400 | 1.4 |
| **Table Header**| `text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-normal` | 12px | 600 | 1.2 |
| **Badge / Pill** | `text-xs font-medium` | 11–12px | 500 | 1.2 |

*Anti-Fatigue Rule:* Avoid combining `text-[10px]` with `font-extrabold uppercase tracking-wider` on body items. Use standard sentence case.

---

## 3. Component Design Patterns

### A. Page Header (Restrained & Compact)
```jsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
  <div className="space-y-0.5">
    <div className="flex items-center gap-2">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h1>
      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 text-xs font-medium border border-emerald-200/60 dark:border-emerald-800/40">
        AY 2025–2026
      </span>
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400">
      {subtitle}
    </p>
  </div>
  <div className="flex items-center gap-2">
    {actions}
  </div>
</div>
```

### B. Lightweight Stat Item (Summary Strip)
```jsx
<div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200 dark:border-slate-800 space-y-1">
  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
    <span className="text-xs font-medium">{label}</span>
    <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
  </div>
  <div className="flex items-baseline gap-2">
    <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
    {subtext && <span className="text-xs text-slate-500 dark:text-slate-400">{subtext}</span>}
  </div>
</div>
```

### C. Standard Table Styling
- Table Container: `rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#131E2E]`
- Header Row: `bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800`
- Table Cell: `py-3.5 px-4 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60`
- Row Hover: `hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors`

### D. Buttons
- **Primary:** `px-3.5 py-2 rounded-lg bg-[#1B4D3E] hover:bg-[#143B30] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer`
- **Secondary / Outline:** `px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer`
- **Ghost / Action:** `p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer`

### E. Status Badges
- **Verified / Qualified:** `px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 text-xs font-medium`
- **Pending / Action Required:** `px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 text-xs font-medium`
- **Neutral / Draft:** `px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 text-xs font-medium`
