import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Maximize2, Minimize2, MoveHorizontal, PanelLeftClose, PanelLeftOpen, Paperclip, Printer, Search, X, ZoomIn, ZoomOut } from 'lucide-react'
import { FACULTY_ACADEMIC_CRITERIA, isFacultyAcademicFormat, normalizeFacultyBookletItems } from '../../utils/facultyAcademicBooklet'
import BookletEvidenceDrawer from './booklet/BookletEvidenceDrawer'

const AREAS = [
  { key: 'A', title: 'A. PROFESSIONAL DEVELOPMENT' },
  { key: 'B', title: 'B. PRODUCTIVITY AND CREATIVE WORK' },
  { key: 'C', title: 'C. SERVICE AND LEADERSHIP' }
]

// A4 at 96dpi — the existing booklet page width.
const PAGE_WIDTH = 794
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1
const MAX_FIT_ZOOM = 1.2

const displayDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

const displayDateOrPeriod = (value) => String(value || '').split(' – ').map(displayDate).join(' – ').replace('Invalid Date', 'Ongoing')

// Header values come only from authoritative personnel fields; missing values stay blank.
const ENGAGEMENT_LABELS = { full_time_faculty: 'Full-Time', part_time_faculty: 'Part-Time' }
const formatFacultyStatus = (user = {}, portfolio = {}) => {
  const engagementKey = String(user.faculty_engagement || portfolio.faculty_engagement || '').toLowerCase()
  const statusRaw = user.employment_status_label || portfolio.employment_status_label || user.employment_status || portfolio.employment_status || ''
  const status = String(statusRaw).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return [ENGAGEMENT_LABELS[engagementKey] || '', status].filter(Boolean).join(' - ')
}
const formatSchoolYear = (value) => String(value || '').replace(/^\s*(AY|A\.Y\.|S\.?Y\.?)\s*/i, '')

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100))

// DOM ids used only by the on-screen copy (the print copy carries no ids).
const areaAnchor = (key) => `booklet-area-${key}`
const criterionAnchor = (key) => `booklet-criterion-${key}`
const rowAnchor = (id) => `booklet-row-${id}`
const proofAnchor = (id) => `booklet-proof-${id}`

const isDesktop = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1024px)').matches

