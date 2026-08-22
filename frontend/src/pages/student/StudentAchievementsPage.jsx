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
            <h1 className="text-2xl font-extrabold text-[#102A43] dark:text-[#E6EFE9] tracking-tight">Achievements</h1>
            <p className="text-xs text-[#4F6475] dark:text-[#B1C0B6] font-medium mt-1">
              View, manage, and track your co-curricular and academic achievements. Attach supporting documents for verification by your program coordinator.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="gap-2 cursor-pointer shadow-xs bg-white dark:bg-[#1D2A23] border border-[#C9D8CE] dark:border-[#374B3F] text-[#174E31] dark:text-[#E6EFE9] hover:bg-[#F1F7F2] dark:hover:bg-slate-800 hover:border-[#16834A] focus:ring-2 focus:ring-[#16834A]/20 font-bold text-xs rounded-xl transition-all"
            >
              <Download className="w-4 h-4 text-[#174E31] dark:text-[#E6EFE9]" />
              <span>Export CSV</span>
            </Button>

            <Button
              onClick={() => { setEditingItem(null); setIsSubmitOpen(true) }}
              className="bg-[#176B43] hover:bg-[#125536] text-white border border-[#176B43] gap-2 cursor-pointer shadow-xs focus:ring-2 focus:ring-[#176B43]/22 font-bold text-xs rounded-xl transition-all disabled:bg-[#E5ECE7] disabled:text-[#7A8B80] disabled:border-[#D2DDD5] disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Achievement</span>
            </Button>
          </div>
        </div>

        {/* ================= 2. METRICS BANNER ================= */}
        <div className="bg-[#DCEBDD] dark:bg-[#21372A] rounded-2xl p-6 border border-[#A9C6B1] dark:border-[#466B54] shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2 text-[#176B43] dark:text-[#59AD7C] text-xs font-extrabold tracking-wider uppercase">
              <Trophy className="w-4 h-4 text-[#16834A] dark:text-[#59AD7C]" />
              <span>Co-Curricular Student Record</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#123D2A] dark:text-[#EFF6F1] tracking-tight">Student Achievements Overview</h2>
            <p className="text-xs text-[#3F6B52] dark:text-[#BCD0C1] font-medium max-w-xl">
              Track verified accomplishments, submit document proofs for coordinator review, and highlight key achievements in your student portfolio.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0">
            <div className="bg-white dark:bg-[#1D2A23] border border-[#B7CEBC] dark:border-[#374B3F] text-center min-w-[95px] p-3 rounded-xl shadow-xs">
              <span className="block text-2xl font-extrabold text-[#123D2A] dark:text-[#E6EFE9] tracking-tight">{stats.total}</span>
              <span className="text-[10px] font-extrabold text-[#426750] dark:text-[#B1C0B6] uppercase tracking-wider">Total</span>
            </div>
            <div className="bg-white dark:bg-[#1D2A23] border border-[#B7CEBC] dark:border-[#374B3F] text-center min-w-[95px] p-3 rounded-xl shadow-xs">
              <span className="block text-2xl font-extrabold text-[#16834A] dark:text-emerald-400 tracking-tight">{stats.verified}</span>
              <span className="text-[10px] font-extrabold text-[#176B43] dark:text-emerald-300 uppercase tracking-wider">Verified</span>
            </div>
            <div className="bg-white dark:bg-[#1D2A23] border border-[#B7CEBC] dark:border-[#374B3F] text-center min-w-[95px] p-3 rounded-xl shadow-xs">
              <span className="block text-2xl font-extrabold text-[#9A6500] dark:text-amber-400 tracking-tight">{stats.pending}</span>
              <span className="text-[10px] font-extrabold text-[#725500] dark:text-amber-300 uppercase tracking-wider">Pending</span>
            </div>
          </div>
        </div>

        {/* ================= 3. FILTER BAR & CONTROLS ================= */}
        <Card className="p-4 space-y-3 bg-white dark:bg-[#1D2A23] border border-[#DCE6DF] dark:border-[#374B3F] shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-[#667B72] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search achievements..."
                className="pl-10 border-[#D7E2DA] dark:border-[#374B3F] bg-white dark:bg-[#121A16] text-[#243B53] dark:text-[#E6EFE9] focus:border-[#16834A] focus:ring-2 focus:ring-[#16834A]/20 placeholder:text-[#7B8B9D]"
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
              <div className="flex items-center p-1 bg-[#F5F8F3] dark:bg-[#121A16] rounded-xl border border-[#D7E2DA] dark:border-[#374B3F] gap-0.5">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={`h-7 w-7 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#176B43] text-white shadow-xs'
                      : 'text-[#52677A] dark:text-slate-400 hover:text-[#176B43] hover:bg-[#EAF4EC] dark:hover:bg-slate-700'
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
                      ? 'bg-[#176B43] text-white shadow-xs'
                      : 'text-[#52677A] dark:text-slate-400 hover:text-[#176B43] hover:bg-[#EAF4EC] dark:hover:bg-slate-700'
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
                      className="bg-white dark:bg-[#1D2A23] border border-[#DCE6DF] dark:border-[#374B3F] hover:border-[#9FC9AA] overflow-hidden flex flex-col justify-between group cursor-pointer relative shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      {/* Green Certificate Banner Top Graphic */}
                      <div className="bg-[#EAF4EC] dark:bg-[#26382E] h-32 p-4 flex flex-col items-center justify-center text-white relative border-b border-[#C6DDCC] dark:border-[#374B3F]">
                        
                        {/* Hover Action Buttons Top Right (Favorite Star & 3-Dot Menu) */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition z-10">
                          {/* Favorite Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id) }}
                            className={`p-1.5 rounded-full border transition cursor-pointer ${
                              item.is_favorited ? 'bg-[#FFF4CC] text-[#8A6100] border-[#FFE3B3] shadow-xs' : 'bg-white/90 hover:bg-white text-[#52677A] border-[#DCE6DF]'
                            }`}
                            title={item.is_favorited ? 'Unfavorite' : 'Favorite'}
                          >
                            <Star className={`w-3.5 h-3.5 ${item.is_favorited ? 'fill-[#8A6100]' : ''}`} />
                          </button>

                          {/* 3-Dot Options Button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenPopover(e, item)}
                            className="p-1.5 rounded-full bg-white hover:bg-[#F1F7F2] text-[#52677A] hover:text-[#176B43] border border-[#DCE6DF] transition cursor-pointer shadow-xs"
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#1D2A23] border border-[#C6DDCC] dark:border-[#374B3F] flex items-center justify-center text-[#16834A] dark:text-[#59AD7C] mb-1 shadow-xs">
                          <CategoryIcon className="w-5 h-5 text-[#16834A] dark:text-[#59AD7C]" />
                        </div>
                        <span className="text-[10px] font-extrabold tracking-widest uppercase text-[#356148] dark:text-[#BCD0C1]">CERTIFICATE PROOF</span>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-[#1D2A23]">
                        <div>
                          {/* Category Tag & Portfolio Link Indicator */}
                          <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              item.category === 'Academic'
                                ? 'bg-[#EAF4EC] text-[#145C39] border-[#B9D8C1]'
                                : item.category === 'Leadership'
                                  ? 'bg-[#EDF5FF] text-[#31586F] border-[#BCD3E4]'
                                  : item.category === 'Community'
                                    ? 'bg-[#F1F7F2] text-[#356148] border-[#C7DBCC]'
                                    : item.category === 'Sports'
                                      ? 'bg-[#FFF7E6] text-[#7A5514] border-[#E5C98C]'
                                      : 'bg-[#EAF4EC] text-[#145C39] border-[#B9D8C1]'
                            }`}>
                              {item.category}
                            </span>
                            <span className="text-[10px] font-semibold text-[#718096] dark:text-[#B1C0B6] truncate max-w-[140px]">
                              {item.portfolio_status || 'Available'}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-extrabold text-[#102A43] dark:text-[#E6EFE9] group-hover:text-[#16834A] dark:group-hover:text-emerald-400 transition leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs text-[#64748B] dark:text-[#B1C0B6] font-medium mt-1">{item.location}</p>
                        </div>

                        {/* Card Bottom Row: Date & Status Pill */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#DDE6DF] dark:border-[#374B3F] text-xs">
                          <span className="text-[#718096] dark:text-[#87978D] text-[11px] font-medium">{item.date}</span>
                          
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            item.status === 'Verified'
                              ? 'bg-[#E7F5EA] text-[#17663B] border-[#BBDCC3]'
                              : (item.status === 'Pending Review' || item.status === 'Pending')
                                ? 'bg-[#FFF7E6] text-[#795600] border-[#E5C276]'
                                : item.status === 'Returned'
                                  ? 'bg-[#FFF0F0] text-[#8F3434] border-[#E6B2B2]'
                                  : 'bg-[#FDECEC] text-[#9F2222] border-[#E3A0A0]'
                          }`}>
                            {item.status === 'Verified' && <CheckCircle2 className="w-3 h-3 text-[#16834A]" />}
                            {(item.status === 'Pending Review' || item.status === 'Pending') && <Clock className="w-3 h-3 text-[#B7791F]" />}
                            {item.status === 'Returned' && <RotateCcw className="w-3 h-3 text-[#B54747]" />}
                            <span>{item.status}</span>
                          </span>
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
                      className="p-4 bg-white dark:bg-[#1D2A23] border border-[#DCE6DF] dark:border-[#374B3F] hover:border-[#9FC9AA] transition flex items-center justify-between gap-4 cursor-pointer group shadow-xs hover:shadow-md"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-[#E7F5EA] dark:bg-emerald-950/50 border border-[#B7DDC4] dark:border-emerald-800/50 text-[#16834A] dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <CategoryIcon className="w-5 h-5 text-[#16834A]" />
                        </div>
                        <div className="truncate">
                          <h3 className="text-sm font-bold text-[#102A43] dark:text-[#E6EFE9] group-hover:text-[#16834A] dark:group-hover:text-emerald-400 transition truncate">{item.title}</h3>
                          <p className="text-xs text-[#64748B] dark:text-[#B1C0B6]">{item.location} • {item.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          item.category === 'Academic'
                            ? 'bg-[#EAF4EC] text-[#145C39] border-[#B9D8C1]'
                            : item.category === 'Leadership'
                              ? 'bg-[#EDF5FF] text-[#31586F] border-[#BCD3E4]'
                              : item.category === 'Community'
                                ? 'bg-[#F1F7F2] text-[#356148] border-[#C7DBCC]'
                                : item.category === 'Sports'
                                  ? 'bg-[#FFF7E6] text-[#7A5514] border-[#E5C98C]'
                                  : 'bg-[#EAF4EC] text-[#145C39] border-[#B9D8C1]'
                        }`}>
                          {item.category}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          item.status === 'Verified'
                            ? 'bg-[#E7F5EA] text-[#17663B] border-[#BBDCC3]'
                            : (item.status === 'Pending Review' || item.status === 'Pending')
                              ? 'bg-[#FFF7E6] text-[#795600] border-[#E5C276]'
                              : item.status === 'Returned'
                                ? 'bg-[#FFF0F0] text-[#8F3434] border-[#E6B2B2]'
                                : 'bg-[#FDECEC] text-[#9F2222] border-[#E3A0A0]'
                        }`}>
                          {item.status === 'Verified' && <CheckCircle2 className="w-3 h-3 text-[#16834A]" />}
                          {(item.status === 'Pending Review' || item.status === 'Pending') && <Clock className="w-3 h-3 text-[#B7791F]" />}
                          {item.status === 'Returned' && <RotateCcw className="w-3 h-3 text-[#B54747]" />}
                          <span>{item.status}</span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleOpenPopover(e, item)}
                          className="p-1.5 rounded-lg hover:bg-[#F1F7F2] dark:hover:bg-slate-800 text-[#52677A] hover:text-[#176B43] transition cursor-pointer"
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
            <Card className="p-4 flex items-center justify-between text-xs text-[#4F6475] dark:text-[#B1C0B6] bg-white dark:bg-[#1D2A23] border border-[#DCE6DF] dark:border-[#374B3F] shadow-xs">
              <span>Showing <strong>1-{filteredAchievements.length}</strong> of <strong>{totalCount}</strong> achievements</span>
              <div className="flex items-center gap-1">
                <button disabled className="p-1.5 rounded-lg border border-[#DCE6DF] dark:border-[#374B3F] text-[#87958C] dark:text-slate-600 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-7 h-7 rounded-lg bg-[#176B43] text-white font-bold flex items-center justify-center shadow-xs">
                  1
                </button>
                <button disabled className="p-1.5 rounded-lg border border-[#DCE6DF] dark:border-[#374B3F] text-[#87958C] dark:text-slate-600 cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card>

          </div>

          {/* RIGHT COLUMN: SIDEBAR WIDGETS (1/4 Width) */}
          <div className="space-y-5">
            
            {/* Widget 1: "By Category" Filter List */}
            <Card className="p-5 space-y-3 bg-white dark:bg-[#1D2A23] border border-[#DCE6DF] dark:border-[#374B3F] shadow-xs">
              <h2 className="text-sm font-extrabold text-[#102A43] dark:text-[#E6EFE9] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#16834A] dark:text-emerald-400" />
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
                          ? 'bg-[#DCEBDD] dark:bg-emerald-950/60 text-[#123D2A] dark:text-emerald-300 font-bold border border-[#A9C6B1] dark:border-emerald-800/50' 
                          : 'text-[#40566A] dark:text-[#B1C0B6] hover:bg-[#F1F7F2] dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CatIcon className="w-4 h-4 text-[#16834A] dark:text-emerald-400" />
                        <span>{cat.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isSelected ? 'bg-[#176B43] text-white border-[#176B43]' : 'bg-[#DCEBDD] text-[#145C39] border-[#A9C6B1]'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Widget 2: "Upload Tips" Box */}
            <div className="bg-[#F5F8F3] dark:bg-[#121A16] rounded-3xl p-5 border border-[#DCE6DF] dark:border-[#374B3F] space-y-3 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-[#17663B] dark:text-emerald-400 font-extrabold">
                <Info className="w-4 h-4 text-[#16834A]" />
                <span>Upload & Verification Tips</span>
              </div>

              <ul className="space-y-2 text-[#4F6475] dark:text-[#B1C0B6] text-[11px] leading-relaxed list-disc pl-4 font-medium">
                <li>Upload supporting proof documents for faster verification by your Program Coordinator.</li>
                <li>Ensure attached certificates are clear, legible, and include official signatures.</li>
                <li>Check comments if your submission status is marked as <strong>Returned</strong>.</li>
              </ul>

              <div className="pt-2 border-t border-[#DDE6DF] dark:border-[#374B3F]">
                <p className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#87978D] mb-1">Accepted File Formats</p>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#1D2A23] border border-[#DCE6DF] dark:border-[#374B3F] text-[10px] font-bold text-[#243B53] dark:text-[#E6EFE9]">PDF</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#1D2A23] border border-[#DCE6DF] dark:border-[#374B3F] text-[10px] font-bold text-[#243B53] dark:text-[#E6EFE9]">JPG</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#1D2A23] border border-[#DCE6DF] dark:border-[#374B3F] text-[10px] font-bold text-[#243B53] dark:text-[#E6EFE9]">PNG</span>
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
