import React from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'

const SUPPORTED_TYPES = new Set(['COUNT', 'HIGHEST_VALUE', 'ADDITIVE', 'PRESENCE', 'MATRIX', 'HUMAN_ONLY'])

const labelize = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const points = (value) => typeof value === 'number' ? `${value} pts` : String(value ?? '—')

function mappingEntries(mapping) {
  if (!mapping) return []
  if (Array.isArray(mapping)) return mapping.map((item, index) => ({
    label: item.label || item.name || (item.count_min !== undefined ? `${item.count_min}+ items` : item.count !== undefined ? `${item.count} items` : item.value ? labelize(item.value) : `Option ${index + 1}`),
    value: item.points ?? item.value
  }))
  if (Array.isArray(mapping.entries)) return mappingEntries(mapping.entries)
  return Object.entries(mapping)
    .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
    .map(([label, value]) => ({ label: labelize(label), value }))
}

function RuleDisclosure({ mapping, children }) {
  if (!mapping) return null
  return (
    <details className="group mt-3 rounded-lg bg-slate-50 px-3 dark:bg-slate-900/70">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-200">
        View scoring details
        <ChevronDown className="h-4 w-4 transition-transform motion-reduce:transition-none group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  )
}

function MappingList({ mapping, prefix = '' }) {
  const entries = mappingEntries(mapping)
  if (entries.length === 0) return <UnavailableMapping />
  return (
    <dl className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
      {entries.map((entry) => (
        <div key={entry.label} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
          <dt className="text-slate-600 dark:text-slate-300">{entry.label}</dt>
          <dd className="shrink-0 tabular-nums font-semibold text-slate-900 dark:text-white">{prefix}{points(entry.value)}</dd>
        </div>
      ))}
    </dl>
  )
}

function UnavailableMapping() {
  return <p className="text-sm text-amber-800 dark:text-amber-300">Point mapping unavailable.</p>
}

function Matrix({ mapping }) {
  if (Array.isArray(mapping?.rows) && Array.isArray(mapping?.columns) && Array.isArray(mapping?.values)) {
    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800" tabIndex="0" aria-label="Scoring matrix; scroll horizontally on smaller screens">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900"><tr><th scope="col" className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">Placement</th>{mapping.columns.map((column) => <th scope="col" key={column} className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">{labelize(column)}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{mapping.rows.map((row, rowIndex) => <tr key={row}><th scope="row" className="sticky left-0 bg-white px-3 py-2 text-left font-medium text-slate-700 dark:bg-[#131e2e] dark:text-slate-200">{labelize(row)}</th>{mapping.columns.map((column, columnIndex) => <td key={column} className="px-3 py-2 text-right tabular-nums text-slate-900 dark:text-white">{mapping.values[rowIndex]?.[columnIndex] ?? '—'}</td>)}</tr>)}</tbody>
        </table>
      </div>
    )
  }
  const matrix = mapping?.matrix || mapping?.medal_matrix || mapping
  const columns = matrix && !Array.isArray(matrix) ? Object.keys(matrix) : []
  const rowNames = [...new Set(columns.flatMap((column) => Object.keys(matrix[column] || {})))]
  if (columns.length === 0 || rowNames.length === 0) return <UnavailableMapping />

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800" tabIndex="0" aria-label="Scoring matrix; scroll horizontally on smaller screens">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            <th scope="col" className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">Placement</th>
            {columns.map((column) => <th scope="col" key={column} className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">{labelize(column)}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rowNames.map((row) => (
            <tr key={row}>
              <th scope="row" className="sticky left-0 bg-white px-3 py-2 text-left font-medium text-slate-700 dark:bg-[#131e2e] dark:text-slate-200">{labelize(row)}</th>
              {columns.map((column) => <td key={column} className="px-3 py-2 text-right tabular-nums text-slate-900 dark:text-white">{matrix[column]?.[row] ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RuleSummary({ criterion }) {
  const type = criterion.type
  if (type === 'COUNT') return 'Verified records contribute according to the published count rule, up to the stated cap.'
  if (type === 'HIGHEST_VALUE') return 'The highest verified qualifying value is used.'
  if (type === 'ADDITIVE') return 'Qualifying verified records are added according to the published mapping, up to the stated cap.'
  if (type === 'PRESENCE') return criterion.evidenceRequirement || 'At least one verified qualifying record is required.'
  if (type === 'MATRIX') return 'Points follow the published matrix and stated aggregation rule.'
  return null
}

function RuleMetadata({ criterion }) {
  const rows = [
    ['Aggregation', criterion.aggregationMode],
    ['Duplicate handling', criterion.duplicateRule],
    ['Evidence', criterion.evidenceRequirement]
  ].filter(([, value]) => value)
  if (rows.length === 0) return null
  return (
    <dl className="mt-3 grid gap-1 text-xs text-slate-500 dark:text-slate-400">
      {rows.map(([label, value]) => <div key={label}><dt className="inline font-semibold text-slate-600 dark:text-slate-300">{label}: </dt><dd className="inline">{value}</dd></div>)}
    </dl>
  )
}

export default function CriterionRenderer({ criterion }) {
  if (!criterion || criterion.humanOnly) return null
  const mapping = criterion.pointMapping
  const supported = SUPPORTED_TYPES.has(criterion.type)

  return (
    <article className="border-t border-slate-200 py-5 first:border-t-0 dark:border-slate-800" data-criterion-type={criterion.type || 'UNAVAILABLE'}>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-950 dark:text-white">{criterion.name}</h3>
        <span className="shrink-0 text-sm tabular-nums font-semibold text-slate-700 dark:text-slate-200">{criterion.maxPoints === null ? 'Maximum unavailable' : `${criterion.maxPoints} pts max`}</span>
      </div>
      {supported ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{RuleSummary({ criterion })}</p> : <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">Scoring type unavailable pending configuration.</p>}

      {criterion.scoringStatus === 'PARTIALLY_UNSCORABLE' && (
        <div className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Some scoring details are not currently defined.</span>
        </div>
      )}
      {criterion.warnings.map((warning, index) => <p key={`${warning.code || 'warning'}-${index}`} className="mt-2 text-xs text-amber-800 dark:text-amber-300">{warning.message}</p>)}

      {criterion.type === 'PRESENCE' && mapping && <div className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200"><MappingList mapping={mapping} /></div>}
      {criterion.type === 'MATRIX' && <div className="mt-4"><Matrix mapping={mapping} /></div>}
      {['COUNT', 'HIGHEST_VALUE', 'ADDITIVE'].includes(criterion.type) && (
        <RuleDisclosure mapping={mapping}><MappingList mapping={mapping} prefix={criterion.type === 'ADDITIVE' ? '+' : ''} /></RuleDisclosure>
      )}
      {supported && criterion.type !== 'PRESENCE' && criterion.type !== 'MATRIX' && !mapping && <div className="mt-3"><UnavailableMapping /></div>}
      <RuleMetadata criterion={criterion} />
    </article>
  )
}
