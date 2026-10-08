import React from 'react'
import { FileText, Paperclip } from 'lucide-react'
import EvidenceImages from './EvidenceImages'
import { nonTeachingServicePoints } from '../../utils/nonTeachingBooklet'

// DOM ids used only by the on-screen copy (the print copy carries no ids).
export const areaAnchor = (key) => `booklet-area-${key}`
export const criterionAnchor = (key) => `booklet-criterion-${key}`
export const rowAnchor = (id) => `booklet-row-${id}`
export const proofAnchor = (id) => `booklet-proof-${id}`

const displayDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}
export const displayDateOrPeriod = (value) => String(value || '').split(' – ').map(displayDate).join(' – ').replace('Invalid Date', 'Ongoing')
const number = (value, digits = 2) => (value === null || value === undefined || Number.isNaN(Number(value)) ? '—' : Number(value).toLocaleString('en-PH', { minimumFractionDigits: digits, maximumFractionDigits: 2 }))

const dateForSort = (row) => {
  const source = row?.source || {}
  const value = source.occurrence_date || source.date_achieved || source.date || row?.date_or_period_display
  const timestamp = Date.parse(String(value || '').split(' – ')[0])
  return Number.isNaN(timestamp) ? 0 : timestamp
}

/** Pages follow the official Faculty form sequence and Appendix N's two-area structure. */
export function buildBookletPages(format, rows) {
  if (format.id === 'faculty_academic') {
    const areaA = format.areas.find((area) => area.key === 'A')
    const areaB = format.areas.find((area) => area.key === 'B')
    const areaC = format.areas.find((area) => area.key === 'C')
    const bCriteria = format.criteria.filter((criterion) => criterion.area === 'B')
    const criteriaFor = (area, selected = null, anchor = true) => ({
      ...area,
      anchor,
      criteria: format.criteria.filter((criterion) => criterion.area === area.key && (!selected || selected.includes(criterion.key)))
    })
    const contentPages = [
      { type: 'content', key: 'faculty-form-page-1', contentAreas: [criteriaFor(areaA), criteriaFor(areaB, bCriteria.slice(0, 1).map((criterion) => criterion.key))] },
      { type: 'content', key: 'faculty-form-page-2', contentAreas: [criteriaFor(areaB, bCriteria.slice(1).map((criterion) => criterion.key), false), criteriaFor(areaC)], signatureBlock: true }
    ]
    const proofs = rows.filter((row) => row.evidence).sort((a, b) => dateForSort(b) - dateForSort(a))
    return [...contentPages, ...proofs.map((item) => ({ type: 'proof', key: `proof-${item.accomplishmentId}`, item }))]
  }

  return [
    ...format.areas.map((area) => ({
      type: 'content',
      key: `area-${area.key}`,
      contentAreas: [{ ...area, criteria: format.criteria.filter((criterion) => criterion.area === area.key) }]
    })),
    ...rows.filter((row) => row.evidence).map((row) => ({ type: 'proof', key: `proof-${row.accomplishmentId}`, item: row }))
  ]
}

function PageHeader({ format, user, portfolio }) {
  return (
    <header className="border-b-2 border-emerald-900 pb-5">
      {format.id === 'faculty_academic' ? (
        <>
          <p className="text-center font-serif text-lg font-bold tracking-wide text-slate-950">FACULTY DEVELOPMENT PROGRAM</p>
          <h2 className="mt-1 text-center font-serif text-base font-semibold">Portfolio</h2>
        </>
      ) : (
        <>
          <p className="text-center font-serif text-xs font-bold tracking-[0.18em] text-emerald-900">NOTRE DAME OF MARBEL UNIVERSITY</p>
          <h2 className="mt-3 text-center font-serif text-xl font-bold">{format.documentTitle}</h2>
        </>
      )}
      <dl className={`${format.id === 'faculty_academic' ? 'mt-5 grid grid-cols-2 gap-x-10 gap-y-1' : 'mt-6 grid grid-cols-[1fr_auto] gap-x-10 gap-y-0.5'} font-serif text-sm`}>
        {format.headerFields(user, portfolio).map(([label, value]) => <div key={label}><dt className="inline">{`${label}: `}</dt><dd className="inline">{value}</dd></div>)}
      </dl>
    </header>
  )
}

