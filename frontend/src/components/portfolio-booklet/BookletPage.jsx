import React from 'react'
import { FileText, Paperclip } from 'lucide-react'
import EvidenceImages from './EvidenceImages'

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
    const contentPages = [{
      type: 'content',
      key: 'faculty-document',
      showHeader: true,
      contentAreas: format.areas.map((area) => ({
        ...area,
        anchor: true,
        criteria: format.criteria.filter((criterion) => criterion.area === area.key)
      })),
      signatureBlock: true
    }]
    const proofs = rows.filter((row) => row.evidence).sort((a, b) => dateForSort(b) - dateForSort(a))
    return [...contentPages, ...proofs.map((item) => ({ type: 'proof', key: `proof-${item.accomplishmentId}`, item }))]
  }

  const contentPage = {
    type: 'content',
    key: 'non-teaching-document',
    showHeader: true,
    contentAreas: format.areas.map((area) => ({
      ...area,
      anchor: true,
      criteria: format.criteria.filter((criterion) => criterion.area === area.key)
    }))
  }
  return [contentPage, ...rows.filter((row) => row.evidence).map((row) => ({ type: 'proof', key: `proof-${row.accomplishmentId}`, item: row }))]
}

function PageHeader({ format, user, portfolio }) {
  if (format.id === 'faculty_academic') {
    return (
      <header className='faculty-document-header border-b border-black pb-3 font-["Century_Schoolbook",serif] text-[11px] text-black'>
        <p className="text-center text-[21px] font-bold">FACULTY DEVELOPMENT PROGRAM</p>
        <h2 className="text-center text-[16px]">Portfolio</h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-8 gap-y-0.5 text-[16px]">
          {format.headerFields(user, portfolio).map(([label, value]) => <div key={label}><dt className="inline font-bold">{`${label}: `}</dt><dd className="inline">{value}</dd></div>)}
        </dl>
      </header>
    )
  }
  return (
    <header className='faculty-document-header border-b border-black pb-3 font-["Century_Schoolbook",serif] text-[11px] text-black'>
      <p className="text-center text-[21px] font-bold">{format.documentTitle}</p>
      <h2 className="text-center text-[16px]">Portfolio</h2>
      <dl className="mt-2 grid grid-cols-2 gap-x-8 gap-y-0.5 text-[16px]">
        {format.headerFields(user, portfolio).map(([label, value]) => <div key={label}><dt className="inline font-bold">{`${label}: `}</dt><dd className="inline">{value}</dd></div>)}
      </dl>
    </header>
  )
}

function FacultyAreaHeading({ area, interactive }) {
  return (
    <table className="faculty-grid w-full table-fixed border-collapse" aria-label={area.title}>
      <tbody><tr>
        <th {...(interactive && area.anchor ? { id: areaAnchor(area.key), 'data-section-id': areaAnchor(area.key) } : {})} colSpan={4} className="faculty-area-row border border-black px-2 py-1.5 text-left text-[18px] font-bold text-black">{area.title}</th>
      </tr></tbody>
    </table>
  )
}

const FACULTY_COLUMN_WIDTHS = ['18.9%', '29.4%', '29.7%', '22%']

