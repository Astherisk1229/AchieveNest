# Phase 10 Evidence: OSAD Button Consistency Matrix

| Button Role | Height / Min Touch | Padding | Border Radius | Background / Text | Focus Ring | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Action** | `min-h-[44px]` | `px-4 py-2.5` | `rounded-2xl` / `rounded-xl` | `bg-[#176B43] dark:bg-emerald-600 text-white` | `focus:ring-2 focus:ring-[#16834a]` | **PASS** |
| **Secondary Action** | `min-h-[44px]` | `px-4 py-2.5` | `rounded-2xl` / `rounded-xl` | `bg-white dark:bg-slate-800 text-[#123D2A] border-[#dde6dd]` | `focus:ring-2 focus:ring-slate-400` | **PASS** |
| **Destructive Action** | `min-h-[44px]` | `px-4 py-2.5` | `rounded-2xl` / `rounded-xl` | `bg-rose-50 dark:bg-rose-950/40 text-rose-700 border-rose-200` | `focus:ring-2 focus:ring-rose-500` | **PASS** |
| **Ghost / Tertiary** | `min-h-[44px]` | `px-3.5 py-2` | `rounded-xl` | `transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100` | `focus:ring-2 focus:ring-slate-400` | **PASS** |
| **Icon-Only Action** | `min-h-[44px] min-w-[44px]` | `p-2.5` | `rounded-xl` | `bg-slate-100 dark:bg-slate-800 text-slate-700` | `focus:ring-2 focus:ring-[#16834a]` | **PASS** |
| **State Retry Action** | `min-h-[44px]` | `px-5 py-2.5` | `rounded-2xl` | `bg-[#176B43] dark:bg-emerald-600 text-white font-extrabold` | `focus:ring-2 focus:ring-[#16834a]` | **PASS** |
