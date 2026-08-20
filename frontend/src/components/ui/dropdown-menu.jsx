/**
 * dropdown-menu.jsx
 * Custom shadcn-style Dropdown Menu Component System.
 */

import React from 'react'

export function DropdownMenu({ children, className = '' }) {
  return <div className={`relative inline-block text-left ${className}`}>{children}</div>
}

export function DropdownMenuContent({ className = '', children, ...props }) {
  return (
    <div
      className={`z-50 min-w-[14rem] overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 text-slate-950 dark:text-slate-50 shadow-xl transition-all duration-150 animate-in fade-in-80 zoom-in-95 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({ className = '', variant = 'default', children, ...props }) {
  const variantStyles =
    variant === 'destructive'
      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-semibold'
      : variant === 'emerald'
      ? 'text-[#1b4332] dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 font-semibold'
      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'

  return (
    <button
      type="button"
      className={`w-full relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs outline-none transition-colors duration-150 cursor-pointer select-none ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownMenuLabel({ className = '', children, ...props }) {
  return (
    <div
      className={`px-3 py-2 text-xs font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 mb-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className = '', ...props }) {
  return <div className={`-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800 ${className}`} {...props} />
}
