import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Award, ChevronLeft, ChevronRight, FileText, FileWarning, FileX2, LoaderCircle, Maximize2, Minus, Plus, Printer, Scan } from 'lucide-react'
import { evidenceMime } from '../common/EvidenceThumbnail'
import { renderPdfFirstPage } from '../portfolio-booklet/pdfEvidenceRenderer'
import ndmuSeal from '../../assets/brand/ndmu-university-seal.png'

const PRIVATE_DETAIL = /score|points|ranking|threshold|candidate_status|potential_awardee|rubric|weight|selection_source|origin_/i
const EMPTY_RECORDS = []

const dateText = value => {
  if (!value) return 'Date not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

const labelText = value => String(value || '')
  .replaceAll('_', ' ')
  .replace(/\b\w/g, character => character.toUpperCase())

const normalizeRecord = (record, index) => {
  const rawDetails = record?.details && typeof record.details === 'object' && !Array.isArray(record.details)
    ? record.details
    : {}
  const details = Object.entries(rawDetails)
    .filter(([key, value]) => !PRIVATE_DETAIL.test(key) && value !== null && value !== '' && typeof value !== 'object')
    .map(([key, value]) => ({ key, label: labelText(key), value: String(value) }))

  return {
    id: record?.record_id || record?.id || `record-${index}`,
    title: record?.title || record?.achievement_title || 'Untitled achievement',
    category: record?.category || record?.category_name || 'Achievement',
    eventName: record?.subcategory || record?.subcategory_name || '',
    issuer: record?.organizer || record?.organizer_or_body || '',
    date: record?.start_date || record?.activity_date || record?.occurrence_date || record?.verified_at || '',
    academicYear: rawDetails.academic_year || '',
    description: record?.description || '',
    details,
    evidence: Array.isArray(record?.evidence) ? record.evidence : []
  }
}

function EvidencePreview({ file, preview }) {
  if (!file) {
    return <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 bg-slate-50 p-5 text-center text-slate-600">
      <FileX2 className="h-8 w-8 text-slate-400" aria-hidden="true" />
      <p className="text-xs font-semibold">No supporting document is attached.</p>
    </div>
  }
  if (preview?.loading) {
    return <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 bg-slate-50 p-5 text-slate-600">
      <LoaderCircle className="h-7 w-7 animate-spin text-emerald-700" aria-label="Loading supporting document" />
      <p className="text-xs font-semibold">Loading supporting document…</p>
    </div>
  }
  if (!preview?.url || preview.failed) {
    return <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 bg-amber-50 p-5 text-center text-amber-900">
      <FileWarning className="h-8 w-8 text-amber-700" aria-hidden="true" />
      <p className="text-xs font-semibold">Supporting document preview is unavailable.</p>
      <p className="max-w-full truncate text-[10px]">{file.original_filename}</p>
    </div>
  }

  const mime = evidenceMime(file)
  if (mime === 'application/pdf' || mime === 'image/jpeg' || mime === 'image/png') {
    return <img src={preview.url} alt={`Supporting document: ${file.original_filename}`} className="h-full min-h-40 w-full bg-white object-contain" />
  }
  return <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 bg-slate-50 p-5 text-center text-slate-600">
    <FileText className="h-8 w-8 text-emerald-700" aria-hidden="true" />
    <p className="text-xs font-semibold">This file type cannot be previewed.</p>
    <p className="max-w-full truncate text-[10px]">{file.original_filename}</p>
  </div>
}

function PageShell({ children, pageNumber, totalPages, label, pageRef, zoom }) {
  return <article ref={pageRef} className="portfolio-submission-booklet-page relative aspect-[210/297] w-full overflow-hidden bg-white p-7 text-slate-950 shadow-[0_12px_32px_rgba(15,23,42,0.12)] transition-[max-width] duration-200 sm:p-10" style={{ maxWidth: `${680 * zoom / 100}px` }} aria-label={label} data-booklet-page={pageNumber}>
    {children}
    <div className="absolute inset-x-10 bottom-5 flex items-center justify-between border-t border-slate-200 pt-2 text-[9px] font-semibold text-slate-400">
      <span>NDMU AchieveNest Verified Portfolio</span>
      <span className="tabular-nums">Page {pageNumber} of {totalPages}</span>
    </div>
  </article>
}

export default function PortfolioSubmissionDocument({ snapshot, previewRecords = null, downloadFile, onPrint }) {
  const sourceRecords = snapshot?.records || previewRecords || EMPTY_RECORDS
  const records = useMemo(() => sourceRecords.map(normalizeRecord), [sourceRecords])
  const student = snapshot?.student || {}
  const awards = snapshot?.awards || []
  const isSubmitted = Boolean(snapshot?.version && snapshot?.submitted_at)
  const downloadFileRef = useRef(downloadFile)
  const viewerRef = useRef(null)
  const pageRefs = useRef([])
  const [evidencePreviews, setEvidencePreviews] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  downloadFileRef.current = downloadFile

  const groupedRecords = useMemo(() => {
    const groups = new Map()
    records.forEach(record => {
      if (!groups.has(record.category)) groups.set(record.category, [])
      groups.get(record.category).push(record)
    })
    return [...groups.entries()].map(([category, items]) => ({ category, items }))
  }, [records])

  const pages = useMemo(() => {
    const result = [{ type: 'cover' }, { type: 'contents' }]
    groupedRecords.forEach(({ category, items }, categoryIndex) => {
      result.push({ type: 'separator', category, categoryIndex: categoryIndex + 1 })
      items.forEach(item => {
        result.push({ type: 'details', item })
        result.push({ type: 'evidence', item })
      })
    })
    return result.map((page, index) => ({ ...page, pageNumber: index + 1 }))
  }, [groupedRecords])

  const evidenceFiles = useMemo(() => records.flatMap(record => record.evidence), [records])
  const evidenceKey = evidenceFiles.map(file => file.id).filter(Boolean).join('|')

  useEffect(() => {
    if (!downloadFileRef.current || evidenceFiles.length === 0) {
      setEvidencePreviews({})
      return undefined
    }
    let active = true
    const objectUrls = []
    setEvidencePreviews(Object.fromEntries(evidenceFiles.filter(file => file.id).map(file => [file.id, { loading: true }])))
    Promise.all(evidenceFiles.filter(file => file.id).map(async file => {
      try {
        const response = await downloadFileRef.current(file)
        if (!active) return
        const blob = response?.data || response
        const isPdf = evidenceMime(file) === 'application/pdf'
        const url = isPdf ? await renderPdfFirstPage(blob) : URL.createObjectURL(blob)
        if (!isPdf) objectUrls.push(url)
        if (!url) throw new Error('The supporting document preview could not be rendered.')
        setEvidencePreviews(current => ({ ...current, [file.id]: { url, loading: false, failed: false } }))
      } catch {
        if (active) setEvidencePreviews(current => ({ ...current, [file.id]: { url: null, loading: false, failed: true } }))
      }
    }))
    return () => {
      active = false
      objectUrls.forEach(url => URL.revokeObjectURL(url))
    }
  // The identity list is the reload boundary; the latest download function is read through a ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidenceKey])

  const totalPages = pages.length
  const studentName = student.name || student.full_name || 'Student'
  const studentId = student.student_id || student.institutional_id || ''
  const program = student.program || student.program_name || student.academic_program_name || ''
  const placement = [student.year_level, student.college || student.college_name].filter(Boolean).join(' • ')
  const contentsPages = pages.filter(page => page.type === 'details')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]
      const pageNumber = Number(visible?.target?.dataset?.bookletPage)
      if (Number.isInteger(pageNumber)) setCurrentPage(pageNumber)
    }, { threshold: [0.25, 0.5, 0.75] })
    pageRefs.current.slice(0, totalPages).forEach(page => { if (page) observer.observe(page) })
    return () => observer.disconnect()
  }, [totalPages])

  const goToPage = pageNumber => {
    const nextPage = Math.min(totalPages, Math.max(1, pageNumber))
    setCurrentPage(nextPage)
    pageRefs.current[nextPage - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const enterFullscreen = () => viewerRef.current?.requestFullscreen?.()

  return <section ref={viewerRef} className="portfolio-submission-print bg-slate-100 fullscreen:h-screen fullscreen:overflow-y-auto" aria-label="Portfolio Submission">
    <div className="print-hide sticky top-0 z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
      <div>
        <h2 className="font-bold text-slate-950">Submitted portfolio preview</h2>
        <p className="mt-0.5 text-sm text-slate-600">Cover, contents, category dividers, achievement details, and supporting evidence are included.</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="Page navigation">
          <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className="grid h-8 w-8 place-items-center rounded-md text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-20 px-2 text-center text-xs font-semibold tabular-nums text-slate-700">{currentPage} / {totalPages}</span>
          <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="grid h-8 w-8 place-items-center rounded-md text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="Zoom controls">
          <button type="button" onClick={() => setZoom(value => Math.max(75, value - 25))} disabled={zoom <= 75} className="grid h-8 w-8 place-items-center rounded-md text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35" aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
          <span className="min-w-12 px-1 text-center text-xs font-semibold tabular-nums text-slate-700">{zoom}%</span>
          <button type="button" onClick={() => setZoom(value => Math.min(150, value + 25))} disabled={zoom >= 150} className="grid h-8 w-8 place-items-center rounded-md text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35" aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
        </div>
        <button type="button" onClick={() => setZoom(100)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" title="Fit pages to the viewer"><Scan className="h-4 w-4" aria-hidden="true" />Fit</button>
        <button type="button" onClick={enterFullscreen} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" aria-label="View portfolio fullscreen" title="Fullscreen"><Maximize2 className="h-4 w-4" /></button>
        {onPrint && <button type="button" onClick={onPrint} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"><Printer className="h-4 w-4" aria-hidden="true" />Print / Save as PDF</button>}
      </div>
    </div>

    <div className="flex flex-col items-center gap-5 bg-slate-100 p-3 sm:p-6 print:block print:bg-white print:p-0">
      {pages.map(page => <PageShell key={`${page.type}-${page.pageNumber}`} pageNumber={page.pageNumber} totalPages={totalPages} label={page.type === 'separator' ? `${page.category} category divider` : `${labelText(page.type)} page`} pageRef={node => { pageRefs.current[page.pageNumber - 1] = node }} zoom={zoom}>
        {page.type === 'cover' && <div className="flex h-full flex-col justify-between rounded-xl border-4 border-[#A9C6B1] bg-gradient-to-b from-emerald-50/50 via-white to-white p-7">
          <div className="space-y-2 pt-3 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[#A9C6B1] bg-white p-1.5 shadow-md"><img src={ndmuSeal} alt="Notre Dame of Marbel University seal" className="h-full w-full object-contain" /></div>
            <h1 className="text-xs font-black uppercase tracking-wider text-[#064e2b]">Notre Dame of Marbel University</h1>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Koronadal City, South Cotabato • Philippines</p>
          </div>
          <div className="my-auto space-y-4 text-center">
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-[#064e2b]">Official Academic Record</span>
            <h2 className="text-2xl font-black uppercase leading-tight tracking-tight text-slate-900">Student Achievement Portfolio</h2>
            <div className="mx-auto h-1 w-20 rounded-full bg-[#16834a]" />
          </div>
          <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm font-extrabold text-slate-900">{studentName}</p>
            <p className="text-[11px] font-semibold text-slate-600">{[studentId, program].filter(Boolean).join(' • ') || 'Student profile'}</p>
            {placement && <p className="text-[10px] font-medium text-slate-500">{placement}</p>}
            {awards.length > 0 && <p className="pt-1 text-[10px] font-semibold text-emerald-800">Submitted for {awards.map(award => award.name).join(', ')}</p>}
            <p className="pt-0.5 text-[10px] font-medium text-slate-500">{isSubmitted ? `Final Submission • Version ${snapshot.version} • ${dateText(snapshot.submitted_at)}` : 'Review Preview • All verified achievements'}</p>
          </div>
        </div>}

        {page.type === 'contents' && <div className="flex h-full flex-col pb-7">
          <header className="mb-4 flex items-center justify-between border-b-2 border-[#A9C6B1] pb-3">
            <div><h2 className="text-base font-black uppercase text-[#064e2b]">Contents &amp; Summary</h2><p className="mt-1 text-[10px] font-medium text-slate-500">Every verified achievement in this submitted portfolio</p></div>
            <FileText className="h-6 w-6 text-[#16834a]" aria-hidden="true" />
          </header>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-[#cbe6d2] bg-[#eef7f0] p-3 text-center">
            <div><p className="text-lg font-black text-[#064e2b]">{records.length}</p><p className="text-[8px] font-bold uppercase text-slate-500">Included items</p></div>
            <div><p className="text-lg font-black text-[#064e2b]">{groupedRecords.length}</p><p className="text-[8px] font-bold uppercase text-slate-500">Categories</p></div>
          </div>
          <div className="space-y-2 text-[11px]">
            {contentsPages.map((itemPage, index) => <div key={itemPage.item.id} className="flex items-center gap-2 border-b border-dashed border-slate-200 pb-2">
              <span className="min-w-0 flex-1 truncate font-bold text-slate-800">{index + 1}. {itemPage.item.title}</span>
              <span className="shrink-0 font-extrabold tabular-nums text-[#16834a]">Page {itemPage.pageNumber}</span>
            </div>)}
            {contentsPages.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-slate-500">No verified achievements are available.</p>}
          </div>
        </div>}

        {page.type === 'separator' && <div className="flex h-full flex-col justify-between overflow-hidden rounded-xl border-4 border-amber-400/80 bg-[#DCEBDD] p-8 text-[#123D2A]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#735000]">Section {page.categoryIndex}</p>
          <div className="my-auto space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-[#16834a] text-white shadow-lg"><Award className="h-7 w-7" aria-hidden="true" /></div>
            <h2 className="max-w-[20ch] text-2xl font-black uppercase leading-tight tracking-tight">{page.category}</h2>
            <p className="text-sm font-medium text-[#315D43]">Official verified entries under the {page.category} category</p>
          </div>
          <p className="border-t border-[#A9C6B1] pt-3 text-[9px] font-bold uppercase tracking-wider text-[#315D43]">Notre Dame of Marbel University • AchieveNest System</p>
        </div>}

        {page.type === 'details' && <div className="flex h-full flex-col gap-4 pb-7">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex min-w-0 items-center gap-2"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#A9C6B1] bg-white p-1"><img src={ndmuSeal} alt="" className="h-full w-full object-contain" /></div><span className="truncate text-[9px] font-black uppercase tracking-wide text-slate-800">NDMU AchieveNest Verified Portfolio</span></div>
            <span className="max-w-[42%] truncate rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 text-[9px] font-extrabold text-[#064e2b]">{page.item.category}</span>
          </header>
          <div><h2 className="break-words text-xl font-black leading-tight text-slate-900">{page.item.title}</h2>{page.item.eventName && <p className="mt-1 text-xs font-bold text-slate-600">{page.item.eventName}</p>}</div>
          <dl className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] text-slate-700">
            <div><dt className="font-bold">Issuer / organizer</dt><dd>{page.item.issuer || 'Not provided'}</dd></div>
            <div><dt className="font-bold">Activity date</dt><dd>{dateText(page.item.date)}</dd></div>
            {page.item.academicYear && <div><dt className="font-bold">Academic year</dt><dd>{page.item.academicYear}</dd></div>}
            <div><dt className="font-bold">Review status</dt><dd>Verified</dd></div>
            {page.item.description && <div className="col-span-2"><dt className="font-bold">Description / notes</dt><dd className="whitespace-pre-wrap break-words">{page.item.description}</dd></div>}
          </dl>
          <section className="min-h-0 flex-1 overflow-hidden">
            <h3 className="mb-2 text-[10px] font-black uppercase tracking-wide text-[#064e2b]">Submitted achievement details</h3>
            {page.item.details.length === 0
              ? <p className="rounded-lg border border-dashed border-slate-300 p-3 text-[10px] text-slate-500">No additional structured details were recorded for this achievement.</p>
              : <dl className="grid grid-cols-2 content-start gap-2">{page.item.details.map(row => <div key={row.key} className="min-w-0 rounded-lg border border-slate-200 px-2.5 py-2"><dt className="text-[8px] font-bold uppercase tracking-wide text-slate-500">{row.label}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words text-[10px] font-medium leading-snug text-slate-800">{row.value}</dd></div>)}</dl>}
          </section>
        </div>}

        {page.type === 'evidence' && <div className="flex h-full min-h-0 flex-col gap-4 pb-7">
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wide text-slate-600">Verified supporting evidence</p><h2 className="mt-1 break-words text-base font-extrabold text-slate-900">{page.item.title}</h2></div><span className="max-w-[40%] shrink-0 truncate rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 text-[9px] font-extrabold text-[#064e2b]">{page.item.category}</span></header>
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white p-2">
            {page.item.evidence.length === 0
              ? <EvidencePreview file={null} />
              : <div className={`grid min-h-0 flex-1 gap-2 ${page.item.evidence.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>{page.item.evidence.map(file => <div key={file.id} className="flex min-h-0 flex-col overflow-hidden rounded-lg bg-slate-50"><EvidencePreview file={file} preview={evidencePreviews[file.id]} /></div>)}</div>}
          </div>
          <p className="truncate text-[9px] font-semibold text-slate-500">{page.item.evidence.map(file => file.original_filename).filter(Boolean).join(' • ') || 'No supporting evidence attached'}</p>
        </div>}
      </PageShell>)}
    </div>
    <style>{`@media print { @page { size: A4; margin: 0; } body * { visibility: hidden !important; } .portfolio-submission-print, .portfolio-submission-print * { visibility: visible !important; } .portfolio-submission-print { position: absolute; inset: 0; width: 210mm; } .portfolio-submission-booklet-page { width: 210mm !important; max-width: none !important; height: 297mm !important; box-shadow: none !important; break-after: page; page-break-after: always; } .portfolio-submission-booklet-page:last-child { break-after: auto; page-break-after: auto; } }`}</style>
  </section>
}
