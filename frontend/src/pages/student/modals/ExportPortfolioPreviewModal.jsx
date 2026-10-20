import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  FileText, 
  Printer, 
  Download,
  QrCode, 
  ShieldCheck, 
  Award,
  FileCheck,
  FileWarning,
  FileX2,
  LoaderCircle
} from 'lucide-react'
import { generatePortfolioPdf, printPortfolio } from '../../../services/portfolioPdfGenerator'
import portfolioService from '../../../services/portfolioService'
import { evidenceMime } from '../../../components/common/EvidenceThumbnail'
import { detailRows } from '../../../utils/achievementDetails'
import ndmuSeal from '../../../assets/brand/ndmu-university-seal.png'

const dateTimestamp = value => {
  const timestamp = Date.parse(value || '')
  return Number.isFinite(timestamp) ? timestamp : 0
}

const parseMetadata = value => {
  if (!value) return {}
  if (typeof value === 'object') return value
  try { return JSON.parse(value) || {} } catch { return {} }
}

/** Maps a real verified /portfolio record into the booklet item shape (no scoring data). */
export function toExportItem(record, schemaCatalog = null) {
  const metadata = parseMetadata(record.structured_metadata)
  return {
    id: record.id,
    title: record.title || 'Untitled achievement',
    event_name: record.subcategory_name || '',
    issuer: record.organizer_or_body || '',
    category: record.category_name || record.category || 'Achievement',
    date: record.start_date || record.occurrence_date || record.verified_at || '',
    academic_year: metadata.academic_year || '',
    status: 'Verified',
    description: record.description || '',
    details: detailRows(record.subcategory_id, metadata, schemaCatalog),
    evidence: Array.isArray(record.evidence) ? record.evidence : []
  }
}

function PortfolioEvidencePreview({ evidence, preview }) {
  const mime = evidenceMime(evidence)

  if (!evidence) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-600">
        <FileX2 className="h-7 w-7 text-slate-400" aria-hidden="true" />
        <p className="text-xs font-semibold">No supporting document is attached.</p>
      </div>
    )
  }

  if (preview?.loading) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#16834a]" aria-label="Loading certificate preview" />
        <p className="text-xs font-semibold">Loading certificate…</p>
      </div>
    )
  }

  if (!preview?.url || preview.failed) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-[#735000]">
        <FileWarning className="h-7 w-7 text-amber-700" aria-hidden="true" />
        <p className="text-xs font-semibold">Certificate preview is unavailable.</p>
      </div>
    )
  }

  if (mime === 'application/pdf') {
    return (
      <iframe
        title={`Certificate: ${evidence.original_filename}`}
        src={`${preview.url}#page=1&view=FitH&toolbar=0`}
        className="h-full min-h-[220px] w-full rounded-lg border-0 bg-white"
        tabIndex={-1}
      />
    )
  }

  if (mime === 'image/jpeg' || mime === 'image/png') {
    return <img src={preview.url} alt={`Certificate: ${evidence.original_filename}`} className="h-full min-h-[220px] w-full rounded-lg bg-white object-contain" />
  }

  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-600">
      <FileText className="h-7 w-7 text-[#16834a]" aria-hidden="true" />
      <p className="text-xs font-semibold">This file type cannot be previewed.</p>
    </div>
  )
}

