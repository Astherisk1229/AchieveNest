import React from 'react'

export default function EvaluationSummaryAwardSection({ award }) {
  return (
    <section aria-labelledby={`${award.id}-heading`} className="break-inside-avoid [page-break-inside:avoid]">
      <h3 id={`${award.id}-heading`} className="border-b border-slate-900 pb-1 text-[13pt] font-bold uppercase tracking-[0.04em] text-slate-950">
        {award.name}
      </h3>

      <table className="mt-2.5 w-full table-fixed border-collapse text-[12pt] leading-[1.3] text-slate-800">
        <caption className="sr-only">Contributing achievements and points for {award.name}</caption>
        <thead className="[display:table-header-group]">
          <tr className="border-y border-slate-400 bg-slate-50 text-left text-slate-950">
            <th scope="col" className="w-[46%] px-1.5 py-1.5 font-semibold">Achievement / Evidence</th>
            <th scope="col" className="w-[40%] px-1.5 py-1.5 font-semibold">Criterion</th>
            <th scope="col" className="w-[14%] px-1.5 py-1.5 text-right font-semibold">Points</th>
          </tr>
        </thead>
        <tbody>
          {award.rows.map((row) => (
            <tr key={`${award.id}-${row.evidence}-${row.criterion}`} className="border-b border-slate-200 align-top">
              <td className="px-1.5 py-1.5">{row.evidence}</td>
              <td className="px-1.5 py-1.5">{row.criterion}</td>
              <td className="px-1.5 py-1.5 text-right tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-3 w-full max-w-[330px] break-inside-avoid space-y-0.5 text-[12pt] leading-[1.3] [page-break-inside:avoid]">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-300 pb-1 font-bold text-slate-950">
          <dt>Total</dt>
          <dd className="tabular-nums">{award.total}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 pt-1">
          <dt>Portfolio Potential Score</dt>
          <dd className="font-semibold tabular-nums">{award.portfolioPotentialScore}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt>Qualification Threshold</dt>
          <dd className="font-semibold tabular-nums">{award.qualificationThreshold}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 pt-1 font-bold text-emerald-800">
          <dt>Status</dt>
          <dd>{award.status}</dd>
        </div>
      </dl>
    </section>
  )
}
