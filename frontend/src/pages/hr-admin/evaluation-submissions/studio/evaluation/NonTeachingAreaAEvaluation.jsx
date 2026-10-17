import React from 'react'
import { DsInput } from '../portfolio/NtfPortfolioDocument'

export default function NonTeachingAreaAEvaluation({ row, onUpdateAreaADs }) {
  if (!row) return null

  const factor = (row.max / 100).toFixed(2).replace(/^0/, '')
  return <section aria-label={`${row.code} Area A score`} className="rounded-xl border border-slate-200 p-4 text-sm text-slate-900 dark:border-slate-800 dark:text-slate-100">
    <h2 className="text-base font-bold">{row.code} {row.title}</h2>
    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Area A · Performance and Personal Indicators</p>
    <dl className="mt-4 grid grid-cols-2 gap-4 border-y border-slate-200 py-4 dark:border-slate-800">
      <div><dt className="text-xs text-slate-600 dark:text-slate-300">Weight</dt><dd className="mt-1 font-semibold tabular-nums">{row.max} pts · {factor}</dd></div>
      <div><dt className="text-xs text-slate-600 dark:text-slate-300">DS (0–100)</dt><dd className="mt-1 font-semibold tabular-nums">{onUpdateAreaADs ? <DsInput code={row.code} title={row.title} value={row.ds} onCommit={onUpdateAreaADs} /> : row.ds ?? '—'}</dd></div>
    </dl>
    <p className="mt-4 text-xs text-slate-600 dark:text-slate-300">Points earned = DS × {factor}</p>
    <p className="mt-1 text-lg font-bold tabular-nums text-emerald-800 dark:text-emerald-300">{row.points === null ? 'Pending' : `${Number(row.points).toFixed(2)} pts`}</p>
  </section>
}
