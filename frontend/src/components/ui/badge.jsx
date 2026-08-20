/**
 * badge.jsx
 * shadcn-style Badge Component System.
 */

import React from 'react'

export function Badge({ variant = 'default', className = '', children, ...props }) {
  const variantStyles = {
    default: 'bg-[#1b4332] text-white hover:bg-[#143426] dark:bg-emerald-600 dark:hover:bg-emerald-700 border-transparent',
    secondary: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-transparent',
    outline: 'text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 bg-transparent',
    destructive: 'bg-rose-500 text-white dark:bg-rose-600 border-transparent',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    sky: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[10px] font-extrabold transition-colors focus:outline-none uppercase tracking-wider ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
