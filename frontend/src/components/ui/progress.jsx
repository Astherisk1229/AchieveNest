/**
 * progress.jsx
 * shadcn-style Progress Bar Component.
 */

import React from 'react'

export function Progress({ value = 0, max = 100, className = '', indicatorClassName = '', ...props }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      className={`relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}
      {...props}
    >
      <div
        className={`h-full w-full flex-1 bg-[#1b4332] dark:bg-emerald-500 transition-all duration-300 rounded-full ${indicatorClassName}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