export default function PersonnelPortfolioBookletModal({ isOpen, onClose, portfolio = {}, user = {} }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [activeSection, setActiveSection] = useState(areaAnchor('A'))
  const [query, setQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [outlineCollapsed, setOutlineCollapsed] = useState(false)
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false)
  const [activeProof, setActiveProof] = useState(null)
  const [highlightedId, setHighlightedId] = useState(null)
  const [zoomMode, setZoomMode] = useState('fit')
  const [manualZoom, setManualZoom] = useState(1)
  const [fitZoom, setFitZoom] = useState(1)

  const scrollRef = useRef(null)
  const outlineRef = useRef(null)
  const mobileOutlineRef = useRef(null)
  const proofTriggerRef = useRef(null)
  const previousZoomRef = useRef(1)
  const highlightTimerRef = useRef(null)
  const restoreOutlineRef = useRef(false)

  const items = useMemo(() => normalizeFacultyBookletItems(portfolio), [portfolio])
  const proofItems = useMemo(() => items.filter((item) => item.evidence), [items])
  const criterionLabelByKey = useMemo(() => Object.fromEntries(FACULTY_ACADEMIC_CRITERIA.map((criterion) => [criterion.key, criterion.label])), [])

  // Page order is unchanged from the previous paginated viewer and the print output:
  // Area A, Area B, Area C, then one Supporting Evidence page per attached proof.
  const pages = useMemo(() => [
    ...AREAS.map((area) => ({ type: 'area', key: `area-${area.key}`, area })),
    ...proofItems.map((item) => ({ type: 'proof', key: `proof-${item.accomplishmentId}`, item }))
  ], [proofItems])

  const outline = useMemo(() => AREAS.map((area) => ({
    id: areaAnchor(area.key),
    label: area.title,
    children: FACULTY_ACADEMIC_CRITERIA.filter((criterion) => criterion.area === area.key).map((criterion) => ({
      id: criterionAnchor(criterion.key),
      label: criterion.label,
      count: items.filter((item) => item.criterionKey === criterion.key).length
    }))
  })), [items])

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const matches = (...values) => values.filter(Boolean).join(' ').toLowerCase().includes(q)
    return [
      ...AREAS.filter((area) => matches(area.title)).map((area) => ({ id: areaAnchor(area.key), kind: 'Section', label: area.title })),
      ...FACULTY_ACADEMIC_CRITERIA.filter((criterion) => matches(criterion.label)).map((criterion) => ({ id: criterionAnchor(criterion.key), kind: 'Subsection', label: criterion.label })),
      ...items.filter((item) => matches(item.reference, item.accomplishment_display, item.organization_display, item.remarks_classification_display, item.date_or_period_display))
        .map((item) => ({ id: rowAnchor(item.accomplishmentId), kind: 'Accomplishment', label: `${item.reference} · ${item.accomplishment_display || '—'}` })),
      ...proofItems.filter((item) => matches(item.reference, item.accomplishment_display, item.evidence.original_filename, item.evidence.id))
        .map((item) => ({ id: proofAnchor(item.accomplishmentId), kind: 'Evidence', label: `${item.reference} · ${item.evidence.original_filename || 'Persisted evidence'}` }))
    ]
  }, [query, items, proofItems])

  const zoom = zoomMode === 'fit' ? fitZoom : manualZoom

  // Fit Width: scale the A4 page to the available canvas width (capped for readability).
  useEffect(() => {
    if (!isOpen) return undefined
    const element = scrollRef.current
    if (!element) return undefined
    const measure = () => {
      const width = element.clientWidth
      if (!width) return
      const gutter = width >= 640 ? 48 : 16
      setFitZoom(Math.min(MAX_FIT_ZOOM, Math.max(0.3, (width - gutter) / PAGE_WIDTH)))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [isOpen])

  // Keep the reader at the same place in the document when the scale changes
  // (zoom controls, fit-width recalculation, opening/closing the evidence drawer).
  useLayoutEffect(() => {
    const element = scrollRef.current
    const previous = previousZoomRef.current
    previousZoomRef.current = zoom
    if (!element || !previous || previous === zoom) return
    // Scale around the middle of the viewport so the passage being read stays in place.
    const padding = parseFloat(window.getComputedStyle(element).paddingTop) || 0
    const middle = element.clientHeight / 2
    element.scrollTop = (element.scrollTop + middle - padding) * (zoom / previous) + padding - middle
  }, [zoom])

  // Page counter: the page with the most visible height inside the viewer wins.
  useEffect(() => {
    if (!isOpen) return undefined
    const root = scrollRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return undefined
    const visibleHeights = new Map()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibleHeights.set(Number(entry.target.dataset.pageIndex), entry.isIntersecting ? entry.intersectionRect.height : 0))
      let best = null
      let bestHeight = 0
      visibleHeights.forEach((height, index) => {
        if (height > bestHeight || (height === bestHeight && best !== null && index < best)) {
          best = index
          bestHeight = height
        }
      })
      if (best !== null && bestHeight > 0) setCurrentPage(best + 1)
    }, { root, threshold: [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] })
    root.querySelectorAll('[data-page-index]').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [isOpen, pages])

  // Active outline item: the last section heading that has reached the top quarter of the viewer.
  useEffect(() => {
    if (!isOpen) return undefined
    const root = scrollRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return undefined
    const targets = Array.from(root.querySelectorAll('[data-section-id]'))
    const pickActive = () => {
      const rootTop = root.getBoundingClientRect().top
      const line = rootTop + root.clientHeight * 0.25
      let current = targets[0]?.dataset.sectionId
      targets.forEach((element) => {
        if (element.getBoundingClientRect().top <= line) current = element.dataset.sectionId
      })
      if (current) setActiveSection(current)
    }
    const observer = new IntersectionObserver(pickActive, { root, rootMargin: '0px 0px -75% 0px', threshold: 0 })
    targets.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [isOpen, pages, zoom])

  // Keep the highlighted outline entry visible inside the sidebar.
  useEffect(() => {
    [outlineRef.current, mobileOutlineRef.current].forEach((nav) => {
      const button = nav?.querySelector(`[data-outline-id="${activeSection}"]`)
      if (button && typeof button.scrollIntoView === 'function') button.scrollIntoView({ block: 'nearest' })
    })
  }, [activeSection, mobileOutlineOpen, outlineCollapsed])

  const closeProof = useCallback(() => {
    setActiveProof(null)
    if (restoreOutlineRef.current) {
      restoreOutlineRef.current = false
      setOutlineCollapsed(false)
    }
    const trigger = proofTriggerRef.current
    proofTriggerRef.current = null
    if (trigger && typeof trigger.focus === 'function') trigger.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (activeProof) { event.stopPropagation(); closeProof() } else if (mobileOutlineOpen) setMobileOutlineOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, activeProof, mobileOutlineOpen, closeProof])

  useEffect(() => () => clearTimeout(highlightTimerRef.current), [])

  const scrollToId = useCallback((id, { highlight = false } = {}) => {
    const target = document.getElementById(id)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (id.startsWith('booklet-area-') || id.startsWith('booklet-criterion-') || id.startsWith('booklet-proof-')) setActiveSection(id)
    if (highlight) {
      setHighlightedId(id)
      clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = setTimeout(() => setHighlightedId(null), 2200)
    }
    if (!isDesktop()) setMobileOutlineOpen(false)
  }, [])

  const scrollToPage = (pageNumber) => {
    const target = scrollRef.current?.querySelector(`[data-page-index="${pageNumber - 1}"]`)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openProof = (item, event) => {
    proofTriggerRef.current = event?.currentTarget || null
    // On narrower desktops, give the paper room by tucking the outline away while evidence is open.
    if (!activeProof && !outlineCollapsed && isDesktop() && window.innerWidth < 1680) {
      restoreOutlineRef.current = true
      setOutlineCollapsed(true)
    }
    setActiveProof(item)
  }

  const toggleOutline = () => {
    restoreOutlineRef.current = false
    if (isDesktop()) setOutlineCollapsed((value) => !value)
    else setMobileOutlineOpen((value) => !value)
  }

  const zoomBy = (delta) => {
    setManualZoom(clampZoom(zoom + delta))
    setZoomMode('manual')
  }

  if (!isOpen) return null
  if (!isFacultyAcademicFormat(user, portfolio)) {
    return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4"><section className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-2xl"><h2 className="text-lg font-extrabold text-slate-900">Faculty Academic format unavailable</h2><p className="mt-2 text-sm text-slate-600">This booklet format is restricted to Faculty Academic Personnel. The saved classification was not changed or guessed.</p><button type="button" onClick={onClose} className="mt-5 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white">Close</button></section></div>
  }

  // ---- Document pages (shared by the on-screen viewer and the print/PDF copy) ----

  const renderArea = ({ key, title }, interactive) => {
    const criteria = FACULTY_ACADEMIC_CRITERIA.filter((criterion) => criterion.area === key)
    return (
      <article className="booklet-page min-h-[1040px] w-[794px] bg-white px-14 py-12 text-slate-950 shadow-xl print:shadow-none">
        <header className="border-b-2 border-emerald-900 pb-5">
          <p className="text-center font-serif text-xs font-bold tracking-[0.18em] text-emerald-900">NOTRE DAME OF MARBEL UNIVERSITY</p>
          <h2 className="mt-3 text-center font-serif text-xl font-bold">FACULTY PORTFOLIO</h2>
          <dl className="mt-6 grid grid-cols-[1fr_auto] gap-x-10 gap-y-0.5 font-serif text-sm">
            <div><dt className="inline">Name: </dt><dd className="inline">{user.full_name || portfolio.personnel_name || ''}</dd></div>
            <div><dt className="inline">Status: </dt><dd className="inline">{formatFacultyStatus(user, portfolio)}</dd></div>
            <div><dt className="inline">School Year: </dt><dd className="inline">{formatSchoolYear(portfolio.academic_year)}</dd></div>
            <div><dt className="inline">Rank: </dt><dd className="inline">{user.current_rank_title || portfolio.current_rank_title || ''}</dd></div>
          </dl>
        </header>
        <h3 {...(interactive ? { id: areaAnchor(key), 'data-section-id': areaAnchor(key) } : {})} className="mt-7 scroll-mt-4 bg-emerald-900 px-4 py-3 font-serif text-sm font-bold tracking-wide text-white">{title}</h3>
        <div className="mt-4 space-y-6">
          {items.length === 0 && key === 'A' && <div className="rounded-lg border border-dashed border-slate-400 px-5 py-8 text-center"><p className="font-serif text-sm font-bold">Your Portfolio Booklet is currently empty.</p><p className="mt-1 text-xs text-slate-600">Add accomplishments to begin building your portfolio.</p></div>}
          {criteria.map((criterion) => {
            const rows = items.filter((item) => item.criterionKey === criterion.key)
            const columns = criterion.columns || []
            const compact = columns.length === 2
            const sectionProps = interactive ? { id: criterionAnchor(criterion.key), 'data-section-id': criterionAnchor(criterion.key) } : {}
            const proofButton = (row) => interactive && row.evidence
              ? <button type="button" onClick={(event) => openProof(row, event)} className="mt-1 inline-flex items-center gap-1 rounded border border-emerald-800/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-900 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 print:hidden" aria-label={`View proof for ${row.reference}`}><Paperclip className="h-2.5 w-2.5" />View Proof</button>
              : null
            return <section key={criterion.key} {...sectionProps} className="scroll-mt-4"><h4 className="border-b border-slate-400 pb-2 font-serif text-sm font-bold">{criterion.label}</h4><div className="mt-2 overflow-hidden border border-slate-400"><table className="w-full table-fixed border-collapse text-left text-[10px]"><thead className="bg-slate-100"><tr>{columns.map((column) => <th key={column} className="border-r border-slate-400 p-2 last:border-r-0">{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => { const rowId = rowAnchor(row.accomplishmentId); return <tr key={row.accomplishmentId} {...(interactive ? { id: rowId } : {})} className={`scroll-mt-16 border-t border-slate-300 transition-colors ${interactive && highlightedId === rowId ? 'bg-amber-100' : ''}`}>{compact ? <><td className="w-[35%] border-r border-slate-300 p-2 align-top">{displayDateOrPeriod(row.date_or_period_display)}</td><td className="p-2 align-top"><span className="mr-1 text-[9px] font-bold text-emerald-900">{row.reference}</span>{row.remarks_classification_display || row.accomplishment_display || '—'}{proofButton(row) && <div>{proofButton(row)}</div>}</td></> : <><td className="w-[18%] border-r border-slate-300 p-2 align-top">{displayDateOrPeriod(row.date_or_period_display)}</td><td className="w-[34%] border-r border-slate-300 p-2 align-top font-semibold"><span className="mr-1 text-[9px] font-bold text-emerald-900">{row.reference}</span>{row.accomplishment_display || '—'}{proofButton(row) && <div>{proofButton(row)}</div>}</td><td className="w-[25%] border-r border-slate-300 p-2 align-top">{row.organization_display || '—'}</td><td className="w-[23%] p-2 align-top">{row.remarks_classification_display || '—'}</td></>}</tr> }) : <tr className="border-t border-slate-300"><td colSpan={columns.length} className="p-3 text-center italic text-slate-500">No accomplishments recorded.</td></tr>}</tbody></table></div></section>
          })}
        </div>
        <footer className="mt-8 flex justify-between border-t border-slate-300 pt-3 text-[10px] text-slate-500"><span>Source: canonical {Array.isArray(portfolio.items) ? 'submitted snapshot' : 'editable portfolio'} records</span><span>{title}</span></footer>
      </article>
    )
  }

  const renderProof = (item, interactive) => {
    const anchorProps = interactive ? { id: proofAnchor(item.accomplishmentId), 'data-section-id': proofAnchor(item.accomplishmentId) } : {}
    return <article {...anchorProps} className="booklet-page flex min-h-[1040px] w-[794px] scroll-mt-4 flex-col bg-white px-14 py-12 text-slate-950 shadow-xl print:shadow-none"><header className="border-b-2 border-emerald-900 pb-4"><p className="font-serif text-xs font-bold tracking-[0.16em] text-emerald-900">SUPPORTING DOCUMENTS / EVIDENCE</p><h2 className="mt-2 font-serif text-xl font-bold">{item.reference} · {item.accomplishment_display}</h2><p className="mt-1 text-xs text-slate-600">Area {item.criterionKey.charAt(0)} · {criterionLabelByKey[item.criterionKey]}</p></header><dl className="mt-8 grid grid-cols-[170px_1fr] gap-y-3 text-sm"><dt className="font-bold">Reference</dt><dd>{item.reference}</dd><dt className="font-bold">Accomplishment</dt><dd>{item.accomplishment_display}</dd><dt className="font-bold">Document</dt><dd>{item.evidence.original_filename || 'Persisted evidence'}</dd><dt className="font-bold">Evidence status</dt><dd>{item.status}</dd></dl>{interactive && <button type="button" onClick={(event) => openProof(item, event)} className="mt-8 inline-flex w-fit items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 print:hidden"><FileText className="h-4 w-4" />Preview exact evidence</button>}<div className="mt-auto border-t border-slate-300 pt-4 text-xs text-slate-500">Linked accomplishment: {item.accomplishmentId} · Evidence ID: {item.evidence.id}</div></article>
  }

  const renderPage = (page, interactive) => (page.type === 'area' ? renderArea(page.area, interactive) : renderProof(page.item, interactive))

  // ---- Outline / search sidebar ----

  const outlineButtonClass = (id, level) => {
    const active = activeSection === id
    const base = 'w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 '
    if (level === 0) return base + `px-2.5 py-2 text-[11px] font-extrabold tracking-wide ${active ? 'bg-emerald-900 text-white' : 'text-slate-800 hover:bg-slate-100'}`
    return base + `flex items-start justify-between gap-2 px-2.5 py-1.5 text-xs ${active ? 'bg-emerald-50 font-bold text-emerald-900 ring-1 ring-emerald-700/30' : 'text-slate-600 hover:bg-slate-100'}`
  }

  const renderSidebar = (navRef) => (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20" placeholder="Search sections, records or proofs" aria-label="Search the portfolio" />
      </div>
      {query.trim() ? (
        <div className="mt-4" role="region" aria-label="Search results">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500" aria-live="polite">{searchResults.length} result{searchResults.length === 1 ? '' : 's'}</p>
          {searchResults.length === 0 && <p className="px-1 text-xs text-slate-500">No matching sections, records or proofs.</p>}
          <ul className="space-y-1">
            {searchResults.map((result) => (
              <li key={`${result.kind}-${result.id}`}>
                <button type="button" onClick={() => scrollToId(result.id, { highlight: result.kind === 'Accomplishment' })} className="w-full rounded-md px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">{result.kind}</span>
                  <span className="line-clamp-2">{result.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <nav ref={navRef} className="mt-4" aria-label="Portfolio outline">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Portfolio Outline</p>
          <ul className="space-y-3">
            {outline.map((area) => {
              const areaActive = activeSection === area.id || area.children.some((child) => child.id === activeSection)
              return (
                <li key={area.id}>
                  <button type="button" data-outline-id={area.id} aria-current={areaActive ? 'location' : undefined} onClick={() => scrollToId(area.id)} className={outlineButtonClass(area.id, 0) + (areaActive && activeSection !== area.id ? ' bg-emerald-50 text-emerald-900' : '')}>{area.label}</button>
                  <ul className="mt-1 space-y-0.5 border-l border-slate-200 pl-2 ml-2">
                    {area.children.map((child) => (
                      <li key={child.id}>
                        <button type="button" data-outline-id={child.id} aria-current={activeSection === child.id ? 'location' : undefined} onClick={() => scrollToId(child.id)} className={outlineButtonClass(child.id, 1)}>
                          <span>{child.label}</span>
                          {child.count > 0 && <span className="shrink-0 rounded-full bg-slate-100 px-1.5 text-[10px] font-bold tabular-nums text-slate-600">{child.count}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
          <p className="mb-2 mt-6 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Supporting Evidence</p>
          {proofItems.length === 0 ? <p className="px-2.5 text-xs text-slate-500">No attached proofs.</p> : (
            <ul className="space-y-0.5">
              {proofItems.map((item) => {
                const id = proofAnchor(item.accomplishmentId)
                return (
                  <li key={id}>
                    <button type="button" data-outline-id={id} aria-current={activeSection === id ? 'location' : undefined} onClick={() => scrollToId(id)} className={outlineButtonClass(id, 1)}>
                      <span><span className="mr-1 font-bold text-emerald-900">{item.reference}</span>{item.accomplishment_display || item.evidence.original_filename}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>
      )}
    </>
  )

  const toolButton = 'rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-30'
  const outlineExpanded = isDesktop() ? !outlineCollapsed : mobileOutlineOpen

  return (
    <div className="booklet-print-root fixed inset-0 z-50 bg-slate-950/85 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Faculty Academic portfolio booklet">
      <div className={`booklet-print-shell mx-auto flex h-full flex-col overflow-hidden bg-slate-100 shadow-2xl ${isFullscreen ? 'max-w-none sm:rounded-none' : 'max-w-[1600px] sm:rounded-2xl'}`}>
        <header className="sticky top-0 z-10 flex min-h-14 items-center justify-between gap-2 border-b border-slate-300 bg-white px-2 sm:px-4 print:hidden">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <button type="button" onClick={toggleOutline} className={toolButton} aria-label={outlineExpanded ? 'Hide portfolio outline' : 'Show portfolio outline'} aria-expanded={outlineExpanded} aria-controls={isDesktop() ? 'booklet-outline' : 'booklet-outline-mobile'}>
              {outlineExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-extrabold text-slate-900">Faculty Academic Portfolio</h2>
              <p className="hidden truncate text-xs text-slate-500 sm:block">{items.length} canonical accomplishments · {proofItems.length} attached proofs</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button type="button" onClick={() => scrollToPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className={toolButton} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <span className="min-w-[3.5rem] text-center text-xs font-bold tabular-nums" aria-live="polite" aria-label={`Page ${currentPage} of ${pages.length}`}>{currentPage} / {pages.length}</span>
            <button type="button" onClick={() => scrollToPage(Math.min(pages.length, currentPage + 1))} disabled={currentPage === pages.length} className={toolButton} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            <span className="mx-1 hidden h-5 w-px bg-slate-200 md:block" aria-hidden="true" />
            <button type="button" onClick={() => zoomBy(-ZOOM_STEP)} disabled={zoom <= MIN_ZOOM} className={`${toolButton} hidden md:inline-flex`} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
            <span className="hidden min-w-[3rem] text-center text-xs font-bold tabular-nums text-slate-700 md:inline" aria-live="polite" aria-label={`Zoom ${Math.round(zoom * 100)} percent`}>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => zoomBy(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM} className={`${toolButton} hidden md:inline-flex`} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
            <button type="button" onClick={() => setZoomMode('fit')} aria-pressed={zoomMode === 'fit'} className={`${toolButton} hidden md:inline-flex ${zoomMode === 'fit' ? 'bg-emerald-50 text-emerald-900' : ''}`} aria-label="Fit page to width"><MoveHorizontal className="h-4 w-4" /></button>
            <span className="mx-1 hidden h-5 w-px bg-slate-200 md:block" aria-hidden="true" />
            <button type="button" onClick={() => window.print()} className={toolButton} aria-label="Print or save as PDF"><Printer className="h-4 w-4" /></button>
            <button type="button" onClick={() => setIsFullscreen((value) => !value)} className={`${toolButton} hidden sm:inline-flex`} aria-label={isFullscreen ? 'Exit expanded view' : 'Expand viewer'} aria-pressed={isFullscreen}>{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
            <button type="button" onClick={onClose} className={toolButton} aria-label="Close booklet"><X className="h-5 w-5" /></button>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 print:hidden">
          {/* Desktop outline (collapsible to a slim rail) */}
          {outlineCollapsed ? (
            <div className="hidden w-12 shrink-0 flex-col items-center border-r border-slate-300 bg-white py-3 lg:flex">
              <button type="button" onClick={() => { restoreOutlineRef.current = false; setOutlineCollapsed(false) }} className={toolButton} aria-label="Show portfolio outline" aria-expanded="false" aria-controls="booklet-outline"><PanelLeftOpen className="h-4 w-4" /></button>
            </div>
          ) : (
            <aside id="booklet-outline" className="hidden w-[300px] shrink-0 overflow-y-auto border-r border-slate-300 bg-white p-4 lg:block">{renderSidebar(outlineRef)}</aside>
          )}

          {/* Mobile / tablet outline drawer */}
          {mobileOutlineOpen && (
            <div className="absolute inset-0 z-20 flex lg:hidden">
              <aside id="booklet-outline-mobile" aria-label="Portfolio outline" className="h-full w-[86%] max-w-[320px] overflow-y-auto bg-white p-4 shadow-2xl">{renderSidebar(mobileOutlineRef)}</aside>
              <button type="button" className="flex-1 bg-slate-950/40" aria-label="Close portfolio outline" onClick={() => setMobileOutlineOpen(false)} />
            </div>
          )}

          {/* Continuous document canvas */}
          <main ref={scrollRef} tabIndex={0} aria-label="Portfolio document" className="min-w-0 flex-1 overflow-auto bg-slate-200 px-2 py-4 focus:outline-none sm:px-6 sm:py-6">
            <div className="mx-auto w-fit space-y-6" style={{ zoom }}>
              {pages.map((page, index) => (
                <div key={page.key} data-page-index={index} aria-label={`Page ${index + 1} of ${pages.length}`} role="group">
                  {renderPage(page, true)}
                </div>
              ))}
            </div>
          </main>

          <BookletEvidenceDrawer
            item={activeProof}
            criterionLabel={activeProof ? criterionLabelByKey[activeProof.criterionKey] : ''}
            onClose={closeProof}
            onLocate={activeProof ? () => scrollToId(rowAnchor(activeProof.accomplishmentId), { highlight: true }) : undefined}
          />
        </div>

        {/* Print / Save-as-PDF copy: same render functions and page order, no app controls */}
        <div className="hidden print:block">{pages.map((page) => <div key={`print-${page.key}`} className="break-after-page">{renderPage(page, false)}</div>)}</div>
      </div>
      <style>{`@media print { body * { visibility: hidden !important; } .booklet-print-root { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; height: auto !important; padding: 0 !important; overflow: visible !important; background: none !important; } .booklet-print-shell { display: block !important; height: auto !important; max-width: none !important; overflow: visible !important; background: none !important; box-shadow: none !important; border-radius: 0 !important; } .booklet-page, .booklet-page * { visibility: visible !important; } .booklet-page { width: 210mm; min-height: 297mm; box-shadow: none; break-after: page; } @page { size: A4; margin: 0; } }`}</style>
    </div>
  )
}