function FacultyCriterionTable({ criterion, rows, interactive, highlightedId, selectedSourceId, onOpenProof, onSelectRow }) {
  const criterionRows = rows.filter((row) => row.criterionKey === criterion.key)
  if (criterion.hideWhenEmpty && criterionRows.length === 0) return null
  const columns = criterion.columns || []
  const span = 1
  const headingClass = criterion.headingType === 'subcriterion'
    ? 'faculty-subcriterion-row border border-black px-2 py-1 text-left font-bold text-black'
    : 'faculty-criterion-row border border-black bg-[#0F243E] px-2 py-1 text-left font-bold text-white'
  const groupClass = 'faculty-criterion-row border border-black bg-[#0F243E] px-2 py-1 text-left font-bold text-white'
  return (
    <table className="faculty-grid faculty-criterion-table w-full table-fixed border-collapse" aria-label={criterion.label}>
      {columns.length === 4 ? <colgroup>{FACULTY_COLUMN_WIDTHS.map((width, index) => <col key={index} style={{ width }} />)}</colgroup> : <colgroup><col style={{ width: '50%' }} /><col style={{ width: '50%' }} /></colgroup>}
      <thead>
        {criterion.group && <tr><th colSpan={columns.length} className={groupClass}>{criterion.group}</th></tr>}
        <tr>
          <th {...(interactive ? { id: criterionAnchor(criterion.key), 'data-section-id': criterionAnchor(criterion.key) } : {})} colSpan={columns.length} className={headingClass}>{criterion.label}</th>
        </tr>
        <tr className="faculty-column-header">
          {columns.map((column) => <th key={column} colSpan={span} className="border border-black bg-[#DAEEF3] px-2 py-1.5 text-left font-bold italic text-black">{column}</th>)}
        </tr>
      </thead>
      <tbody>
        {criterionRows.length ? criterionRows.map((row) => {
          const rowId = rowAnchor(row.accomplishmentId)
          const selected = selectedSourceId && (row.source?.id === selectedSourceId || row.accomplishmentId === selectedSourceId)
          const tone = interactive && highlightedId === rowId ? 'bg-amber-100' : selected ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-700' : 'bg-white'
          const cells = Array.from({ length: columns.length }, (_, index) => {
            const value = row.portfolio_cells?.[index]
            if (value !== null && value !== undefined && String(value).trim() !== '') return value
            if (index === 0) return row.date_or_period_display || ''
            if (columns.length === 4 && index === 1) return row.accomplishment_display || row.title || ''
            if (columns.length === 4 && index === 2) return row.organization_display || row.institution || ''
            return ''
          })
          return (
            <tr key={row.accomplishmentId} {...(interactive ? { id: rowId } : {})}
              {...(interactive && onSelectRow ? { onClick: () => onSelectRow(row), tabIndex: 0, onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectRow(row) } }, role: 'button', 'aria-pressed': Boolean(selected), 'aria-label': `Select ${row.reference}` } : {})}
              className={`faculty-record-row break-inside-avoid ${interactive && onSelectRow ? 'cursor-pointer hover:bg-slate-50' : ''} ${tone}`}>
              {cells.map((value, index) => (
                <td key={`${row.accomplishmentId}-${index}`} colSpan={span} className={`border border-black px-2 py-1.5 align-top text-black ${index === 1 ? 'font-semibold' : ''}`}>
                  {value || ''}
                  {index === 1 && interactive && row.evidence && onOpenProof && <div><button type="button" onClick={(event) => { event.stopPropagation(); onOpenProof(row, event) }} className="mt-1 inline-flex items-center gap-1 border border-emerald-800 px-1.5 py-0.5 text-[9px] font-bold text-emerald-900 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 print:hidden" aria-label={`View proof for ${row.reference}`}><Paperclip className="h-2.5 w-2.5" />View Proof</button></div>}
                </td>
              ))}
            </tr>
          )
        }) : <tr className="faculty-record-row break-inside-avoid bg-white"><td colSpan={columns.length} className="border border-black px-2 py-1.5" aria-label={`Blank row for ${criterion.label}`}>&nbsp;</td></tr>}
      </tbody>
    </table>
  )
}

function FacultyContentPage({ page, format, rows, user, portfolio, interactive = false, highlightedId, selectedSourceId, onOpenProof, onSelectRow }) {
  return (
    <article data-faculty-document="true" className='booklet-page faculty-document relative mx-auto min-h-[1248px] w-[816px] bg-white px-12 py-14 font-["Century_Schoolbook",serif] text-[16px] leading-snug text-black shadow-xl print:shadow-none'>
      <div data-faculty-flow="true">
      {page.showHeader && <PageHeader format={format} user={user} portfolio={portfolio} />}
      {page.contentAreas.map((area) => (
        <section key={area.key} className="faculty-area-section">
          <FacultyAreaHeading area={area} interactive={interactive} />
          {area.criteria.map((criterion) => <FacultyCriterionTable key={criterion.key} criterion={criterion} rows={rows} interactive={interactive} highlightedId={highlightedId} selectedSourceId={selectedSourceId} onOpenProof={onOpenProof} onSelectRow={onSelectRow} />)}
        </section>
      ))}
      {page.signatureBlock && (() => {
        const ownerName = user.full_name || portfolio.personnel_name || portfolio.faculty_name || ''
        const signature = user.signature_image_data_url || portfolio.signature_image_data_url
        return <div className="faculty-signature mt-4 ml-auto w-1/2 text-center" aria-label="Portfolio owner's signature and printed name">
          <div className="mx-auto flex h-12 w-[82%] items-end justify-center border-b border-black">
            {signature && <img src={signature} alt={ownerName ? `Signature of ${ownerName}` : 'Portfolio owner signature'} className="max-h-11 max-w-full object-contain object-bottom" />}
          </div>
          {ownerName && <p className="mt-0.5 text-[12px]">{ownerName}</p>}
          <p className="text-[10px]">Signature over Printed Name</p>
        </div>
      })()}
      </div>
      <div className="faculty-screen-footer mt-4 border-t border-black pt-1 text-right text-[10px] print:hidden">Portfolio of {user.full_name || portfolio.personnel_name || portfolio.faculty_name || ''}</div>
      <div className="faculty-print-footer hidden print:flex"><span>Page <span className="faculty-page-number" /> | Portfolio of {user.full_name || portfolio.personnel_name || portfolio.faculty_name || ''}</span></div>
    </article>
  )
}

