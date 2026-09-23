import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Maximize2, Minimize2, Printer, Search, X } from 'lucide-react'
import { formatPersonnelPlacement } from '../../utils/personnelPlacement'
import { FACULTY_ACADEMIC_CRITERIA, isFacultyAcademicFormat, normalizeFacultyBookletItems } from '../../utils/facultyAcademicBooklet'
import PersonnelEvidencePreviewModal from './modals/PersonnelEvidencePreviewModal'

const AREAS = [
  { key: 'A', title: 'A. PROFESSIONAL DEVELOPMENT' },
  { key: 'B', title: 'B. PRODUCTIVITY AND CREATIVE WORK' },
  { key: 'C', title: 'C. SERVICE AND LEADERSHIP' }
]

const displayDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

const displayDateOrPeriod = (value) => String(value || '').split(' – ').map(displayDate).join(' – ').replace('Invalid Date', 'Ongoing')

export default function PersonnelPortfolioBookletModal({ isOpen, onClose, portfolio = {}, user = {} }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [query, setQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [previewEvidence, setPreviewEvidence] = useState(null)
  const items = useMemo(() => normalizeFacultyBookletItems(portfolio), [portfolio])
  const proofItems = items.filter((item) => item.evidence)
  const pages = [...AREAS.map((area) => ({ type: 'area', area })), ...proofItems.map((item) => ({ type: 'proof', item }))]
  const filteredPages = pages.filter((page) => !query || `${page.area?.title || ''} ${page.item?.reference || ''} ${page.item?.accomplishment_display || ''} ${page.item?.evidence?.original_filename || ''}`.toLowerCase().includes(query.toLowerCase()))
  const activePage = pages[currentPage - 1] || pages[0]

  if (!isOpen) return null
  if (!isFacultyAcademicFormat(user, portfolio)) {
    return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4"><section className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-2xl"><h2 className="text-lg font-extrabold text-slate-900">Faculty Academic format unavailable</h2><p className="mt-2 text-sm text-slate-600">This booklet format is restricted to Faculty Academic Personnel. The saved classification was not changed or guessed.</p><button type="button" onClick={onClose} className="mt-5 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white">Close</button></section></div>
  }

  const renderArea = ({ key, title }) => {
    const criteria = FACULTY_ACADEMIC_CRITERIA.filter((criterion) => criterion.area === key)
    return (
      <article className="booklet-page min-h-[1040px] w-[794px] bg-white px-14 py-12 text-slate-950 shadow-xl print:shadow-none">
        <header className="border-b-2 border-emerald-900 pb-5">
          <p className="text-center font-serif text-xs font-bold tracking-[0.18em] text-emerald-900">NOTRE DAME OF MARBEL UNIVERSITY</p>
          <h2 className="mt-3 text-center font-serif text-xl font-bold">FACULTY ACADEMIC PERSONNEL PORTFOLIO</h2>
          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
            <div><dt className="inline font-bold">Personnel: </dt><dd className="inline">{user.full_name || portfolio.personnel_name || '—'}</dd></div>
            <div><dt className="inline font-bold">Employee ID: </dt><dd className="inline">{user.employee_id || portfolio.personnel_id || '—'}</dd></div>
            <div><dt className="inline font-bold">Placement: </dt><dd className="inline">{formatPersonnelPlacement({ ...portfolio, ...user }) || '—'}</dd></div>
            <div><dt className="inline font-bold">Academic Year: </dt><dd className="inline">{portfolio.academic_year || '—'}</dd></div>
          </dl>
        </header>
        <h3 className="mt-7 bg-emerald-900 px-4 py-3 font-serif text-sm font-bold tracking-wide text-white">{title}</h3>
        <div className="mt-4 space-y-6">
          {items.length === 0 && key === 'A' && <div className="rounded-lg border border-dashed border-slate-400 px-5 py-8 text-center"><p className="font-serif text-sm font-bold">Your Portfolio Booklet is currently empty.</p><p className="mt-1 text-xs text-slate-600">Add accomplishments to begin building your portfolio.</p></div>}
          {criteria.map((criterion) => {
            const rows = items.filter((item) => item.criterionKey === criterion.key)
            const columns = criterion.columns || []
            const compact = columns.length === 2
            return <section key={criterion.key} id={`criterion-${criterion.key}`}><h4 className="border-b border-slate-400 pb-2 font-serif text-sm font-bold">{criterion.label}</h4><div className="mt-2 overflow-hidden border border-slate-400"><table className="w-full table-fixed border-collapse text-left text-[10px]"><thead className="bg-slate-100"><tr>{columns.map((column) => <th key={column} className="border-r border-slate-400 p-2 last:border-r-0">{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.accomplishmentId} className="border-t border-slate-300">{compact ? <><td className="w-[35%] border-r border-slate-300 p-2 align-top">{displayDateOrPeriod(row.date_or_period_display)}</td><td className="p-2 align-top"><span className="mr-1 text-[9px] font-bold text-emerald-900">{row.reference}</span>{row.remarks_classification_display || row.accomplishment_display || '—'}</td></> : <><td className="w-[18%] border-r border-slate-300 p-2 align-top">{displayDateOrPeriod(row.date_or_period_display)}</td><td className="w-[34%] border-r border-slate-300 p-2 align-top font-semibold"><span className="mr-1 text-[9px] font-bold text-emerald-900">{row.reference}</span>{row.accomplishment_display || '—'}</td><td className="w-[25%] border-r border-slate-300 p-2 align-top">{row.organization_display || '—'}</td><td className="w-[23%] p-2 align-top">{row.remarks_classification_display || '—'}</td></>}</tr>) : <tr className="border-t border-slate-300"><td colSpan={columns.length} className="p-3 text-center italic text-slate-500">No accomplishments recorded.</td></tr>}</tbody></table></div></section>
          })}
        </div>
        <footer className="mt-8 flex justify-between border-t border-slate-300 pt-3 text-[10px] text-slate-500"><span>Source: canonical {Array.isArray(portfolio.items) ? 'submitted snapshot' : 'editable portfolio'} records</span><span>{title}</span></footer>
      </article>
    )
  }

  const renderProof = (item) => <article className="booklet-page flex min-h-[1040px] w-[794px] flex-col bg-white px-14 py-12 text-slate-950 shadow-xl print:shadow-none"><header className="border-b-2 border-emerald-900 pb-4"><p className="font-serif text-xs font-bold tracking-[0.16em] text-emerald-900">SUPPORTING DOCUMENTS / EVIDENCE</p><h2 className="mt-2 font-serif text-xl font-bold">{item.reference} · {item.accomplishment_display}</h2><p className="mt-1 text-xs text-slate-600">Area {item.criterionKey.charAt(0)} · {FACULTY_ACADEMIC_CRITERIA.find((criterion) => criterion.key === item.criterionKey)?.label}</p></header><dl className="mt-8 grid grid-cols-[170px_1fr] gap-y-3 text-sm"><dt className="font-bold">Reference</dt><dd>{item.reference}</dd><dt className="font-bold">Accomplishment</dt><dd>{item.accomplishment_display}</dd><dt className="font-bold">Document</dt><dd>{item.evidence.original_filename || 'Persisted evidence'}</dd><dt className="font-bold">Evidence status</dt><dd>{item.status}</dd></dl><button type="button" onClick={() => setPreviewEvidence(item.evidence)} className="mt-8 inline-flex w-fit items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 print:hidden"><FileText className="h-4 w-4" />Preview exact evidence</button><div className="mt-auto border-t border-slate-300 pt-4 text-xs text-slate-500">Linked accomplishment: {item.accomplishmentId} · Evidence ID: {item.evidence.id}</div></article>

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/85 p-2 sm:p-4 ${isFullscreen ? '' : ''}`} role="dialog" aria-modal="true" aria-label="Faculty Academic portfolio booklet">
      <div className={`mx-auto flex h-full flex-col overflow-hidden bg-slate-100 shadow-2xl ${isFullscreen ? 'max-w-none rounded-none' : 'max-w-[1440px] rounded-2xl'}`}>
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-300 bg-white px-4 print:hidden"><div><h2 className="text-sm font-extrabold text-slate-900">Faculty Academic Portfolio</h2><p className="text-xs text-slate-500">{items.length} canonical accomplishments · {proofItems.length} attached proofs</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button><span className="text-xs font-bold tabular-nums">{currentPage} / {pages.length}</span><button type="button" onClick={() => setCurrentPage(Math.min(pages.length, currentPage + 1))} disabled={currentPage === pages.length} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button><button type="button" onClick={() => window.print()} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Print or export PDF"><Printer className="h-4 w-4" /></button><button type="button" onClick={() => setIsFullscreen((value) => !value)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Toggle fullscreen">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Close booklet"><X className="h-5 w-5" /></button></div></header>
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[290px_1fr] print:hidden"><aside className="hidden overflow-y-auto border-r border-slate-300 bg-white p-4 lg:block"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" placeholder="Search sections or proofs" /></div><nav className="mt-5 space-y-5"><div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Faculty Academic Portfolio</p>{filteredPages.map((page) => { const index = pages.indexOf(page); const key = page.type === 'area' ? page.area.key : page.item.evidence.id; const label = page.type === 'area' ? page.area.title : `${page.item.reference} ${page.item.accomplishment_display}`; return <button key={key} type="button" onClick={() => setCurrentPage(index + 1)} className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-xs ${currentPage === index + 1 ? 'bg-emerald-900 font-bold text-white' : 'text-slate-700 hover:bg-slate-100'}`}><span className="mr-2 tabular-nums">P.{index + 1}</span>{label}</button>})}</div></nav></aside><main className="overflow-auto bg-slate-200 p-3 sm:p-7"><div className="mx-auto w-fit origin-top scale-[0.62] sm:scale-75 xl:scale-100">{activePage?.type === 'area' ? renderArea(activePage.area) : renderProof(activePage.item)}</div></main></div>
        <div className="hidden print:block">{pages.map((page, index) => <div key={`print-${index}`} className="break-after-page">{page.type === 'area' ? renderArea(page.area) : renderProof(page.item)}</div>)}</div>
      </div>
      <PersonnelEvidencePreviewModal evidence={previewEvidence} onClose={() => setPreviewEvidence(null)} />
      <style>{`@media print { body * { visibility: hidden !important; } .booklet-page, .booklet-page * { visibility: visible !important; } .booklet-page { width: 210mm; min-height: 297mm; box-shadow: none; break-after: page; } @page { size: A4; margin: 0; } }`}</style>
    </div>
  )
}
