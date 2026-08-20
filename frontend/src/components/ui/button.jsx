/**
 * button.jsx
 * shadcn-style Button Component System.
 */

import React from 'react'

export function Button({ variant = 'default', size = 'default', className = '', children, disabled = false, ...props }) {
  const variantStyles = {
    default: 'bg-[#1b4332] text-white hover:bg-[#143823] dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm',
    destructive: 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 shadow-sm',
    outline: 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131e2e] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
    link: 'text-[#2d8a4e] underline-offset-4 hover:underline dark:text-emerald-400 p-0 h-auto font-extrabold'
  }

  const sizeStyles = {
    default: 'h-10 px-4 py-2 text-xs font-extrabold rounded-xl',
    sm: 'h-8 px-3 text-[11px] font-bold rounded-lg',
    lg: 'h-12 px-6 text-sm font-extrabold rounded-2xl',
    icon: 'h-9 w-9 p-2 rounded-xl flex items-center justify-center'
  }

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size] || sizeStyles.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
