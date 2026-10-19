import React from 'react'
import { Clock, CheckCircle2, RotateCcw } from 'lucide-react'

export default function CoordinatorMetricsSidebar({
  pendingCount = 0,
  verifiedCount = 0,
  returnedCount = 0
}) {
  const metrics = [
    {
      label: 'Pending reviews',
      description: 'Awaiting coordinator review',
      value: pendingCount,
      Icon: Clock,
      card: 'border-amber-200 bg-amber-50/80 dark:border-amber-900/70 dark:bg-amber-950/25',
      icon: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
      valueColor: 'text-amber-950 dark:text-amber-100'
    },
    {
      label: 'Verified',
      description: 'Approved submissions',
      value: verifiedCount,
      Icon: CheckCircle2,
      card: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/70 dark:bg-emerald-950/25',
      icon: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
      valueColor: 'text-emerald-950 dark:text-emerald-100'
    },
    {
      label: 'Returned',
      description: 'Sent back for revision',
      value: returnedCount,
      Icon: RotateCcw,
      card: 'border-rose-200 bg-rose-50/80 dark:border-rose-900/70 dark:bg-rose-950/25',
      icon: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
      valueColor: 'text-rose-950 dark:text-rose-100'
    }
  ]

  return (
    <section aria-label="Verification overview" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {metrics.map(({ label, description, value, Icon, card, icon, valueColor }) => (
        <div key={label} aria-label={`${label}: ${value}`} className={`min-w-0 rounded-xl border px-4 py-3.5 ${card}`}>
          <div className="flex items-center gap-2.5">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${icon}`}>
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{label}</p>
              <p className="truncate text-xs text-slate-600 dark:text-slate-300">{description}</p>
            </div>
            <p className={`ml-auto text-3xl font-extrabold leading-none tabular-nums ${valueColor}`}>{value}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
