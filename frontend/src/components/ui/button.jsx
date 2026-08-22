/**
 * button.jsx
 * shadcn-style Button Component System.
 */

import React from 'react'

export function Button({ variant = 'default', size = 'default', className = '', children, disabled = false, ...props }) {
  const variantStyles = {
    default: 'bg-[#176B43] text-white hover:bg-[#125536] border border-[#176B43] dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-xs focus-visible:ring-2 focus-visible:ring-[#176B43]/24',
    destructive: 'bg-[#FFFFFF] text-[#B42318] border border-[#E6A5A5] hover:bg-[#FFF0F0] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 shadow-xs',
    outline: 'bg-white text-[#145C39] border border-[#69A97C] hover:bg-[#EAF4EC] hover:border-[#16834A] dark:bg-[#131e2e] dark:text-slate-200 dark:border-slate-800 shadow-xs',
    secondary: 'bg-white text-[#174E31] border border-[#B8CDBD] hover:bg-[#F1F7F2] hover:border-[#6FA580] dark:bg-[#1D2A23] dark:text-slate-100 dark:border-[#374B3F] shadow-xs',
    ghost: 'hover:bg-[#F5F8F3] dark:hover:bg-slate-800 text-[#145C39] dark:text-slate-200',
    return: 'button-return',
    link: 'text-[#16834A] underline-offset-4 hover:underline dark:text-emerald-400 p-0 h-auto font-extrabold'
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
