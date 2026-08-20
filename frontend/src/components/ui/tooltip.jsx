/**
 * tooltip.jsx
 * shadcn-style Tooltip Component System.
 */

import React, { useState } from 'react'

export function TooltipProvider({ children }) {
  return <>{children}</>
}

export function Tooltip({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {React.Children.map(children, child => {
        if (child.type === TooltipTrigger) return child
        if (child.type === TooltipContent) return isOpen ? child : null
        return child
      })}
    </div>
  )
}

export function TooltipTrigger({ children, className = '', ...props }) {
  return (
    <div className={`inline-flex ${className}`} {...props}>
      {children}
    </div>
  )
}

export function TooltipContent({ children, className = '', ...props }) {
  return (
    <div
      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-extrabold shadow-md whitespace-nowrap animate-in fade-in duration-150 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
