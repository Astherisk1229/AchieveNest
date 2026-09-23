import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Folder,
  Calendar,
  Clock,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Eye,
  Edit3,
  Download,
  Search,
  Filter,
  Layers,
  History,
  BookOpen
} from 'lucide-react'

export default function PersonnelPortfolioGallery({
  portfolio,
  latestSubmission,
  submissionHistory = [],
  activeAcademicYear = 'AY 2026-2027',
  onOpenBooklet,
  onOpenFeedback
}) {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('ALL') // 'ALL' | 'DRAFT' | 'SUBMITTED' | 'FINALIZED'
  const [searchQuery, setSearchQuery] = useState('')

  // Build unified list of academic-year portfolio cards
  const portfolioCards = useMemo(() => {
    const cards = []

    // 1. Current Working Portfolio Draft / Active Submission
    const currentItemsCount = (portfolio?.area_a_items?.length || 0) +
      (portfolio?.area_b_items?.length || 0) +
      (portfolio?.area_c_items?.length || 0)

    const rawCurrentStatus = latestSubmission?.status || portfolio?.status || 'draft'
    const normalizedCurrentStatus = rawCurrentStatus.toLowerCase()

    // Determine current AY
    const currentAY = latestSubmission?.academic_year || portfolio?.academic_year || activeAcademicYear

    // Add current cycle card
    cards.push({
      id: latestSubmission?.id || 'current_draft',
      academic_year: currentAY,
      version_number: latestSubmission?.version_number || 1,
      status: rawCurrentStatus.toUpperCase(),
      normalizedStatus: normalizedCurrentStatus,
      is_current: true,
      items_count: latestSubmission?.items_count || currentItemsCount,
      submitted_at: latestSubmission?.submitted_at || null,
      updated_at: latestSubmission?.updated_at || portfolio?.updated_at || new Date().toISOString(),
      return_reason: latestSubmission?.return_reason || null,
      raw_snapshot: latestSubmission
    })

    // 2. Historical Submissions from version history
    if (Array.isArray(submissionHistory)) {
      submissionHistory.forEach((hist) => {
        // Avoid duplicate of current latest submission
        if (hist.id === latestSubmission?.id) return

        const histAY = hist.academic_year || `AY ${2026 - (hist.version_number || 1)}-${2027 - (hist.version_number || 1)}`
        const histStatus = (hist.status || 'SUBMITTED').toLowerCase()

        cards.push({
          id: hist.id,
          academic_year: histAY,
          version_number: hist.version_number || 1,
          status: (hist.status || 'SUBMITTED').toUpperCase(),
          normalizedStatus: histStatus,
          is_current: false,
          items_count: hist.items_count || (Array.isArray(hist.items) ? hist.items.length : 0),
          submitted_at: hist.submitted_at || hist.created_at,
          updated_at: hist.updated_at || hist.created_at,
          return_reason: hist.return_reason || null,
          raw_snapshot: hist
        })
      })
    }

    // Sort newest academic year & highest version first
    return cards.sort((a, b) => {
      const yearA = parseInt(a.academic_year.replace(/\D/g, '').substring(0, 4) || '0', 10)
      const yearB = parseInt(b.academic_year.replace(/\D/g, '').substring(0, 4) || '0', 10)
      if (yearA !== yearB) return yearB - yearA
      return (b.version_number || 1) - (a.version_number || 1)
    })
  }, [portfolio, latestSubmission, submissionHistory, activeAcademicYear])

  // Filter & Search
  const filteredCards = useMemo(() => {
    return portfolioCards.filter((card) => {
      // Status filter
      if (filterStatus === 'DRAFT' && card.normalizedStatus !== 'draft') return false
      if (filterStatus === 'SUBMITTED' && !['submitted', 'in_evaluation', 'submitted_to_dep_sec', 'endorsed_to_hr'].includes(card.normalizedStatus)) return false
      if (filterStatus === 'FINALIZED' && !['completed', 'finalized', 'hr_approved'].includes(card.normalizedStatus)) return false

      // Search query filter (matches academic year or status)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchAY = card.academic_year.toLowerCase().includes(q)
        const matchStatus = card.status.toLowerCase().includes(q)
        if (!matchAY && !matchStatus) return false
      }

      return true
    })
  }, [portfolioCards, filterStatus, searchQuery])

  // Helper for status badge styling
  const getStatusBadge = (statusStr) => {
    const s = (statusStr || '').toLowerCase()
    if (s === 'draft') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          Draft
        </span>
      )
    }
    if (s === 'submitted' || s === 'in_evaluation' || s === 'submitted_to_dep_sec') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          Submitted
        </span>
      )
    }
    if (s === 'returned_for_revision' || s === 'returned_to_personnel') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          Revision Requested
        </span>
      )
    }
    if (s === 'completed' || s === 'finalized' || s === 'hr_approved') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          Finalized
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {statusStr}
      </span>
    )
  }

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Not yet submitted'
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return isoStr
    }
  }

  return (
    <div className="space-y-6 font-sans">

      {/* ================= SECTION HEADER & FILTER BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#16834a] dark:text-emerald-400" />
            <span>Academic-Year Portfolios</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Gallery archive of active working cycles and historical submitted portfolios.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'DRAFT', 'SUBMITTED', 'FINALIZED'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === status
                  ? 'bg-[#16834a] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'ALL' ? 'All Portfolios' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search portfolios by academic year (e.g. 2026-2027)..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#16834a]"
        />
      </div>

      {/* ================= GALLERY CARDS GRID ================= */}
      {filteredCards.length === 0 ? (
        <div className="p-10 sm:p-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Folder className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">No portfolio submissions yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Your academic-year portfolios will appear here after you begin building and submitting them.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/personnel/portfolio/edit')}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16834a] hover:bg-[#11693b] text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Open Current Working Portfolio</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCards.map((card) => {
            const isDraft = card.normalizedStatus === 'draft'
            const isReturned = card.normalizedStatus === 'returned_for_revision' || card.normalizedStatus === 'returned_to_personnel'
            const isFinalized = card.normalizedStatus === 'completed' || card.normalizedStatus === 'finalized' || card.normalizedStatus === 'hr_approved'
            const isSubmitted = !isDraft && !isReturned && !isFinalized

            return (
              <div
                key={card.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {/* Top Banner Accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isDraft
                      ? 'bg-amber-500'
                      : isReturned
                      ? 'bg-rose-500'
                      : isFinalized
                      ? 'bg-emerald-500'
                      : 'bg-blue-600'
                  }`}
                />

                {/* Card Header */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400" />
                      <span>{card.academic_year}</span>
                    </span>
                    {getStatusBadge(card.status)}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {card.is_current ? 'Active Annual Portfolio' : `Historical Version v${card.version_number}`}
                  </div>
                </div>

                {/* Card Metrics Summary */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Achievements</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{card.items_count} recorded</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">
                      {isDraft ? 'Last Edited' : 'Submitted'}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white truncate block">
                      {isDraft ? formatDate(card.updated_at) : formatDate(card.submitted_at)}
                    </span>
                  </div>
                </div>

                {/* Return reason alert if applicable */}
                {isReturned && card.return_reason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-[11px] font-medium flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                    <span className="line-clamp-2">{card.return_reason}</span>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  {isDraft && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate('/personnel/portfolio/edit')}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#16834a] hover:bg-[#11693b] text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Continue Editing</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenBooklet && onOpenBooklet(card)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        title="Preview Booklet"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {isReturned && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate('/personnel/portfolio/edit')}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Revise Portfolio</span>
                      </button>
                      {onOpenFeedback && (
                        <button
                          type="button"
                          onClick={() => onOpenFeedback(card)}
                          className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                        >
                          Feedback
                        </button>
                      )}
                    </>
                  )}

                  {(isSubmitted || isFinalized) && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenBooklet && onOpenBooklet(card)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#245F42] hover:bg-[#1B4731] text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                        <span>View Portfolio</span>
                      </button>
                      {isFinalized && (
                        <button
                          type="button"
                          onClick={() => onOpenBooklet && onOpenBooklet(card)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                          title="Export PDF / Certificate"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
