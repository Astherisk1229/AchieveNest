import React from 'react'
import { CalendarCheck2, CalendarX2, GraduationCap, HelpCircle } from 'lucide-react'

/**
 * Shows whether a portfolio record takes part in the open ranking cycle. The decision comes
 * from the server (the same gate used when the portfolio is submitted); this only displays it.
 */
export function cycleValidityLabel(validity) {
  if (!validity?.status) return null
  if (validity.status === 'ELIGIBLE') return validity.validity_type === 'QUALIFICATION' ? 'Valid qualification' : 'Within evaluation period'
  if (validity.status === 'OUTSIDE_CYCLE') return 'Outside evaluation period'
  if (validity.status === 'NEEDS_INFORMATION') return 'Needs information'
  return null
}

const STYLES = {
  ELIGIBLE: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300',
  OUTSIDE_CYCLE: 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
  NEEDS_INFORMATION: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300',
}

export default function CycleValidityBadge({ validity, className = '' }) {
  const label = cycleValidityLabel(validity)
  if (!label) return null
  const Icon = validity.status === 'OUTSIDE_CYCLE' ? CalendarX2 : validity.status === 'NEEDS_INFORMATION' ? HelpCircle : validity.validity_type === 'QUALIFICATION' ? GraduationCap : CalendarCheck2
  return <span title={validity.reason || label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${STYLES[validity.status] || STYLES.OUTSIDE_CYCLE} ${className}`}>
    <Icon className="w-3 h-3 shrink-0" aria-hidden="true"/>
    <span>{label}</span>
  </span>
}
