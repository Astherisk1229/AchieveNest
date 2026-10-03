import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  QrCode, 
  ShieldCheck, 
  Award,
  ChevronLeft,
  ChevronRight,
  Sliders,
  CheckSquare,
  Square,
  BookOpen,
  GraduationCap,
  Layers,
  Layout
} from 'lucide-react'
import { generatePortfolioPdf } from '../../../services/portfolioPdfGenerator'

const parseMetadata = value => {
  if (!value) return {}
  if (typeof value === 'object') return value
  try { return JSON.parse(value) || {} } catch { return {} }
}

/** Maps a real verified /portfolio record into the booklet item shape (no scoring data). */
export function toExportItem(record) {
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
    evidence: Array.isArray(record.evidence) ? record.evidence : []
  }
}

export default function ExportPortfolioPreviewModal({ isOpen, onClose, student, achievements }) {
  // Only verified records may appear in the official export.
  const initialAchievements = useMemo(() => (Array.isArray(achievements) ? achievements : [])
    .filter(record => String(record.status || '').toLowerCase() === 'verified')
    .map(toExportItem), [achievements])

  // Structure Toggles
  const [template, setTemplate] = useState('ndmu_dossier') // 'ndmu_dossier' | 'modern_clean' | 'executive_1page'
  const [includeCoverPage, setIncludeCoverPage] = useState(true)
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true)
  const [includeCategorySeparators, setIncludeCategorySeparators] = useState(true)
  const [sortNewestFirst, setSortNewestFirst] = useState(true)

  // Track checked state per achievement ID
  const [selectedIds, setSelectedIds] = useState([])
  const idsKey = initialAchievements.map(item => item.id).join(',')
  useEffect(() => { setSelectedIds(initialAchievements.map(item => item.id)) }, [idsKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  const toggleItemSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  // Filter & sort achievements based on user checklist selection
  const activeAchievements = useMemo(() => {
    let filtered = initialAchievements.filter(a => selectedIds.includes(a.id))
    if (sortNewestFirst) {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
    } else {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
    }
    return filtered
  }, [initialAchievements, selectedIds, sortNewestFirst])

  // Group active achievements by category
  const achievementsByCategory = useMemo(() => {
    const groups = {}
    activeAchievements.forEach(item => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
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
      pages.push({ type: 'toc', title: 'Table of Contents & Executive Summary' })
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

      // Dedicated 1-Page Per Achievement
      achievementsByCategory[catName].forEach((item) => {
        pages.push({
          type: 'achievement',
          item,
          category: catName,
          title: item.title,
          pageNum: currentOverallPageNum
        })
        currentOverallPageNum++
      })
    })

    if (pages.length === 0) {
      pages.push({ type: 'cover', title: 'Cover Page' })
    }

    return pages
  }, [includeCoverPage, includeTableOfContents, includeCategorySeparators, achievementsByCategory])

  const totalPagesCount = pagesList.length
  const safePageIndex = Math.min(currentPageIndex, Math.max(0, totalPagesCount - 1))
  const activePage = pagesList[safePageIndex] || { type: 'cover', title: 'Cover Page' }

  const handlePrintPDF = () => {
    generatePortfolioPdf(`NDMU_Portfolio_${student?.student_id || ''}`)
  }

  // One renderer for the on-screen preview and the printed copy, so both always match.
  const renderPageBody = (page) => (
    <>
                {/* 1. COVER PAGE VIEW */}
                {page.type === 'cover' && (
                  <div className="h-full flex flex-col justify-between border-4 border-[#A9C6B1] p-6 rounded-xl relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-white">
                    
                    {/* Header Seal */}
                    <div className="text-center space-y-2 pt-2">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DCEBDD] text-amber-400 flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-400">
                        <ShieldCheck className="w-8 h-8" />
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
                        STUDENT ACCOMPLISHMENT PORTFOLIO DOSSIER
                      </h1>
                      <div className="w-20 h-1 bg-[#16834a] mx-auto rounded-full"></div>
                    </div>

                    {/* Student Info Footer Card */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center space-y-1">
                      <p className="text-xs font-extrabold text-slate-900">{student?.full_name || ''}</p>
                      <p className="text-[11px] text-slate-600 font-semibold">{student?.student_id || ''} • {student?.program || ''}</p>
                      <p className="text-[10px] text-slate-400 font-medium pt-0.5">Academic Year 2025–2026 • Verified via AchieveNest</p>
                    </div>
                  </div>
                )}

                {/* 2. TABLE OF CONTENTS VIEW */}
                {page.type === 'toc' && (
                  <div className="h-full flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between border-b-2 border-[#A9C6B1] pb-2 mb-3">
                        <div>
                          <h2 className="text-sm font-black text-[#064e2b] uppercase">Table of Contents & Executive Summary</h2>
                          <p className="text-[10px] text-slate-500 font-medium">Dynamically calculated from selected portfolio items</p>
                        </div>
                        <FileText className="w-5 h-5 text-[#16834a]" />
                      </div>

                      {/* Recalculated Executive Metrics Box */}
                      <div className="grid grid-cols-2 gap-2 bg-[#eef7f0] p-2.5 rounded-xl border border-[#cbe6d2] mb-3 text-center">
                        <div>
                          <p className="text-sm font-black text-[#064e2b]">{dynamicTotal}</p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase">Selected Items</p>
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#064e2b]">{dynamicVerified}</p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase">Verified Records</p>
                        </div>
                      </div>

                      {/* TOC Items Index List */}
                      <div className="space-y-1.5 text-[11px]">
                        {pagesList.filter(p => p.type === 'achievement').map((itemPage, idx) => (
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
                  <div className="h-full bg-[#DCEBDD] text-white p-6 rounded-xl flex flex-col justify-between relative overflow-hidden border-4 border-amber-400/80">
                    <div className="text-amber-400 font-black text-[10px] uppercase tracking-widest">Section Divider</div>

                    <div className="space-y-3 my-auto">
                      <div className="w-12 h-12 rounded-2xl bg-[#16834a] text-white flex items-center justify-center font-black text-xl shadow-lg border border-emerald-400/40">
                        <Award className="w-6 h-6" />
                      </div>
                      <h2 className="text-lg font-black tracking-tight uppercase leading-tight text-white">
                        SECTION {page.index}: {page.category?.toUpperCase()} ACHIEVEMENTS
                      </h2>
                      <p className="text-xs text-emerald-200/90 font-medium">
                        Official verified entries under {page.category} category
                      </p>
                    </div>

                    <div className="text-[9px] text-emerald-300/80 font-bold uppercase tracking-wider border-t border-emerald-800 pt-2">
                      Notre Dame of Marbel University • AchieveNest System
                    </div>
                  </div>
                )}

                {/* 4. DEDICATED SELF-CONTAINED 1-PAGE PER ACHIEVEMENT VIEW */}
                {page.type === 'achievement' && page.item && (
                  <div className="h-full flex flex-col justify-between space-y-2.5">
                    
                    {/* TOP STRIP */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-[#DCEBDD] text-amber-400 flex items-center justify-center font-black text-[10px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-wide">NDMU ACHIEVENEST VERIFIED DOSSIER</span>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-[#064e2b] border border-emerald-200">
                        {page.item.category}
                      </span>
                    </div>

                    {/* TOP 35-40% METADATA CONTAINER */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                      
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-black text-slate-900 leading-tight">{page.item.title}</h3>
                          <p className="text-[10px] text-slate-600 font-bold mt-0.5">{page.item.event_name}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#eef7f0] text-[#064e2b] text-[9px] font-extrabold border border-[#cbe6d2] shrink-0">
                          {page.item.status} ✓
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[9.5px] text-slate-600 pt-1 border-t border-slate-200/80 font-medium">
                        <div><strong>Issuer:</strong> {page.item.issuer || '—'}</div>
                        <div><strong>Date:</strong> {page.item.date || '—'}</div>
                        {page.item.academic_year && <div><strong>Academic year:</strong> {page.item.academic_year}</div>}
                        <div><strong>Status:</strong> Verified by the Program Coordinator</div>
                      </div>

                      <p className="text-[9px] text-slate-500 font-normal italic pt-1 border-t border-slate-200/60 truncate">
                        "{page.item.description}"
                      </p>
                    </div>

                    {/* BOTTOM 60-65% ATTACHED CERTIFICATE SCAN CONTAINER */}
                    <div className="flex-1 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 p-2 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
                      <div className="space-y-1 text-center text-[10px] text-slate-600">
                        <FileText className="mx-auto h-6 w-6 text-[#16834a]" />
                        <p className="font-bold">Supporting evidence on file</p>
                        {page.item.evidence.length === 0
                          ? <p>No evidence file listed.</p>
                          : page.item.evidence.map(file => <p key={file.id} className="truncate">{file.original_filename}</p>)}
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-bold flex items-center gap-1">
                        <QrCode className="w-3 h-3 text-amber-400" />
                        <span>Verified Digital Proof</span>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-semibold border-t pt-1">
                      <span>NDMU AchieveNest Official Dossier</span>
                      <span>Page {page.pageNum} of {totalPagesCount}</span>
                    </div>

                  </div>
                )}
    </>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-6xl h-[88vh] bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col text-slate-100">
        
        {/* TOP MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#DCEBDD] text-emerald-400 border border-emerald-600/40 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Portfolio PDF Export</h3>
              <p className="text-xs text-slate-400 font-medium">Preview your verified achievements, then save as PDF from the print dialog</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SPLIT-SCREEN WORKSPACE CANVAS */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* ================= LEFT PANEL (65%): LIVE MULTI-PAGE PREVIEW RENDERER ================= */}
          <div className="lg:col-span-8 bg-slate-950/70 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto border-r border-slate-800">
            
            {/* TOP PAGINATION CONTROLS BAR */}
            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-2xl border border-slate-800 mb-4 shrink-0 shadow-sm">
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPageIndex(Math.max(0, safePageIndex - 1))}
                  disabled={safePageIndex === 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <select
                  value={safePageIndex}
                  onChange={(e) => setCurrentPageIndex(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 px-3 py-1.5 rounded-xl outline-none focus:border-[#16834a] transition"
                >
                  {pagesList.map((p, idx) => (
                    <option key={idx} value={idx}>
                      Page {idx + 1} of {totalPagesCount}: {p.title?.length > 28 ? p.title.substring(0, 28) + '...' : p.title}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setCurrentPageIndex(Math.min(totalPagesCount - 1, safePageIndex + 1))}
                  disabled={safePageIndex === totalPagesCount - 1}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#DCEBDD] text-emerald-300 border border-emerald-600/40">
                Page {safePageIndex + 1} / {totalPagesCount}
              </span>
            </div>

            {/* LIVE PAPER PREVIEW CANVAS (FIXED HEIGHT 580px FOR GUARANTEED VISIBILITY) */}
            <div className="flex-1 overflow-y-auto flex items-center justify-center p-2 min-h-[580px]">
              
              <div 
                id="printable-portfolio-canvas"
                className="w-full max-w-[540px] h-[570px] bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden font-sans border border-slate-200 shrink-0"
              >
                
                {renderPageBody(activePage)}

              </div>

            </div>

          </div>

          {/* ================= RIGHT PANEL (35%): CUSTOMIZATION & CHECKLIST WORKSPACE ================= */}
          <div className="lg:col-span-4 bg-slate-900 p-5 flex flex-col justify-between overflow-y-auto space-y-6">
            
            <div className="space-y-6">
              
              {/* 1. TEMPLATE SELECTION DROPDOWN */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-emerald-400" />
                  <span>Dossier Template Style</span>
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#16834a] transition"
                >
                  <option value="ndmu_dossier">Official NDMU Dossier (Standard)</option>
                  <option value="modern_clean">Modern Clean Executive</option>
                  <option value="executive_1page">Executive Brief 1-Pager</option>
                </select>
              </div>

              {/* 2. DOCUMENT STRUCTURE TOGGLES */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Document Structure Options</span>
                </label>

                <div className="space-y-2 text-xs font-semibold text-slate-300">
                  
                  <button
                    type="button"
                    onClick={() => setIncludeCoverPage(!includeCoverPage)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition text-left cursor-pointer"
                  >
                    <span>Include Cover Page</span>
                    {includeCoverPage ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeTableOfContents(!includeTableOfContents)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition text-left cursor-pointer"
                  >
                    <span>Include Table of Contents</span>
                    {includeTableOfContents ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeCategorySeparators(!includeCategorySeparators)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition text-left cursor-pointer"
                  >
                    <span>Include Category Separators</span>
                    {includeCategorySeparators ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortNewestFirst(!sortNewestFirst)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition text-left cursor-pointer"
                  >
                    <span>Sort Chronologically (Newest First)</span>
                    {sortNewestFirst ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                  </button>

                </div>
              </div>

              {/* 3. SELECTABLE ACHIEVEMENTS CHECKLIST */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-300 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span>Select Achievements to Include</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-400">
                    {selectedIds.length} of {initialAchievements.length}
                  </span>
                </div>

                <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                  {initialAchievements.map((item) => {
                    const isChecked = selectedIds.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItemSelection(item.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                          isChecked 
                            ? 'bg-slate-800/90 border-emerald-600/50 text-white' 
                            : 'bg-slate-950/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate leading-tight">{item.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.category} • {item.date}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* DYNAMIC ACTION BUTTON FOOTER */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handlePrintPDF}
                className="w-full py-3 px-4 rounded-2xl bg-[#16834a] hover:bg-[#236e3e] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Download Portfolio PDF ({totalPagesCount} Pages)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-white font-semibold text-xs transition text-center cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>

        </div>

      </div>
      {typeof document !== 'undefined' && createPortal(
        <div className="print-area print-show student-portfolio-print" style={{ display: 'none' }} aria-hidden="true">
          <style>{`@media print { @page { size: A4; margin: 12mm; } .student-portfolio-print-page { break-after: page; page-break-after: always; min-height: 260mm; display: flex; flex-direction: column; justify-content: space-between; } .student-portfolio-print-page:last-child { break-after: auto; page-break-after: auto; } }`}</style>
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
