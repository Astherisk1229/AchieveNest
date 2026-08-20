/**
 * separator.jsx
 * shadcn-style Separator Component.
 */

import React from 'react'

export function Separator({ orientation = 'horizontal', className = '', ...props }) {
  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      role="separator"
      className={`shrink-0 bg-slate-200/80 dark:bg-slate-800 ${
        isHorizontal ? 'h-[1px] w-full' : 'h-full w-[1px]'
      } ${className}`}
      {...props}
    />
  )
}
