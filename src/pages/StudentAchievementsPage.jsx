import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AchievementSubmissionModal from '../components/student/AchievementSubmissionModal'
import StudentAchievementPopoverMenu from '../components/student/StudentAchievementPopoverMenu'
import StudentAchievementPreviewModal from '../components/student/StudentAchievementPreviewModal'
import useStudentAchievements from '../hooks/useStudentAchievements'
import { 
  Trophy, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  GraduationCap, 
  Users, 
  Heart, 
  Award, 
  Briefcase, 
  Star, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  RotateCcw,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react'

export default function StudentAchievementsPage({ currentUser }) {
  const user = currentUser || { full_name: 'Maria Santos', student_id: 'STU-2024-01234', program: 'BS Information Technology' }
  const location = useLocation()

  // Use custom Student Achievements MVC bridge hook
  const {
    achievements,
    filteredAchievements,
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
    popoverState,
    handleOpenPopover,
    handleClosePopover,
    previewItem,
    setPreviewItem,
    addAchievement,
    updateAchievement,
    resubmitAchievement,
    deleteAchievement,
    toggleFavorite,
    toggleAttachPortfolio
  } = useStudentAchievements()

  // Modal State Controls
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    if (location.state?.openSubmissionModal) {
      setIsSubmitOpen(true)
    }
    if (location.state?.selectedCategory) {
      setSelectedCategory(location.state.selectedCategory)
    }
    if (location.state?.filterStatus) {
      setSelectedStatus(location.state.filterStatus)
    }
    if (location.state?.highlightId) {
      const targetItem = achievements.find(a => a.id === location.state.highlightId)
      if (targetItem) {
        setPreviewItem(targetItem)
      }
    }
  }, [location.state, setSelectedCategory, setSelectedStatus, achievements, setPreviewItem])

  // Category definitions & icons mapping
  const categoryDefs = [
    { name: 'Academic', icon: GraduationCap },
    { name: 'Leadership', icon: Users },
    { name: 'Community', icon: Heart },
    { name: 'Sports', icon: Award },
    { name: 'Recognition', icon: Star },
    { name: 'Professional Development', icon: Briefcase }
  ]

  const getCategoryIcon = (catName) => {
    const found = categoryDefs.find(c => c.name === catName)
    return found ? found.icon : Trophy
  }

  // Submission / Edit / Resubmit Handler
  const handleSubmitAchievement = (formData) => {
    if (editingItem) {
      if (editingItem.status === 'Returned') {
        resubmitAchievement(editingItem.id, formData)
      } else {
        updateAchievement(editingItem.id, formData)
      }
      setEditingItem(null)
    } else {
      addAchievement(formData)
    }
    setIsSubmitOpen(false)
  }

  // Simulated Proof File Download Helper
  const handleDownloadProof = (item) => {
    const filename = item.attached_file_name || 'student_achievement_proof.pdf'
    const content = `NDMU Student Achievement Proof Record\n------------------------------------\nStudent: ${user.full_name} (${user.student_id})\nTitle: ${item.title}\nCategory: ${item.category}\nDate: ${item.date}\nIssuer/Location: ${item.location}\nVerification Status: ${item.status}\nReference ID: REF-${String(item.id).toUpperCase()}`
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Date', 'Status', 'Location', 'Description', 'Favorited', 'In Portfolio']
    const rows = filteredAchievements.map(a => [
      `"REF-${String(a.id).toUpperCase()}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.date}"`,
      `"${a.status}"`,
      `"${a.location}"`,
      `"${(a.description || '').replace(/"/g, '""')}"`,
      `"${a.is_favorited ? 'Yes' : 'No'}"`,
      `"${a.portfolio_id ? 'Yes' : 'No'}"`
    ])
    
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `AchieveNest_Student_Achievements_${user.student_id}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalCount = stats.total

  return (
    <MainLayout currentUser={user}>
      <div className="space-y-6 pb-12">
        
        {/* ================= 1. PAGE HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Achievements</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              View, manage, and track your co-curricular and academic achievements. Attach supporting documents for verification by your program coordinator.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => { setEditingItem(null); setIsSubmitOpen(true) }}
              className="px-4 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Achievement</span>
            </button>
          </div>
        </div>

        {/* ================= 2. METRICS BANNER ================= */}
        <div className="bg-[#2d8a4e] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-extrabold tracking-wider uppercase">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Co-Curricular Student Record</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">Student Achievements Overview</h2>
            <p className="text-xs text-emerald-100/90 font-medium max-w-xl">
              Track verified accomplishments, submit document proofs for coordinator review, and highlight key achievements in your student portfolio.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[100px]">
              <span className="block text-xl font-black text-white">{stats.total}</span>
              <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Total</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[100px]">
              <span className="block text-xl font-black text-amber-300">{stats.verified}</span>
              <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Verified</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[100px]">
              <span className="block text-xl font-black text-emerald-200">{stats.pending}</span>
              <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Pending</span>
            </div>
          </div>
        </div>

        {/* ================= 3. FILTER BAR & CONTROLS ================= */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search achievements..."
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]"
              />
            </div>

            {/* Controls Right */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end text-xs">
              
              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]"
              >
                <option value="All">All Categories</option>
                {categoryDefs.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]"
              >
                <option value="All">All Statuses</option>
                <option value="Verified">Verified</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Returned">Returned</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d8a4e]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-white text-[#2d8a4e] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-white text-[#2d8a4e] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ================= 4. MAIN CONTENT GRID (3/4 + 1/4) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT COLUMN: ACHIEVEMENTS CARDS (3/4 Width) */}
          <div className="lg:col-span-3 space-y-4">
            
            {filteredAchievements.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-extrabold text-slate-800 text-base">No achievements found</p>
                <p className="text-xs text-slate-400">Try adjusting your search query or category filters.</p>
              </div>
            ) : viewMode === 'grid' ? (
              
              /* GRID VIEW MATCHING DESIGN PARITY */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredAchievements.map((item) => {
                  const CategoryIcon = getCategoryIcon(item.category)
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPreviewItem(item)}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group cursor-pointer relative"
                    >
                      {/* Green Certificate Banner Top Graphic */}
                      <div className="bg-[#2d8a4e] h-32 p-4 flex flex-col items-center justify-center text-white relative">
                        
                        {/* Hover Action Buttons Top Right (Favorite Star & 3-Dot Menu) */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition z-10">
                          {/* Favorite Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id) }}
                            className={`p-1.5 rounded-full backdrop-blur-md transition cursor-pointer ${
                              item.is_favorited ? 'bg-amber-400 text-slate-900 shadow-sm' : 'bg-white/20 hover:bg-white/30 text-white'
                            }`}
                            title={item.is_favorited ? 'Unfavorite' : 'Favorite'}
                          >
                            <Star className={`w-3.5 h-3.5 ${item.is_favorited ? 'fill-slate-900' : ''}`} />
                          </button>

                          {/* 3-Dot Options Button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenPopover(e, item)}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition cursor-pointer shadow-sm"
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <CategoryIcon className="w-7 h-7 text-amber-300 mb-1" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-emerald-100">CERTIFICATE PROOF</span>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {/* Category Tag & Portfolio Link Indicator */}
                          <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] text-[10px] font-bold">
                              {item.category}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[140px]">
                              {item.portfolio_status || 'Available'}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#2d8a4e] transition leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium mt-1">{item.location}</p>
                        </div>

                        {/* Card Bottom Row: Date & Status Pill */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                          <span className="text-slate-400 text-[11px] font-medium">{item.date}</span>
                          
                          {item.status === 'Verified' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#eef7f0] text-[#1e5831] border border-[#cbe6d2] text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#2d8a4e]" /> Verified
                            </span>
                          )}
                          {(item.status === 'Pending Review' || item.status === 'Pending') && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                            </span>
                          )}
                          {item.status === 'Returned' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 text-rose-600" /> Returned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

            ) : (

              /* LIST VIEW */
              <div className="space-y-3">
                {filteredAchievements.map((item) => {
                  const CategoryIcon = getCategoryIcon(item.category)
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPreviewItem(item)}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#2d8a4e] transition flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] flex items-center justify-center shrink-0">
                          <CategoryIcon className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#2d8a4e] transition truncate">{item.title}</h3>
                          <p className="text-xs text-slate-400">{item.location} • {item.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                          {item.category}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{item.status}</span>

                        <button
                          type="button"
                          onClick={(e) => handleOpenPopover(e, item)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

            )}

            {/* Pagination Footer */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Showing <strong>1-{filteredAchievements.length}</strong> of <strong>{totalCount}</strong> achievements</span>
              <div className="flex items-center gap-1">
                <button disabled className="p-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-7 h-7 rounded-lg bg-[#2d8a4e] text-white font-bold flex items-center justify-center shadow-2xs">
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
            
            {/* Widget 1: "By Category" Filter List */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#2d8a4e]" />
                <span>By Category</span>
              </h2>

              <div className="space-y-1 pt-1">
                {categoryDefs.map(cat => {
                  const CatIcon = cat.icon
                  const count = achievements.filter(a => a.category === cat.name).length
                  const isSelected = selectedCategory === cat.name

                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? 'All' : cat.name)}
                      className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        isSelected 
                          ? 'bg-[#eef7f0] text-[#1e5831] font-bold border border-[#cbe6d2]' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CatIcon className="w-4 h-4 text-[#2d8a4e]" />
                        <span>{cat.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-[#2d8a4e] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Widget 2: "Upload Tips" Box */}
            <div className="bg-[#eef7f0]/60 rounded-3xl p-5 border border-[#cbe6d2] space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#1e5831] font-extrabold">
                <Info className="w-4 h-4 text-[#2d8a4e]" />
                <span>Upload & Verification Tips</span>
              </div>

              <ul className="space-y-2 text-slate-600 text-[11px] leading-relaxed list-disc pl-4">
                <li>Upload supporting proof documents for faster verification by your Program Coordinator.</li>
                <li>Ensure attached certificates are clear, legible, and include official signatures.</li>
                <li>Check comments if your submission status is marked as <strong>Returned</strong>.</li>
              </ul>

              <div className="pt-2 border-t border-[#cbe6d2]">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Accepted File Formats</p>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#cbe6d2] text-[10px] font-bold text-slate-700">PDF</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#cbe6d2] text-[10px] font-bold text-slate-700">JPG</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#cbe6d2] text-[10px] font-bold text-slate-700">PNG</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3-Dot Options Popover Dropdown */}
      <StudentAchievementPopoverMenu
        achievement={popoverState.achievement}
        targetElement={popoverState.targetElement}
        position={popoverState.position}
        onClose={handleClosePopover}
        onOpenPreview={setPreviewItem}
        onEdit={(item) => { setEditingItem(item); setIsSubmitOpen(true) }}
        onDownload={handleDownloadProof}
        onResubmit={(item) => { setEditingItem(item); setIsSubmitOpen(true) }}
        onAttachPortfolio={toggleAttachPortfolio}
        onDelete={deleteAchievement}
        onToggleFavorite={toggleFavorite}
      />

      {/* Student Achievement Full Preview Modal */}
      <StudentAchievementPreviewModal
        achievement={previewItem}
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        onEdit={(item) => { setEditingItem(item); setIsSubmitOpen(true) }}
        onDownload={handleDownloadProof}
        onResubmit={(item) => { setEditingItem(item); setIsSubmitOpen(true) }}
        onAttachPortfolio={toggleAttachPortfolio}
      />

      {/* Achievement Submission & Edit Modal */}
      <AchievementSubmissionModal
        isOpen={isSubmitOpen}
        onClose={() => { setIsSubmitOpen(false); setEditingItem(null) }}
        onSubmitAchievement={handleSubmitAchievement}
        initialData={editingItem}
      />
    </MainLayout>
  )
}