const cell = 'border-r border-slate-300 p-2 align-top last:border-r-0'

function AreaARatingTable({ areaARows = [], renderAreaADs }) {
  const anyRated = areaARows.some((row) => row.points !== null)
  return (
    <>
      <p className="mt-2 text-[10px] italic text-slate-600">Rated by HR from the annual performance reviews · Points earned = DS × weight.</p>
      <div className="mt-2 overflow-hidden border border-slate-400">
        <table className="w-full table-fixed border-collapse text-left text-[10px]">
          <thead className="bg-slate-100"><tr><th className="w-[46%] border-r border-slate-400 p-2">Criteria</th><th className="border-r border-slate-400 p-2 text-center">Weight</th><th className="border-r border-slate-400 p-2 text-center">DS</th><th className="p-2 text-right">Points Earned</th></tr></thead>
          <tbody>
            {areaARows.map((row) => (
              <tr key={row.code} className="border-t border-slate-300">
                <td className={cell}><span className="mr-1 font-bold">{row.code}</span>{row.title}</td>
                <td className={`${cell} text-center tabular-nums`}>{row.max} pts</td>
                <td className={`${cell} text-center tabular-nums`}>{renderAreaADs ? renderAreaADs(row) : (row.ds === null ? '—' : number(row.ds, 0))}</td>
                <td className={`${cell} text-right font-semibold tabular-nums`}>{row.points === null ? (anyRated ? '—' : 'Rated by HR') : number(row.points)}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-400 bg-slate-50 font-bold"><td className={cell} colSpan={3}>Category Total (maximum 90)</td><td className={`${cell} text-right tabular-nums`}>{anyRated ? number(areaARows.reduce((sum, row) => sum + (row.points || 0), 0)) : '—'}</td></tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function ServiceRow({ portfolio }) {
  const years = portfolio.tenure_years ?? portfolio.years_of_service
  const points = nonTeachingServicePoints(years)
  return (
    <div className="mt-2 overflow-hidden border border-slate-400">
      <table className="w-full table-fixed border-collapse text-left text-[10px]">
        <thead className="bg-slate-100"><tr><th className="w-[60%] border-r border-slate-400 p-2">Completed years (official employment record)</th><th className="p-2 text-right">Points (1 per 2 years, max 10)</th></tr></thead>
        <tbody><tr className="border-t border-slate-300"><td className={cell}>{points === null ? 'Taken from the HR employment record' : `${years} year${Number(years) === 1 ? '' : 's'}`}</td><td className={`${cell} text-right tabular-nums`}>{points === null ? '—' : `${points} / 10`}</td></tr></tbody>
      </table>
    </div>
  )
}

export default function BookletPage({
  page, format, rows, user, portfolio, interactive = false, highlightedId = null, selectedSourceId = null,
  onOpenProof, onSelectRow, areaARows, renderAreaADs, criterionLabelByKey = {}, eagerEvidence = false, onEvidenceSettled
}) {
  if (page.type === 'proof') {
    const item = page.item
    const anchorProps = interactive ? { id: proofAnchor(item.accomplishmentId), 'data-section-id': proofAnchor(item.accomplishmentId) } : {}
    return (
      <article {...anchorProps} className="booklet-page flex min-h-[1040px] w-[794px] scroll-mt-4 flex-col bg-white px-14 py-12 text-slate-950 shadow-xl print:shadow-none">
        <header className="border-b-2 border-emerald-900 pb-4">
          <p className="font-serif text-xs font-bold tracking-[0.16em] text-emerald-900">SUPPORTING DOCUMENTS / EVIDENCE</p>
          <h2 className="mt-2 font-serif text-xl font-bold">{item.reference} · {item.accomplishment_display}</h2>
          <p className="mt-1 text-xs text-slate-600">Area {String(item.criterionKey).charAt(0) === 'O' ? 'B' : String(item.criterionKey).charAt(0)} · {criterionLabelByKey[item.criterionKey]}</p>
        </header>
        <dl className="mt-6 grid grid-cols-[150px_1fr] gap-y-2 text-sm">
          <dt className="font-bold">Reference</dt><dd>{item.reference}</dd>
          <dt className="font-bold">Accomplishment</dt><dd>{item.accomplishment_display}</dd>
          <dt className="font-bold">Date / Period</dt><dd>{displayDateOrPeriod(item.date_or_period_display)}</dd>
          <dt className="font-bold">Document</dt><dd>{item.evidence.original_filename || 'Attached evidence'}</dd>
        </dl>
        {interactive && onOpenProof && <button type="button" onClick={(event) => onOpenProof(item, event)} className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-900 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 print:hidden"><FileText className="h-3.5 w-3.5" />Open original file</button>}
        <EvidenceImages evidence={item.evidence} eager={eagerEvidence} onSettled={onEvidenceSettled} />
        <div className="mt-auto border-t border-slate-300 pt-4 text-[10px] text-slate-500">Evidence ID: {item.evidence.id}</div>
      </article>
    )
  }

  const contentAreas = page.contentAreas || [{ ...page.area, criteria: format.criteria.filter((criterion) => criterion.area === page.area.key) }]
  const pageTitle = contentAreas.map((area) => area.title).join(' · ')
  return (
    <article className="booklet-page min-h-[1040px] w-[794px] bg-white px-14 py-12 text-slate-950 shadow-xl print:shadow-none">
      <PageHeader format={format} user={user} portfolio={portfolio} />
      {contentAreas.map(({ key, title, criteria, anchor = true }) => {
        let previousGroup = null
        const hasRecordCriteria = criteria.some((criterion) => criterion.kind === 'records')
        return <section key={key}>
        <h3 {...(interactive && anchor ? { id: areaAnchor(key), 'data-section-id': areaAnchor(key) } : {})} className="mt-7 scroll-mt-4 bg-[#0f2537] px-4 py-3 font-serif text-sm font-bold tracking-wide text-white">{title}</h3>
        <div className="mt-4 space-y-6">
        {rows.length === 0 && hasRecordCriteria && (
          <div className="rounded-lg border border-dashed border-slate-400 px-5 py-8 text-center"><p className="font-serif text-sm font-bold">This Portfolio Booklet is currently empty.</p><p className="mt-1 text-xs text-slate-600">Accomplishments appear here once they are added.</p></div>
        )}
        {criteria.map((criterion) => {
          const sectionProps = interactive ? { id: criterionAnchor(criterion.key), 'data-section-id': criterionAnchor(criterion.key) } : {}
          const groupHeading = criterion.group && criterion.group !== previousGroup ? criterion.group : null
          previousGroup = criterion.group || null
          if (criterion.kind === 'hr_rating') {
            return <section key={criterion.key} {...sectionProps} className="scroll-mt-4"><h4 className="border-b border-slate-400 pb-2 font-serif text-sm font-bold">{criterion.label}</h4><AreaARatingTable areaARows={areaARows} renderAreaADs={renderAreaADs} /></section>
          }
          if (criterion.kind === 'service') {
            return <section key={criterion.key} {...sectionProps} className="scroll-mt-4"><h4 className="border-b border-slate-400 pb-2 font-serif text-sm font-bold">{criterion.label}</h4><ServiceRow portfolio={portfolio} /></section>
          }
          const criterionRows = rows.filter((row) => row.criterionKey === criterion.key)
          if (criterion.hideWhenEmpty && criterionRows.length === 0) return null
          const columns = criterion.columns || []
          const compact = columns.length === 2
          const proofButton = (row) => interactive && row.evidence && onOpenProof
            ? <button type="button" onClick={(event) => { event.stopPropagation(); onOpenProof(row, event) }} className="mt-1 inline-flex items-center gap-1 rounded border border-emerald-800/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-900 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 print:hidden" aria-label={`View proof for ${row.reference}`}><Paperclip className="h-2.5 w-2.5" />View Proof</button>
            : null
          const rowProps = (row) => {
            const rowId = rowAnchor(row.accomplishmentId)
            const selected = selectedSourceId && (row.source?.id === selectedSourceId || row.accomplishmentId === selectedSourceId)
            const tone = interactive && highlightedId === rowId ? 'bg-amber-100' : selected ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-600' : ''
            return {
              ...(interactive ? { id: rowId } : {}),
              ...(interactive && onSelectRow ? { onClick: () => onSelectRow(row), tabIndex: 0, onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectRow(row) } }, role: 'button', 'aria-pressed': Boolean(selected), 'aria-label': `Select ${row.reference}` } : {}),
              className: `scroll-mt-16 border-t border-slate-300 transition-colors ${interactive && onSelectRow ? 'cursor-pointer hover:bg-slate-50' : ''} ${tone}`
            }
          }
          return (
            <section key={criterion.key} {...sectionProps} className="scroll-mt-4">
              {groupHeading && <p className="mb-2 font-serif text-xs font-bold uppercase tracking-wide text-emerald-900">{groupHeading}</p>}
              <h4 className="border-b border-slate-400 pb-2 font-serif text-sm font-bold">{criterion.label}</h4>
              <div className="mt-2 overflow-hidden border border-slate-400">
                <table className="w-full table-fixed border-collapse text-left text-[10px]">
                  <thead className={format.id === 'faculty_academic' ? 'bg-[#e6f2ff]' : 'bg-slate-100'}><tr>{columns.map((column) => <th key={column} className={`border-r border-slate-400 p-2 last:border-r-0 ${format.id === 'faculty_academic' ? 'italic' : ''}`}>{column}</th>)}</tr></thead>
                  <tbody>
                    {criterionRows.length ? criterionRows.map((row) => (
                      <tr key={row.accomplishmentId} {...rowProps(row)}>
                        {compact ? <>
                          <td className="w-[35%] border-r border-slate-300 p-2 align-top">{displayDateOrPeriod(row.date_or_period_display)}</td>
                          <td className="p-2 align-top"><span className="mr-1 text-[9px] font-bold text-emerald-900">{row.reference}</span>{row.remarks_classification_display || row.accomplishment_display || '—'}{proofButton(row) && <div>{proofButton(row)}</div>}</td>
                        </> : <>
                          <td className="w-[18%] border-r border-slate-300 p-2 align-top">{displayDateOrPeriod(row.date_or_period_display)}</td>
                          <td className="w-[34%] border-r border-slate-300 p-2 align-top font-semibold"><span className="mr-1 text-[9px] font-bold text-emerald-900">{row.reference}</span>{row.accomplishment_display || '—'}{proofButton(row) && <div>{proofButton(row)}</div>}</td>
                          <td className="w-[25%] border-r border-slate-300 p-2 align-top">{row.organization_display || '—'}</td>
                          <td className="w-[23%] p-2 align-top">{row.remarks_classification_display || '—'}</td>
                        </>}
                      </tr>
                    )) : <tr className="border-t border-slate-300"><td colSpan={columns.length} className="p-3 text-center italic text-slate-500">No accomplishments recorded.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>
      </section>
      })}
      {page.signatureBlock && <div className="mt-10 text-right font-serif text-sm">________________________________<br />Signature over Printed Name</div>}
      <footer className="mt-8 flex justify-between border-t border-slate-300 pt-3 text-[10px] text-slate-500"><span>Source: {Array.isArray(portfolio.items) ? 'submitted portfolio snapshot' : 'editable portfolio'} records</span><span>{pageTitle}</span></footer>
    </article>
  )
}
