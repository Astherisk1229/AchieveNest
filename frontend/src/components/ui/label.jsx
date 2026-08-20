/**
 * label.jsx
 * shadcn-style Label Component.
 */

import React from 'react'

export function Label({ className = '', children, ...props }) {
  return (
    <label
      className={`text-xs font-extrabold text-slate-700 dark:text-slate-300 leading-none select-none ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}
