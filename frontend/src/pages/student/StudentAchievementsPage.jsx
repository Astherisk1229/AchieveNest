import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AchievementSubmissionModal from './modals/AchievementSubmissionModal'
import StudentAchievementPopoverMenu from './StudentAchievementPopoverMenu'
import StudentAchievementPreviewModal from './modals/StudentAchievementPreviewModal'
import useStudentAchievements from '../../hooks/useStudentAchievements'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectItem } from '../../components/ui/select'
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
    <>
      <div className="space-y-6 pb-12 font-sans">
        
        {/* ================= 1. PAGE HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Achievements</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              View, manage, and track your co-curricular and academic achievements. Attach supporting documents for verification by your program coordinator.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="gap-2 cursor-pointer shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs rounded-xl"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </Button>

            <Button
              onClick={() => { setEditingItem(null); setIsSubmitOpen(true) }}
              className="bg-[#1b4332] hover:bg-[#143823] text-white gap-2 cursor-pointer shadow-sm font-bold text-xs rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Add Achievement</span>
            </Button>
          </div>
        </div>

        {/* ================= 2. METRICS BANNER ================= */}
        <div className="bg-[#1b4332] dark:bg-[#0a2417] rounded-2xl p-6 text-white border border-[#245233] dark:border-emerald-900/60 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-extrabold tracking-wider uppercase">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Co-Curricular Student Record</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Student Achievements Overview</h2>
            <p className="text-xs text-emerald-100/90 font-medium max-w-xl">
              Track verified accomplishments, submit document proofs for coordinator review, and highlight key achievements in your student portfolio.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0">
            <Card className="bg-[#0c2416]/90 border-[#1e4a30] text-center min-w-[95px] p-3 text-white">
              <span className="block text-2xl font-black text-white tracking-tight">{stats.total}</span>
              <span className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-wider">Total</span>
            </Card>
            <Card className="bg-[#0c2416]/90 border-[#1e4a30] text-center min-w-[95px] p-3 text-white">
              <span className="block text-2xl font-black text-amber-300 tracking-tight">{stats.verified}</span>
              <span className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-wider">Verified</span>
            </Card>
            <Card className="bg-[#0c2416]/90 border-[#1e4a30] text-center min-w-[95px] p-3 text-white">
              <span className="block text-2xl font-black text-emerald-200 tracking-tight">{stats.pending}</span>
              <span className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-wider">Pending</span>
            </Card>
          </div>
        </div>

        {/* ================= 3. FILTER BAR & CONTROLS ================= */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search achievements..."
                className="pl-10"
              />
            </div>

            {/* Controls Right: Custom shadcn Select dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end text-xs">
              
              {/* Category Dropdown */}
              <Select value={selectedCategory} onChange={(val) => setSelectedCategory(val)}>
                <SelectItem value="All">All Categories</SelectItem>
                {categoryDefs.map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onChange={(val) => setSelectedStatus(val)}>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Pending Review">Pending Review</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onChange={(val) => setSortOrder(val)}>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-0.5">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={`h-7 w-7 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#1b4332] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={`h-7 w-7 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#1b4332] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>

            </div>
          </div>
        </Card>

        {/* ================= 4. MAIN CONTENT GRID (3/4 + 1/4) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT COLUMN: ACHIEVEMENTS CARDS (3/4 Width) */}
          <div className="lg:col-span-3 space-y-4">
            
            {filteredAchievements.length === 0 ? (
              <Card className="p-12 text-center text-slate-500 space-y-2">
                <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="font-extrabold text-slate-800 dark:text-white text-base">No achievements found</p>
                <p className="text-xs text-slate-400">Try adjusting your search query or category filters.</p>
              </Card>
            ) : viewMode === 'grid' ? (
              
              /* GRID VIEW MATCHING DESIGN PARITY */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredAchievements.map((item) => {
                  const CategoryIcon = getCategoryIcon(item.category)
                  return (
                    <Card
                      key={item.id}
                      onClick={() => setPreviewItem(item)}
                      className="overflow-hidden flex flex-col justify-between group cursor-pointer relative hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      {/* Green Certificate Banner Top Graphic */}
                      <div className="bg-[#1b4332] dark:bg-[#0a2417] h-32 p-4 flex flex-col items-center justify-center text-white relative">
                        
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
                            <Badge variant="outline" className="font-bold normal-case">
                              {item.category}
                            </Badge>
                            <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[140px]">
                              {item.portfolio_status || 'Available'}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium mt-1">{item.location}</p>
                        </div>

                        {/* Card Bottom Row: Date & Status Pill */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <span className="text-slate-400 text-[11px] font-medium">{item.date}</span>
                          
                          <Badge variant={
                            item.status === 'Verified' ? 'success' : (item.status === 'Pending Review' || item.status === 'Pending') ? 'warning' : 'destructive'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

            ) : (

              /* LIST VIEW */
              <div className="space-y-3">
                {filteredAchievements.map((item) => {
                  const CategoryIcon = getCategoryIcon(item.category)
                  return (
                    <Card
                      key={item.id}
                      onClick={() => setPreviewItem(item)}
                      className="p-4 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between gap-4 cursor-pointer group shadow-xs hover:shadow-md"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/50 text-[#2d8a4e] dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <CategoryIcon className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition truncate">{item.title}</h3>
                          <p className="text-xs text-slate-400">{item.location} • {item.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="outline" className="font-bold normal-case">
                          {item.category}
                        </Badge>
                        <Badge variant={
                          item.status === 'Verified' ? 'success' : (item.status === 'Pending Review' || item.status === 'Pending') ? 'warning' : 'destructive'
                        }>
                          {item.status}
                        </Badge>

                        <button
                          type="button"
                          onClick={(e) => handleOpenPopover(e, item)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>

            )}

            {/* Pagination Footer */}
            <Card className="p-4 flex items-center justify-between text-xs text-slate-500">
              <span>Showing <strong>1-{filteredAchievements.length}</strong> of <strong>{totalCount}</strong> achievements</span>
              <div className="flex items-center gap-1">
                <button disabled className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-7 h-7 rounded-lg bg-[#2d8a4e] text-white font-bold flex items-center justify-center shadow-2xs">
                  1
                </button>
                <button disabled className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN: SIDEBAR WIDGETS (1/4 Width) */}
          <div className="space-y-5">
            
            {/* Widget 1: "By Category" Filter List */}
            <Card className="p-5 space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />
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
                          ? 'bg-[#eef7f0] dark:bg-emerald-950/60 text-[#1e5831] dark:text-emerald-300 font-bold border border-[#cbe6d2] dark:border-emerald-800/50' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CatIcon className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />
                        <span>{cat.name}</span>
                      </div>
                      <Badge variant={isSelected ? 'success' : 'secondary'} className="px-2 py-0.5 text-[10px]">
                        {count}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </Card>

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
    </>
  )
}
