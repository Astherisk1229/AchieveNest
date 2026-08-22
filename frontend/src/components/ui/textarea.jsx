/**
 * textarea.jsx
 * shadcn-style Textarea Component.
 */

import React from 'react'

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`flex min-h-20 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16834a] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-[#131e2e] transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}