export default function ExportPortfolioPreviewModal({ isOpen, onClose, student, achievements }) {
  const [schemaCatalog, setSchemaCatalog] = useState(null)
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [schemaError, setSchemaError] = useState('')
  const [schemaRetry, setSchemaRetry] = useState(0)

  useEffect(() => {
    if (!isOpen) return undefined
    let active = true
    setSchemaCatalog(null)
    setSchemaError('')
    setSchemaLoading(true)
    portfolioService.fetchAchievementSchema()
      .then(catalog => {
        if (!Array.isArray(catalog?.categories)) throw new Error('Achievement detail labels are unavailable.')
        if (active) setSchemaCatalog(catalog)
      })
      .catch(error => {
        if (active) setSchemaError(error?.message || 'Achievement details could not be loaded.')
      })
      .finally(() => { if (active) setSchemaLoading(false) })
    return () => { active = false }
  }, [isOpen, schemaRetry])

  // Only verified records may appear in the official export.
  const initialAchievements = useMemo(() => (Array.isArray(achievements) ? achievements : [])
    .filter(record => String(record.status || '').toLowerCase() === 'verified')
    .map(record => toExportItem(record, schemaCatalog)), [achievements, schemaCatalog])

  // Simple document choices students can understand before saving.
  const [includeCoverPage, setIncludeCoverPage] = useState(true)
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true)
  const [includeCategorySeparators, setIncludeCategorySeparators] = useState(true)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [pdfSaving, setPdfSaving] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const previewScrollRef = useRef(null)

  // Every verified record is included, across the student's college years.
  const activeAchievements = useMemo(() => [...initialAchievements].sort(
    (a, b) => dateTimestamp(b.date) - dateTimestamp(a.date)
  ), [initialAchievements])

  // Fetch each protected proof once and share its object URL between screen preview and print.
  const [evidencePreviews, setEvidencePreviews] = useState({ loading: false, byId: {} })
  useEffect(() => {
    if (!isOpen) return undefined
    const files = activeAchievements.flatMap(item => item.evidence)
      .filter(file => file?.id && ['application/pdf', 'image/jpeg', 'image/png'].includes(evidenceMime(file)))
    if (files.length === 0) {
      setEvidencePreviews({ loading: false, byId: {} })
      return undefined
    }

    let cancelled = false
    const objectUrls = []
    setEvidencePreviews({ loading: true, byId: {} })
    Promise.all(files.map(async file => {
      try {
        const blob = await portfolioService.downloadEvidence(file.id)
        if (cancelled) return [file.id, { url: null, failed: true }]
        const url = URL.createObjectURL(blob)
        objectUrls.push(url)
        return [file.id, { url, failed: false }]
      } catch {
        return [file.id, { url: null, failed: true }]
      }
    })).then(entries => {
      if (cancelled) return
      setEvidencePreviews({
        loading: false,
        byId: Object.fromEntries(entries.map(([id, preview]) => [id, { ...preview, loading: false }]))
      })
    })

    return () => {
      cancelled = true
      objectUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [isOpen, activeAchievements])

  // Group active achievements by category
  const achievementsByCategory = useMemo(() => {
    const groups = {}
    activeAchievements.forEach(item => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    Object.values(groups).forEach(items => items.sort(
      (a, b) => dateTimestamp(b.date) - dateTimestamp(a.date)
    ))
    return groups
  }, [activeAchievements])

  // Recalculated Dynamic Stats
  const dynamicTotal = activeAchievements.length
  const dynamicVerified = activeAchievements.filter(a => a.status === 'Verified').length

  // Construct Multi-Page Sequence Array
  const pagesList = useMemo(() => {
    const pages = []

    // 1. Cover Page
    if (includeCoverPage) {
      pages.push({ type: 'cover', title: 'Cover Page' })
    }

    // 2. Table of Contents Page
    if (includeTableOfContents) {
      pages.push({ type: 'toc', title: 'Contents & Summary' })
    }

    // 3. Categories & Achievement Pages
    let currentOverallPageNum = pages.length + 1
    Object.keys(achievementsByCategory).forEach((catName, catIndex) => {
      // Category Separator Slide
      if (includeCategorySeparators) {
        pages.push({ 
          type: 'separator', 
          category: catName, 
          title: `Category Section: ${catName}`,
          index: catIndex + 1
        })
        currentOverallPageNum++
      }

      // Give submitted details and proof their own pages so every entered field
      // remains readable without shrinking or clipping the certificate.
      achievementsByCategory[catName].forEach((item) => {
        pages.push({
          type: 'achievement-details',
          item,
          category: catName,
          title: item.title,
          pageNum: currentOverallPageNum
        })
        pages.push({
          type: 'achievement-evidence',
          item,
          category: catName,
          title: `${item.title} — Supporting Evidence`,
          pageNum: currentOverallPageNum + 1
        })
        currentOverallPageNum += 2
      })
    })

    if (pages.length === 0) {
      pages.push({ type: 'cover', title: 'Cover Page' })
    }

    return pages
  }, [includeCoverPage, includeTableOfContents, includeCategorySeparators, achievementsByCategory])

  const totalPagesCount = pagesList.length
  const safePageIndex = Math.min(currentPageIndex, Math.max(0, totalPagesCount - 1))

  useEffect(() => {
    const container = previewScrollRef.current
    if (!isOpen || !container || typeof IntersectionObserver === 'undefined') return undefined

    const visibility = new Map()
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const index = Number(entry.target.dataset.pageIndex)
        if (!Number.isInteger(index)) return
        if (entry.isIntersecting) visibility.set(index, entry.intersectionRatio)
        else visibility.delete(index)
      })
      const index = [...visibility.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
      if (Number.isInteger(index)) setCurrentPageIndex(index)
    }, { root: container, threshold: [0.25, 0.5, 0.75] })

    container.querySelectorAll('[data-preview-page]').forEach(page => observer.observe(page))
    return () => observer.disconnect()
  }, [isOpen, pagesList])

  const handleSavePDF = async () => {
    setPdfSaving(true)
    setPdfError('')
    try {
      await generatePortfolioPdf(`NDMU_Portfolio_${student?.student_id || ''}`)
    } catch (error) {
      setPdfError(error?.message || 'The PDF could not be created. Please try again.')
    } finally {
      setPdfSaving(false)
    }
  }

  // One renderer for the on-screen preview and the printed copy, so both always match.
  const renderPageBody = (page) => (
    <>
                {/* 1. COVER PAGE VIEW */}
                {page.type === 'cover' && (
                  <div className="h-full flex flex-col justify-between border-4 border-[#A9C6B1] p-6 rounded-xl relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-white">
                    
                    {/* Header Seal */}
                    <div className="text-center space-y-2 pt-2">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-md border border-[#A9C6B1] p-1.5">
                        <img src={ndmuSeal} alt="Notre Dame of Marbel University seal" className="h-full w-full object-contain" />
                      </div>
                      <h2 className="text-xs font-black text-[#064e2b] tracking-wider uppercase">Notre Dame of Marbel University</h2>
                      <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">Koronadal City, South Cotabato • Philippines</p>
                    </div>

                    {/* Title & Metadata */}
                    <div className="text-center space-y-3 my-auto">
                      <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-[#064e2b] text-[9px] font-extrabold uppercase tracking-widest">
                        Official Academic Record
                      </div>
                      <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight uppercase">
                        STUDENT ACHIEVEMENT PORTFOLIO
                      </h1>
                      <div className="w-20 h-1 bg-[#16834a] mx-auto rounded-full"></div>
                    </div>

                    {/* Student Info Footer Card */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center space-y-1">
                      <p className="text-xs font-extrabold text-slate-900">{student?.full_name || ''}</p>
                      <p className="text-[11px] text-slate-600 font-semibold">{student?.student_id || ''} • {student?.program || ''}</p>
                      <p className="text-[10px] text-slate-500 font-medium pt-0.5">Verified achievements across college years • AchieveNest</p>
                    </div>
                  </div>
                )}

                {/* 2. TABLE OF CONTENTS VIEW */}
                {page.type === 'toc' && (
                  <div className="h-full flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between border-b-2 border-[#A9C6B1] pb-2 mb-3">
                        <div>
                          <h2 className="text-sm font-black text-[#064e2b] uppercase">Contents & Summary</h2>
                        <p className="text-[10px] text-slate-500 font-medium">All verified achievements across college years</p>
                        </div>
                        <FileText className="w-5 h-5 text-[#16834a]" />
                      </div>

                      {/* Selected portfolio summary */}
                      <div className="grid grid-cols-2 gap-2 bg-[#eef7f0] p-2.5 rounded-xl border border-[#cbe6d2] mb-3 text-center">
                        <div>
                          <p className="text-sm font-black text-[#064e2b]">{dynamicTotal}</p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase">Included Items</p>
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#064e2b]">{dynamicVerified}</p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase">Verified Records</p>
                        </div>
                      </div>

                      {/* TOC Items Index List */}
                      <div className="space-y-1.5 text-[11px]">
                        {pagesList.filter(p => p.type === 'achievement-details').map((itemPage, idx) => (
                          <div key={idx} className="flex items-center justify-between border-b border-dashed border-slate-200 pb-1">
                            <span className="font-bold text-slate-800 truncate max-w-[300px]">{idx + 1}. {itemPage.item.title}</span>
                            <span className="text-[10px] font-extrabold text-[#16834a] shrink-0">Page {itemPage.pageNum}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-400 text-center border-t pt-1.5 font-medium">
                      Page 2 • AchieveNest Official Portfolio
                    </div>
                  </div>
                )}

                {/* 3. CATEGORY SEPARATOR SLIDE VIEW */}
                {page.type === 'separator' && (
                  <div className="h-full bg-[#DCEBDD] text-[#123D2A] p-6 rounded-xl flex flex-col justify-between relative overflow-hidden border-4 border-amber-400/80">
                    <div className="text-[#735000] font-black text-[10px] uppercase tracking-widest">Section Divider</div>

                    <div className="space-y-3 my-auto">
                      <div className="w-12 h-12 rounded-2xl bg-[#16834a] text-white flex items-center justify-center font-black text-xl shadow-lg border border-emerald-400/40">
                        <Award className="w-6 h-6" />
                      </div>
                      <h2 className="text-lg font-black tracking-tight uppercase leading-tight text-[#123D2A]">
                        SECTION {page.index}: {page.category?.toUpperCase()} ACHIEVEMENTS
                      </h2>
                      <p className="text-xs text-[#315D43] font-medium">
                        Official verified entries under {page.category} category
                      </p>
                    </div>

                    <div className="text-[9px] text-[#315D43] font-bold uppercase tracking-wider border-t border-[#A9C6B1] pt-2">
                      Notre Dame of Marbel University • AchieveNest System
                    </div>
                  </div>
                )}

                {/* 4. FULL SUBMISSION DETAILS */}
                {page.type === 'achievement-details' && page.item && (
                  <div className="flex h-full flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#A9C6B1] bg-white p-1">
                          <img src={ndmuSeal} alt="Notre Dame of Marbel University seal" className="h-full w-full object-contain" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wide text-slate-800">NDMU ACHIEVENEST VERIFIED PORTFOLIO</span>
                      </div>
                      <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 text-[9px] font-extrabold text-[#064e2b]">{page.item.category}</span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-black leading-tight text-slate-900">{page.item.title}</h3>
                        {page.item.event_name && <p className="mt-1 text-xs font-bold text-slate-600">{page.item.event_name}</p>}
                      </div>
                      <span className="shrink-0 rounded-full border border-[#cbe6d2] bg-[#eef7f0] px-2 py-1 text-[9px] font-extrabold text-[#064e2b]">Verified ✓</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] text-slate-700">
                      <div><strong>Issuer / organizer:</strong> {page.item.issuer || 'Not provided'}</div>
                      <div><strong>Activity date:</strong> {page.item.date || 'Not provided'}</div>
                      {page.item.academic_year && <div><strong>Academic year:</strong> {page.item.academic_year}</div>}
                      <div><strong>Review status:</strong> Verified by the Program Coordinator</div>
                      {page.item.description && <div className="col-span-2 whitespace-pre-wrap break-words"><strong>Description / notes:</strong> {page.item.description}</div>}
                    </div>

                    <section className="min-h-0 flex-1 overflow-y-auto print:overflow-visible">
                      <h4 className="mb-2 text-[10px] font-black uppercase tracking-wide text-[#064e2b]">Submitted achievement details</h4>
                      {page.item.details.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-300 p-3 text-[10px] text-slate-500">No additional structured details were recorded for this achievement.</p>
                      ) : (
                        <dl className="grid grid-cols-2 content-start gap-2">
                          {page.item.details.map(row => (
                            <div key={row.key} className="min-w-0 rounded-lg border border-slate-200 px-2.5 py-2">
                              <dt className="text-[8px] font-bold uppercase tracking-wide text-slate-500">{row.label}</dt>
                              <dd className="mt-0.5 whitespace-pre-wrap break-words text-[10px] font-medium leading-snug text-slate-800">{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </section>

                    <div className="flex items-center justify-between border-t pt-1 text-[8.5px] font-semibold text-slate-400">
                      <span>{student?.full_name || 'Student'} • NDMU AchieveNest Verified Portfolio</span>
                      <span>Page {page.pageNum} of {totalPagesCount}</span>
                    </div>
                  </div>
                )}

                {/* 5. FULL-PAGE SUPPORTING EVIDENCE */}
                {page.type === 'achievement-evidence' && page.item && (
                  <div className="flex h-full min-h-0 flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wide text-slate-800">Verified Supporting Evidence</p>
                        <h3 className="mt-1 text-sm font-extrabold text-slate-900">{page.item.title}</h3>
                      </div>
                      <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 text-[9px] font-extrabold text-[#064e2b]">{page.item.category}</span>
                    </div>
                    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                      {page.item.evidence.length === 0
                        ? <PortfolioEvidencePreview evidence={null} />
                        : <div className={`grid min-h-0 flex-1 gap-2 ${page.item.evidence.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {page.item.evidence.map(file => (
                              <div key={file.id} className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                <PortfolioEvidencePreview
                                  evidence={file}
                                  preview={evidencePreviews.loading ? { loading: true } : evidencePreviews.byId[file.id]}
                                />
                              </div>
                            ))}
                          </div>}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-slate-900/80 px-2 py-1 text-[8px] font-bold text-white backdrop-blur-md">
                        <QrCode className="h-3 w-3 text-amber-400" />
                        <span>Verified Digital Proof</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-1 text-[8.5px] font-semibold text-slate-400">
                      <span>{page.item.evidence.map(file => file.original_filename).filter(Boolean).join(' • ') || 'Supporting evidence'}</span>
                      <span>Page {page.pageNum} of {totalPagesCount}</span>
                    </div>
                  </div>
                )}
    </>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="relative flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        
        {/* TOP MODAL HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f5eb] text-[#16834a]">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Save your portfolio</h3>
              <p className="text-xs font-medium text-slate-600">Choose verified achievements, check the preview, then save as a PDF.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SPLIT-SCREEN WORKSPACE CANVAS */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* ================= LEFT PANEL (65%): LIVE MULTI-PAGE PREVIEW RENDERER ================= */}
          <div ref={previewScrollRef} className="lg:col-span-8 min-h-0 overflow-y-auto border-r border-slate-200 bg-[#f6f8f5] p-4 sm:p-6">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm">
              <div>
                <p className="text-sm font-extrabold text-slate-900">Portfolio preview</p>
                <p className="text-xs text-slate-600">Scroll to review every page before saving.</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#e8f5eb] px-3 py-1 text-xs font-extrabold text-[#17663b]">
                Page {safePageIndex + 1} of {totalPagesCount}
              </span>
            </div>

            <div className="flex flex-col items-center gap-6 pb-6">
              {pagesList.map((page, idx) => (
                <article
                  key={`${page.type}-${idx}`}
                  data-preview-page
                  data-page-index={idx}
                  aria-label={`Page ${idx + 1} of ${totalPagesCount}: ${page.title}`}
                  className="relative flex h-[570px] w-full max-w-[540px] shrink-0 flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-6 font-sans text-slate-900 shadow-lg sm:p-7"
                >
                  {renderPageBody({ ...page, pageNum: idx + 1 })}
                </article>
              ))}
            </div>
          </div>

          {/* ================= RIGHT PANEL (35%): CUSTOMIZATION & CHECKLIST WORKSPACE ================= */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6 overflow-y-auto bg-white p-5">
            
            <div className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-extrabold text-slate-900">Portfolio pages</legend>
                <p className="text-xs leading-5 text-slate-600">These options change the pages in your saved portfolio.</p>
                {schemaError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <p>{schemaError} The PDF is disabled so submitted details are not silently omitted.</p>
                  <button type="button" onClick={() => setSchemaRetry(value => value + 1)} className="mt-2 font-bold underline">Retry loading details</button>
                </div>}
                <div className="space-y-2 text-sm text-slate-700">
                  {[
                    ['cover', 'Add a cover page', includeCoverPage, setIncludeCoverPage],
                    ['contents', 'Add a contents page', includeTableOfContents, setIncludeTableOfContents],
                    ['categories', 'Group achievements by category', includeCategorySeparators, setIncludeCategorySeparators]
                  ].map(([id, label, checked, setChecked]) => (
                    <label key={id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50">
                      <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#16834a] focus:ring-[#16834a]" />
                      <span className="font-semibold">{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-3 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">Included achievements</h4>
                    <p className="mt-0.5 text-xs text-slate-600">All verified records are included, newest first within each category.</p>
                  </div>
                  <span className="text-xs font-bold text-[#17663b]">{activeAchievements.length} included</span>
                </div>

                <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                  {activeAchievements.map((item) => (
                    <div
                      key={item.id}
                      className="flex w-full items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50/70 p-3 text-left text-slate-900"
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#16834a]" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs truncate leading-tight">{item.title}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{item.category} • {item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* DYNAMIC ACTION BUTTON FOOTER */}
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={handleSavePDF}
                disabled={pdfSaving || activeAchievements.length === 0 || evidencePreviews.loading || schemaLoading || !schemaCatalog}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16834a] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#126b3c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pdfSaving || evidencePreviews.loading || schemaLoading
                  ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  : <Download className="w-4 h-4" />}
                <span>{schemaLoading ? 'Loading achievement details…' : evidencePreviews.loading ? 'Preparing certificates…' : pdfSaving ? 'Creating PDF…' : 'Save as PDF'}</span>
              </button>
              <p className="text-center text-[11px] text-slate-500" role={pdfError ? 'alert' : undefined}>
                {schemaLoading
                  ? 'Loading the submitted fields so they can be included in the portfolio.'
                  : evidencePreviews.loading
                    ? 'Loading the verified evidence for your portfolio.'
                    : pdfError || 'Downloads the portfolio as a PDF file.'}
              </p>

              <button
                type="button"
                onClick={printPortfolio}
                disabled={activeAchievements.length === 0 || evidencePreviews.loading || schemaLoading || !schemaCatalog}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Close
              </button>
            </div>

          </div>

        </div>

      </div>
      {typeof document !== 'undefined' && createPortal(
        <div className="print-area print-show student-portfolio-print" aria-hidden="true">
          <style>{`@media print { @page { size: A4; margin: 12mm; } .student-portfolio-print-page { box-sizing: border-box; break-after: page; page-break-after: always; height: 260mm; min-height: 260mm; display: flex; flex-direction: column; justify-content: space-between; } .student-portfolio-print-page:last-child { break-after: auto; page-break-after: auto; } }`}</style>
          {pagesList.map((page, idx) => (
            <div key={`${page.type}-${idx}`} className="student-portfolio-print-page bg-white text-slate-900 font-sans">
              {renderPageBody(page)}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
