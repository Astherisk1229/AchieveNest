/**
 * card.jsx
 * shadcn-style Card Component System.
 */

import React from 'react'

export function Card({ className = '', children, ...props }) {
  const hasBg = className.includes('bg-')
  const defaultBg = hasBg ? '' : 'bg-white dark:bg-[#131e2e]'

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-200 ${defaultBg} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`text-lg font-extrabold leading-none tracking-tight text-slate-900 dark:text-white ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p
      className={`text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`flex items-center p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 ${className}`} {...props}>
      {children}
    </div>
  )
}
