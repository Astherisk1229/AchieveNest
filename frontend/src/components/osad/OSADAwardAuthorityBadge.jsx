import React from 'react'
import { CheckCircle2, CircleDashed, ShieldAlert } from 'lucide-react'
import { resolveAwardAuthority } from '../../utils/awardAuthority'

const AUTHORITY_STYLES = {
  Official: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
  },
  Operationalized: {
    icon: CircleDashed,
    className: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
  },
  Proposed: {
    icon: ShieldAlert,
    className: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
  }
}

export default function OSADAwardAuthorityBadge({ value, className = '' }) {
  const label = resolveAwardAuthority(value)
  if (!label) {
    return (
      <span className={`inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ${className}`}>
        Authority unavailable
      </span>
    )
  }

  const config = AUTHORITY_STYLES[label]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold ${config.className} ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label === 'Proposed' ? 'Proposed criteria' : label}
    </span>
  )
}
