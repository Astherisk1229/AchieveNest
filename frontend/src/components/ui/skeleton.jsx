/**
 * skeleton.jsx
 * shadcn-style Skeleton Component.
 */

import React from 'react'

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800 ${className}`}
      {...props}
    />
  )
}
