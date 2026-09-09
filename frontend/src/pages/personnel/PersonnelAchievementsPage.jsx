import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PersonnelSubmissionModal from './modals/PersonnelSubmissionModal'
import RichAchievementSearchBar from './RichAchievementSearchBar'
import AchievementPopoverMenu from './AchievementPopoverMenu'
import AchievementPreviewModal from './modals/AchievementPreviewModal'
import usePersonnelAchievements from '../../hooks/usePersonnelAchievements'
import personnelAccomplishmentService from '../../services/personnelAccomplishmentService'
import {
  Trophy,
  Plus,
  Download,
  Filter,
  LayoutGrid,
  List,
  GraduationCap,
  Users,
  Heart,
  Award,
  MoreVertical,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  BookOpen,
  Star,
  ExternalLink,
  Briefcase,
  Scan,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { getCurrentUser } from '../../services/authService'

export default function PersonnelAchievementsPage({ currentUser }) {
  const navigate = useNavigate()
  const user = currentUser || getCurrentUser() || {
    full_name: 'Dr. Maria Santos',
    employee_id: 'EMP-2021-0842',
    personnel_classification: 'academic', college_code: 'CEAC', program_affiliations: [{ code: 'BSCS' }]
  }

  const location = useLocation()

  // Use custom MVC bridge hook
  const {
    achievements,
    loading,
    error,
    refreshAchievements,
    filteredAchievements,
    searchSuggestions,
    stats,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    previewItem,
    setPreviewItem,
    popoverState,
    setPopoverState,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    toggleFavorite,
    attachToPortfolio
  } = usePersonnelAchievements()

  // Submission & Edit Modals State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [initialModalCategory, setInitialModalCategory] = useState('')

  useEffect(() => {
    if (location.state?.openSubmissionModal) {
      setIsSubmitOpen(true)
      if (location.state?.initialCategory) {
        setInitialModalCategory(location.state.initialCategory)
      }
    }
    if (location.state?.selectedCategory) {
      setSelectedCategory(location.state.selectedCategory)
    }
  }, [location.state, setSelectedCategory])

  // Grouped NDMU Rating Sheet Categories
  const categoryGroups = [
    {
      area: 'Area A: Professional Development',
      badge: '70 Max Pts',
      items: [
        { name: 'Degrees & Orgs', icon: GraduationCap, label: 'Degrees & Orgs' },
        { name: 'Seminars & Trainings', icon: Users, label: 'Seminars & Trainings' }
      ]
    },
    {
      area: 'Area B: Productivity & Creative Work',
      badge: '50 Max Pts',
      items: [
        { name: 'Lectures & Publications', icon: BookOpen, label: 'Lectures & Publications' },
        { name: 'Research & Awards', icon: Award, label: 'Research & Awards' },
        { name: 'Instructional Materials', icon: FileCheck, label: 'Instructional Materials' }
      ]
    },
    {
      area: 'Area C: Service & Leadership',
      badge: '40 Max Pts',
      items: [
        { name: 'Service & Community', icon: Heart, label: 'Service & Community' }
      ]
    }
  ]

  // Add new achievement handler (async backend upload)
  const handleAddNewAchievement = async (newEntry, file = null) => {
    if (editingItem) {
      updateAchievement(editingItem.id, newEntry)
      setEditingItem(null)
    } else {
      await addAchievement(newEntry, file)
    }
  }

  // Real authenticated file download helper
  const handleDownloadProof = async (item) => {
    const filename = item.attached_file_name || 'proof_document.pdf'
    if (item.evidence_id) {
      try {
        await personnelAccomplishmentService.downloadEvidenceBlob(item.evidence_id, filename)
      } catch (err) {
        console.error('Evidence download failed:', err)
        alert('Failed to stream evidence from server: ' + (err?.message || 'File not found'))
      }
    } else {
      alert(`No physical proof document was found on the server for "${item.title}".`)
    }
  }

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Issuing Institution', 'Category', 'Date', 'Status', 'Portfolio Status']
    const rows = achievements.map(a => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.location}"`,
      `"${a.category}"`,
      `"${a.date}"`,
      `"${a.status}"`,
      `"${a.portfolio_status || 'Available'}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `AchieveNest_Personnel_Accomplishments_${user.employee_id || 'Santos'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Open popover menu anchored at mouse coordinates
  const handleOpenPopover = (e, item) => {
    e.stopPropagation()
    const targetElement = e.currentTarget
    const rect = targetElement.getBoundingClientRect()
    setPopoverState({
      id: item.id,
      targetElement,
      x: rect.left + rect.width / 2,
      y: rect.bottom
    })
  }

  const activePopoverItem = achievements.find(a => a.id === popoverState.id)

  return (
    <div className="space-y-6 font-sans">

      {/* ================= 1. HEADER TITLE BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Achievements</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Log and manage your official accomplishment records. Consolidate proof documents for inclusion in your annual NDMU evaluation portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#E7F3E9] border border-[#cbe6d2] text-[#16834a] text-xs font-bold flex items-center gap-2 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => { setEditingItem(null); setIsSubmitOpen(true) }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#064e2b] text-xs font-extrabold flex items-center gap-2 transition shadow-2xs cursor-pointer"
            title="Upload certificate file and let AchieveNest OCR automatically detect category and fill details"
          >
            <Scan className="w-4 h-4 text-[#16834a]" />
            <span>Scan Certificate</span>
          </button>

          <button
            type="button"
            onClick={() => { setEditingItem(null); setIsSubmitOpen(true) }}
            className="px-4.5 py-2.5 rounded-2xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Achievement</span>
          </button>
        </div>
      </div>

      {/* ================= 2. STAT PILLS ROW ================= */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => { setSelectedCategory('All'); setSelectedStatus('All') }}
          className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            selectedCategory === 'All' && selectedStatus === 'All'
              ? 'bg-white border-[#16834a] text-slate-900 ring-2 ring-[#16834a]/20 shadow-xs'
              : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#16834a]"></span>
          <span><strong className="text-slate-900">{stats.total}</strong> Total Logged</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Verified')}
          className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            selectedStatus === 'Verified'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300/40 shadow-xs'
              : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span><strong className="text-emerald-900">{stats.verified}</strong> Verified in Portfolio</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Pending Review')}
          className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            selectedStatus === 'Pending Review'
              ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-300/40 shadow-xs'
              : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span><strong className="text-amber-900">{stats.pending}</strong> Pending Review</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Returned')}
          className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            selectedStatus === 'Returned'
              ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-300/40 shadow-xs'
              : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span><strong className="text-rose-900">{stats.returned}</strong> Returned</span>
        </button>
      </div>

      {/* ================= 3. SEARCH & CONTROLS TOOLBAR ================= */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Rich Auto-Suggest Search Bar */}
        <div className="w-full md:max-w-md">
          <RichAchievementSearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            suggestions={searchSuggestions}
            onSelectSuggestion={(val) => setSearchTerm(val)}
          />
        </div>

        {/* View Switcher & Sorting */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 outline-hidden focus:ring-2 focus:ring-[#16834a]/20 focus:border-[#16834a] cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="title">Sort: Title A-Z</option>
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= 4. MAIN TWO-COLUMN CONTENT AREA ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* LEFT COLUMN: CARDS LIST / GRID (3/4 Width) */}
        <div className="lg:col-span-3 space-y-4">

          {loading ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#16834a]" />
              <p className="text-xs font-bold text-slate-600">Loading achievements from database...</p>
            </div>
          ) : filteredAchievements.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No accomplishments found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No records match your selected filter. Click "Add Achievement" to log a new accomplishment.
              </p>
              <button
                type="button"
                onClick={() => { setEditingItem(null); setIsSubmitOpen(true) }}
                className="px-4 py-2 rounded-2xl bg-[#16834a] text-white text-xs font-bold hover:bg-[#236e3e] transition cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Record</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (

            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAchievements.map((item) => {
                const isReturned = item.status === 'Returned'
                const isVerified = item.status === 'Verified'

                return (
                  <div
                    key={item.id}
                    onClick={() => setPreviewItem(item)}
                    className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-[#16834a] hover:shadow-md transition space-y-4 cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Category Badge & Popover Menu */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#16834a] bg-[#E7F3E9] px-2.5 py-0.5 rounded-full border border-[#cbe6d2]">
                          {item.category}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(item.id)
                            }}
                            className={`p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer ${
                              item.is_favorited ? 'text-amber-400' : 'text-slate-300 hover:text-slate-500'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${item.is_favorited ? 'fill-amber-400' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenPopover(e, item)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Issuer */}
                      <div>
                        <h3 className="text-sm font-black text-slate-900 leading-snug group-hover:text-[#16834a] transition line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium truncate">
                          {item.location}
                        </p>
                      </div>

                      {/* Status & Date */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400 font-medium text-[11px]">{item.date}</span>

                        {isVerified && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        )}
                        {!isVerified && !isReturned && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-extrabold flex items-center gap-1 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                          </span>
                        )}
                        {isReturned && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[11px] font-extrabold flex items-center gap-1 border border-rose-200">
                            <RotateCcw className="w-3 h-3 text-rose-600" /> Returned
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Portfolio Status */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate max-w-[170px] font-medium flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {item.portfolio_name || 'Not attached to portfolio'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadProof(item)
                        }}
                        className="text-[#16834a] hover:text-[#064e2b] font-bold flex items-center gap-1 cursor-pointer transition"
                        title="Download authenticated proof"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Proof</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

          ) : (

            /* LIST VIEW */
            <div className="space-y-3">
              {filteredAchievements.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setPreviewItem(item)}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#16834a] transition flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#E7F3E9] border border-[#cbe6d2] text-[#16834a] flex items-center justify-center shrink-0 font-bold">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#16834a] transition truncate">{item.title}</h3>
                      <p className="text-xs text-slate-400 truncate">{item.location} • {item.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                      {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadProof(item)
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-[#16834a] transition cursor-pointer"
                      title="Download Evidence"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleOpenPopover(e, item)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          )}

          {/* Pagination Footer */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong>1-{filteredAchievements.length}</strong> of <strong>{stats.total}</strong> achievements</span>
            <div className="flex items-center gap-1">
              <button disabled className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#16834a] text-white font-bold flex items-center justify-center shadow-2xs">
                1
              </button>
              <button disabled className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SIDEBAR WIDGETS (1/4 Width) */}
        <div className="space-y-5">

          {/* Widget 1: "By Category" List */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#16834a]" />
              <span>By Category</span>
            </h2>

            <div className="space-y-4 pt-1">
              {categoryGroups.map((group) => (
                <div key={group.area} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 uppercase tracking-wider px-1">
                    <span>{group.area}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{group.badge}</span>
                  </div>

                  <div className="space-y-1">
                    {group.items.map((cat) => {
                      const CatIcon = cat.icon
                      const count = achievements.filter(a =>
                        a.category === cat.name ||
                        (cat.name === 'Degrees & Orgs' && (a.category.includes('A.1') || a.category.includes('A.2') || a.category.includes('Degree') || a.category.includes('Membership'))) ||
                        (cat.name === 'Seminars & Trainings' && (a.category.includes('A.3') || a.category.includes('Seminar') || a.category.includes('Training'))) ||
                        (cat.name === 'Lectures & Publications' && (a.category.includes('B.1') || a.category.includes('B.2') || a.category.includes('Publication') || a.category.includes('Lecturer'))) ||
                        (cat.name === 'Research & Awards' && (a.category.includes('B.3') || a.category.includes('B.4') || a.category.includes('Research') || a.category.includes('Award'))) ||
                        (cat.name === 'Instructional Materials' && (a.category.includes('B.5') || a.category.includes('B.6') || a.category.includes('Instructional') || a.category.includes('Material'))) ||
                        (cat.name === 'Service & Community' && (a.category.includes('C.') || a.category.includes('Service') || a.category.includes('Community')))
                      ).length

                      const isSelected = selectedCategory === cat.name

                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setSelectedCategory(isSelected ? 'All' : cat.name)}
                          className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#E7F3E9] text-[#064e2b] font-bold border border-[#cbe6d2]'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <CatIcon className="w-4 h-4 text-[#16834a]" />
                            <span>{cat.name}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSelected ? 'bg-[#16834a] text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: Portfolio Consolidation Tip */}
          <div className="bg-[#E7F3E9]/60 rounded-3xl p-5 border border-[#cbe6d2] space-y-3 text-xs">
            <div className="flex items-center gap-2 text-[#064e2b] font-extrabold">
              <Briefcase className="w-4 h-4 text-[#16834a]" />
              <span>Annual Ranking Tip</span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Log individual accomplishments here to build your proof library. To submit for evaluation, attach items to your <strong>AY 2025-2026 Evaluation Portfolio</strong> package.
            </p>

            <div className="pt-2 border-t border-[#cbe6d2]">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Accepted Proof Formats</p>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#cbe6d2] text-[10px] font-bold text-slate-700">PDF</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#cbe6d2] text-[10px] font-bold text-slate-700">JPG</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#cbe6d2] text-[10px] font-bold text-slate-700">PNG</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* THREE-DOT POPOVER OPTIONS MENU */}
      {popoverState.id && (
        <AchievementPopoverMenu
          achievement={activePopoverItem}
          targetElement={popoverState.targetElement}
          position={popoverState}
          onClose={() => setPopoverState({ id: null, x: 0, y: 0 })}
          onOpenPreview={(item) => setPreviewItem(item)}
          onEdit={(item) => {
            setEditingItem(item)
            setIsSubmitOpen(true)
          }}
          onDownload={handleDownloadProof}
          onResubmit={(item) => {
            setEditingItem(item)
            setIsSubmitOpen(true)
          }}
          onAttachPortfolio={attachToPortfolio}
          onDelete={deleteAchievement}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* DUAL-PANE LIGHTBOX PREVIEW MODAL */}
      <AchievementPreviewModal
        isOpen={Boolean(previewItem)}
        achievement={previewItem}
        onClose={() => setPreviewItem(null)}
        onEdit={(item) => {
          setEditingItem(item)
          setIsSubmitOpen(true)
        }}
        onDownload={handleDownloadProof}
        onResubmit={(item) => {
          setEditingItem(item)
          setIsSubmitOpen(true)
        }}
      />

      {/* PERSONNEL SUBMISSION & EDIT MODAL */}
      <PersonnelSubmissionModal
        isOpen={isSubmitOpen}
        onClose={() => { setIsSubmitOpen(false); setEditingItem(null) }}
        onSubmitAccomplishment={handleAddNewAchievement}
        initialCategory={initialModalCategory}
        editingItem={editingItem}
      />
    </div>
  )
}