function AreaARatingTable({ areaARows = [], renderAreaADs, onSelectAreaARow, selectedAreaACode }) {
  const anyRated = areaARows.some((row) => row.points !== null)
  return (
    <>
      <p className="mt-1.5 text-[12px] italic text-slate-600">Rated by HR from the annual performance reviews · Points earned = DS × %.</p>
      <div className="mt-1.5 overflow-hidden border border-black">
        <table className="ntp-grid w-full table-fixed border-collapse text-left text-[16px] leading-snug">
          <thead><tr><th className="w-[43%]">Criteria</th><th className="text-center">Weight</th><th className="text-center">%</th><th className="text-center">DS</th><th className="text-right">Points Earned</th></tr></thead>
          <tbody>
            {areaARows.map((row) => (
              <tr key={row.code} onClick={onSelectAreaARow ? (event) => { if (!event.target.closest('input, button, select, textarea')) onSelectAreaARow(row) } : undefined} className={`ntp-record-row ${onSelectAreaARow ? 'cursor-pointer hover:bg-slate-50' : ''} ${selectedAreaACode === row.code ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-600' : ''}`}>
                <td>{onSelectAreaARow ? <button type="button" onClick={() => onSelectAreaARow(row)} aria-pressed={selectedAreaACode === row.code} className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-700"><span className="mr-1 font-bold">{row.code}</span>{row.title}</button> : <><span className="mr-1 font-bold">{row.code}</span>{row.title}</>}</td>
                <td className="text-center tabular-nums">{row.max} pts</td>
                <td className="text-center tabular-nums">{(row.max / 100).toFixed(2).replace(/^0/, '')}</td>
                <td className="text-center tabular-nums">{renderAreaADs ? renderAreaADs(row) : (row.ds === null ? '—' : number(row.ds, 0))}</td>
                <td className="text-right font-semibold tabular-nums">{row.points === null ? (anyRated ? '—' : 'Rated by HR') : number(row.points)}</td>
              </tr>
            ))}
            <tr className="ntp-record-row font-bold"><td colSpan={4}>Category Total (maximum 90)</td><td className="text-right tabular-nums">{anyRated ? number(areaARows.reduce((sum, row) => sum + (row.points || 0), 0)) : '—'}</td></tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function ServiceRow({ portfolio }) {
  const years = portfolio.tenure_years ?? portfolio.years_of_service ?? portfolio.service_completed_years
  const numericYears = Number(years)
  const completedYears = Math.floor(Math.max(0, numericYears))
  const yearsLabel = years === null || years === undefined || years === '' || !Number.isFinite(numericYears)
    ? 'Not recorded by HR'
    : `${completedYears} ${completedYears === 1 ? 'year' : 'years'}`
  return (
    <div className="mt-1.5 overflow-hidden border border-black">
      <table className="ntp-grid w-full table-fixed border-collapse text-left text-[16px] leading-snug">
        <thead><tr><th className="w-[60%]">Inclusive Date</th><th>Remarks</th></tr></thead>
        <tbody><tr className="ntp-record-row"><td>{yearsLabel}</td><td aria-label="Blank remarks" /></tr></tbody>
      </table>
    </div>
  )
}

export default function BookletPage({
  page, format, rows, user, portfolio, interactive = false, highlightedId = null, selectedSourceId = null,
  onOpenProof, onSelectRow, onSelectAreaARow, selectedAreaACode, areaARows, renderAreaADs, criterionLabelByKey = {}, eagerEvidence = false, onEvidenceSettled
}) {
  if (page.type === 'proof') {
    const item = page.item
    const anchorProps = interactive ? { id: proofAnchor(item.accomplishmentId), 'data-section-id': proofAnchor(item.accomplishmentId) } : {}
    return (
      <article {...anchorProps} className="booklet-page flex min-h-[1040px] w-[794px] scroll-mt-4 flex-col bg-white px-14 py-12 text-slate-950 shadow-xl print:shadow-none">
        <header className="border-b-2 border-emerald-900 pb-4">
          <p className="font-serif text-xs font-bold tracking-[0.16em] text-emerald-900">SUPPORTING DOCUMENTS / EVIDENCE</p>
          <h2 className="mt-2 font-serif text-xl font-bold">{format.id === 'non_teaching' ? item.accomplishment_display : `${item.reference} · ${item.accomplishment_display}`}</h2>
          <p className="mt-1 text-xs text-slate-600">Area {String(item.criterionKey).charAt(0) === 'O' ? 'B' : String(item.criterionKey).charAt(0)} · {criterionLabelByKey[item.criterionKey]}</p>
        </header>
        <p className="mt-5 text-sm text-slate-700"><span className="font-bold">Date / Period:</span> {displayDateOrPeriod(item.date_or_period_display)}</p>
        {interactive && onOpenProof && <button type="button" onClick={(event) => onOpenProof(item, event)} className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-900 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 print:hidden"><FileText className="h-3.5 w-3.5" />Open original file</button>}
        <EvidenceImages evidence={item.evidence} eager={eagerEvidence} onSettled={onEvidenceSettled} />
      </article>
    )
  }

  if (format.id === 'faculty_academic') {
    return <FacultyContentPage page={page} format={format} rows={rows} user={user} portfolio={portfolio} interactive={interactive} highlightedId={highlightedId} selectedSourceId={selectedSourceId} onOpenProof={onOpenProof} onSelectRow={onSelectRow} />
  }

  const contentAreas = page.contentAreas || [{ ...page.area, criteria: format.criteria.filter((criterion) => criterion.area === page.area.key) }]
  const pageTitle = contentAreas.map((area) => area.title).join(' · ')
  return (
    <article className='booklet-page ntp-document relative mx-auto min-h-[1248px] w-[816px] bg-white px-12 py-14 font-["Century_Schoolbook",serif] text-[16px] leading-snug text-black shadow-xl print:shadow-none'>
      {page.showHeader && <PageHeader format={format} user={user} portfolio={portfolio} />}
      {contentAreas.map(({ key, title, criteria, anchor = true }) => {
        let previousGroup = null
        return <section key={key} className="faculty-area-section">
        <FacultyAreaHeading area={{ key, title, anchor }} interactive={interactive} />
        <div>
        {criteria.map((criterion) => {
          const sectionProps = interactive ? { id: criterionAnchor(criterion.key), 'data-section-id': criterionAnchor(criterion.key) } : {}
          const groupHeading = criterion.group && criterion.group !== previousGroup ? criterion.group : null
          previousGroup = criterion.group || null
          if (criterion.kind === 'hr_rating') {
            return <section key={criterion.key} {...sectionProps} className="scroll-mt-4"><h4 className="ntp-criterion-heading border border-black bg-[#0F243E] px-2 py-1 text-[12px] font-bold text-white">{criterion.label}</h4><AreaARatingTable areaARows={areaARows} renderAreaADs={renderAreaADs} onSelectAreaARow={interactive ? onSelectAreaARow : undefined} selectedAreaACode={selectedAreaACode} /></section>
          }
          if (criterion.kind === 'service') {
            return <section key={criterion.key} {...sectionProps} className="scroll-mt-4"><h4 className="ntp-criterion-heading border border-black bg-[#0F243E] px-2 py-1 text-[12px] font-bold text-white">{criterion.label}</h4><ServiceRow portfolio={portfolio} /></section>
          }
          const criterionRows = rows.filter((row) => row.criterionKey === criterion.key)
          if (criterion.hideWhenEmpty && criterionRows.length === 0) return null
          const columns = criterion.columns || []
          const compact = columns.length === 2
          const isGroupedSubcriterion = Boolean(criterion.group)
          const proofButton = (row) => interactive && row.evidence && onOpenProof
            ? <button type="button" onClick={(event) => { event.stopPropagation(); onOpenProof(row, event) }} className="mt-1 inline-flex items-center gap-1 rounded border border-emerald-800/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-900 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 print:hidden" aria-label={`View proof for ${row.accomplishment_display || row.title || 'accomplishment'}`}><Paperclip className="h-2.5 w-2.5" />View Proof</button>
            : null
          const rowProps = (row) => {
            const rowId = rowAnchor(row.accomplishmentId)
            const selected = selectedSourceId && (row.source?.id === selectedSourceId || row.accomplishmentId === selectedSourceId)
            const tone = interactive && highlightedId === rowId ? 'bg-amber-100' : selected ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-600' : ''
            return {
              ...(interactive ? { id: rowId } : {}),
              ...(interactive && onSelectRow ? { onClick: () => onSelectRow(row), tabIndex: 0, onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectRow(row) } }, role: 'button', 'aria-pressed': Boolean(selected), 'aria-label': `Select ${row.accomplishment_display || row.title || 'accomplishment'}` } : {}),
              className: `scroll-mt-16 border-t border-slate-300 transition-colors ${interactive && onSelectRow ? 'cursor-pointer hover:bg-slate-50' : ''} ${tone}`
            }
          }
          return (
            <section key={criterion.key} {...sectionProps} className="scroll-mt-4">
              {groupHeading && <h4 className="faculty-criterion-row ntp-group-heading border border-black bg-[#0F243E] px-2 py-1 text-left text-[16px] font-bold uppercase text-white">{groupHeading}</h4>}
              <h4 className={`ntp-criterion-heading border-x border-b border-black px-2 py-1 text-left text-[16px] font-bold ${isGroupedSubcriterion ? 'bg-white text-black' : 'bg-[#0F243E] text-white'}`}>{criterion.label}</h4>
              <div className="overflow-hidden border-x border-b border-black">
                <table className="ntp-grid w-full table-fixed border-collapse text-left text-[16px] leading-snug">
                  <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>
                    {criterionRows.length ? criterionRows.map((row) => (
                      <tr key={row.accomplishmentId} {...rowProps(row)} className={`${rowProps(row).className} ntp-record-row`}>
                        {row.portfolio_cells ? row.portfolio_cells.map((value, index) => <td key={`${row.accomplishmentId}-${index}`} className={`${index < row.portfolio_cells.length - 1 ? 'border-r border-slate-300' : ''} align-top ${index === 1 ? 'font-semibold' : ''}`}>{value || '—'}{index === 1 && proofButton(row) && <div>{proofButton(row)}</div>}</td>) : compact ? <>
                          <td className="w-[35%] align-top break-words">{displayDateOrPeriod(row.date_or_period_display)}</td>
                          <td className="align-top break-words">{row.remarks_classification_display || row.accomplishment_display || '—'}{proofButton(row) && <div>{proofButton(row)}</div>}</td>
                        </> : <>
                          <td className="w-[18%] align-top break-words">{displayDateOrPeriod(row.date_or_period_display)}</td>
                          <td className="w-[34%] align-top break-words font-semibold">{row.accomplishment_display || '—'}{proofButton(row) && <div>{proofButton(row)}</div>}</td>
                          <td className="w-[25%] align-top break-words">{row.organization_display || '—'}</td>
                          <td className="w-[23%] align-top break-words">{row.remarks_classification_display || '—'}</td>
                        </>}
                      </tr>
                    )) : <tr className="ntp-empty-row"><td colSpan={columns.length} className="text-center italic text-slate-600">No accomplishments recorded.</td></tr>}
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
      <footer className="mt-4 flex justify-between border-t border-black pt-1 text-[10px] text-slate-600"><span>Source: {Array.isArray(portfolio.items) ? 'submitted portfolio snapshot' : 'editable portfolio'} records</span><span>{pageTitle}</span></footer>
    </article>
  )
}
