import React, { useState, useEffect } from 'react'
import { useLocation, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCurrentUser } from '../../services/authService'
import { alertDialog, confirmDialog } from '../../components/ui/DialogProvider'
import AchievementSubmissionModal from './modals/PortfolioAchievementSubmissionModal'
import StudentAchievementPopoverMenu from './StudentAchievementPopoverMenu'
import StudentAchievementPreviewModal from './modals/StudentAchievementPreviewModal'
import { AutomaticAttendanceCertificatePreview, automaticAttendanceCertificateMetadata } from './modals/StudentAchievementPreviewModal'
import useStudentAchievements from '../../hooks/useStudentAchievements'
import portfolioService from '../../services/portfolioService'
import StudentCertificateBadge from '../../components/common/StudentCertificateBadge'
import EvidenceThumbnail from '../../components/common/EvidenceThumbnail'
import StudentAttendanceQrModal from './modals/StudentAttendanceQrModal'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '../../components/ui/avatar'
import { Card } from '../../components/ui/card'
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
  ChevronLeft,
  ChevronRight,
  Info,
  QrCode,
  Check
} from 'lucide-react'

export default function StudentProfileModulePage({ currentUser }) {
  const outletCtx = useOutletContext()
  const { user: authUser } = useAuth()
  const activeUser = currentUser || outletCtx?.currentUser || authUser || getCurrentUser()
  const user = activeUser || {}
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
    refreshData,
    taxonomy
  } = useStudentAchievements()

  // Modal State Controls
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [qrOpen, setQrOpen] = useState(false)

  const student = {
    full_name: user.full_name || '',
    student_id: user.student_id || user.institutional_id || '',
    program: user.program || user.program_name || '',
    college: user.college || user.college_name || '',
    avatar_url: user.avatar_url || null
  }

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
  const categoryDefs = taxonomy.map(category => {
    const name = category.name || ''
    const icon = /leadership|organization/i.test(name) ? Users
      : /community|church|ministry/i.test(name) ? Heart
        : /sport/i.test(name) ? Award
          : /recognition|citation/i.test(name) ? Star
            : /seminar|training/i.test(name) ? Briefcase
              : /journal|academic/i.test(name) ? GraduationCap
                : Trophy
    return { ...category, name, icon }
  })

  const getCategoryIcon = (catName) => {
    const found = categoryDefs.find(c => c.name === catName)
    return found ? found.icon : Trophy
  }

  const handleDownloadProof = async (item) => {
    if (!item.evidence_id) throw new Error('No persisted evidence is attached to this record.')
    const filename = item.attached_file_name || 'student_achievement_evidence'
    const blob = await portfolioService.downloadEvidence(item.evidence_id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleEditAchievement = async (item) => {
    if (item?.canonical_status === 'verified' || item?.status === 'Verified') {
      try {
        const revision = await portfolioService.createRevision(item.id)
        setEditingItem({ ...item, id: revision.id, revision_of_record_id: item.id })
        setIsSubmitOpen(true)
        await refreshData()
      } catch (error) {
        await alertDialog({
          title: 'Could not start an edit',
          message: error?.error?.message || error?.response?.data?.error?.message || error?.message || 'The verified achievement could not be copied for review.',
          tone: 'destructive'
        })
      }
      return
    }
    setEditingItem(item)
    setIsSubmitOpen(true)
  }

  const handleDeleteDraft = async (recordId) => {
    const item = achievements.find(achievement => achievement.id === recordId)
    if (!item || item.status !== 'Draft') return

    const confirmed = await confirmDialog({
      title: 'Delete this draft?',
      message: `“${item.display_title || item.title || 'Untitled draft'}” and its attached evidence will be permanently removed.`,
      confirmLabel: 'Delete draft',
      cancelLabel: 'Keep draft',
      tone: 'destructive'
    })
    if (!confirmed) return

    try {
      await portfolioService.deleteDraft(recordId)
      if (previewItem?.id === recordId) setPreviewItem(null)
      handleClosePopover()
      await refreshData()
    } catch (error) {
      const message = error?.response?.data?.error?.message || error?.message || 'The draft could not be deleted. Please try again.'
      await alertDialog({ title: 'Draft not deleted', message, tone: 'destructive' })
    }
  }

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Date', 'Status', 'Location', 'Description', 'Favorited', 'In Portfolio']
    const rows = filteredAchievements.map(a => [
      `"REF-${String(a.id || '').toUpperCase()}"`,
      `"${String(a.title || '').replace(/"/g, '""')}"`,
      `"${String(a.category || '')}"`,
      `"${String(a.date || '')}"`,
      `"${String(a.status || '')}"`,
      `"${String(a.location || '')}"`,
      `"${String(a.description || '').replace(/"/g, '""')}"`,
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
        
        {/* Profile identity, key counts, and primary action share one module header. */}
        <section className="rounded-2xl border border-[#A9C6B1] bg-[#DCEBDD] p-5 shadow-xs dark:border-[#466B54] dark:bg-[#21372A] sm:p-6" aria-labelledby="student-profile-heading">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar size="lg" className="border-2 border-[#176B43]/40 shadow-md">
                <AvatarImage src={student.avatar_url} alt={student.full_name} />
                <AvatarFallback className="bg-[#176B43] text-white">
                  {student.full_name ? student.full_name.split(' ').map(part => part[0]).join('') : '?'}
                </AvatarFallback>
                <AvatarBadge className="student-profile-verification-badge" title="Verified Student Profile"><Check /></AvatarBadge>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#426750] dark:text-[#BCD0C1]">Profile</p>
                  <span className="rounded-md border border-[#176B43]/30 bg-[#176B43]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#176B43] dark:text-emerald-200">Student Portal</span>
                </div>
                <h1 id="student-profile-heading" className="mt-0.5 truncate text-2xl font-extrabold leading-tight tracking-tight text-[#123D2A] dark:text-[#EFF6F1] sm:text-[28px]">{student.full_name || 'Student'}</h1>
                {student.student_id && <p className="mt-1 truncate text-sm font-semibold text-[#315D43] dark:text-emerald-100">Student ID: {student.student_id}</p>}
                <p className="truncate text-xs font-medium text-[#426750] dark:text-[#BCD0C1]">Your achievement repository</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <Button type="button" variant="outline" onClick={() => setQrOpen(true)} disabled={!student.student_id} className="gap-2 border-[#9DBBA5] bg-white text-[#174E31] hover:bg-[#F1F7F2]">
                <QrCode className="h-4 w-4" /> My QR Code
              </Button>
              <Button variant="outline" onClick={handleExportCSV} className="gap-2 border-[#9DBBA5] bg-white text-[#174E31] hover:bg-[#F1F7F2]">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button onClick={() => { setEditingItem(null); setIsSubmitOpen(true) }} className="gap-2 bg-[#176B43] font-bold text-white hover:bg-[#125536]">
                <Plus className="h-4 w-4" /> Add Achievement
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Total achievements', value: stats.total, icon: Trophy, valueClass: 'text-[#123D2A] dark:text-[#E6EFE9]' },
              { label: 'Verified', value: stats.verified, icon: CheckCircle2, valueClass: 'text-[#16834A] dark:text-emerald-400' },
              { label: 'Pending review', value: stats.pending, icon: Clock, valueClass: 'text-[#9A6500] dark:text-amber-400' }
            ].map(({ label, value, icon: Icon, valueClass }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-[#B7CEBC] bg-white/85 p-3.5 shadow-xs dark:border-[#466B54] dark:bg-[#1D2A23]">
                <Icon className="h-5 w-5 shrink-0 text-[#16834A] dark:text-emerald-400" aria-hidden="true" />
                <div><p className={`text-2xl font-extrabold leading-none ${valueClass}`}>{value}</p><p className="mt-1 text-[11px] font-bold text-[#426750] dark:text-[#B1C0B6]">{label}</p></div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs font-medium text-[#315D43] dark:text-[#BCD0C1]">Your achievements, submission statuses, and supporting proof in one place.</p>
        </section>

        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-[#102A43] dark:text-[#E6EFE9]">Achievements Repository</h2>
            <p className="mt-0.5 text-xs font-medium text-[#4F6475] dark:text-[#B1C0B6]">Browse every saved achievement and check its review status.</p>
          </div>
          <span className="text-xs font-bold text-[#426750] dark:text-[#B1C0B6]">{stats.total} records</span>
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
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
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
                  return (
                    <Card
                      key={item.id}
                      onClick={() => setPreviewItem(item)}
                      className="bg-white dark:bg-[#1D2A23] border border-[#DCE6DF] dark:border-[#374B3F] hover:border-[#9FC9AA] overflow-hidden flex flex-col justify-between group cursor-pointer relative shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      {/* Green Certificate Banner Top Graphic */}
                      <div className="h-32 relative border-b border-[#C6DDCC] dark:border-[#374B3F]">
                        {automaticAttendanceCertificateMetadata(item)
                          ? <AutomaticAttendanceCertificatePreview achievement={item} compact />
                          : <EvidenceThumbnail evidence={item.evidence?.[0]} className="h-32" />}
                        
                        {/* Hover Action Buttons Top Right (Favorite Star & 3-Dot Menu) */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition z-10">
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
                            {item.display_title}
                          </h3>
                          <p className="text-xs text-[#64748B] dark:text-[#B1C0B6] font-medium mt-1">{item.location}</p>
                          {item.saved_label && <p className="text-[11px] text-[#718096] dark:text-[#87978D] mt-1">{item.saved_label}</p>}
                          {item.certificate && (
                            <div className="pt-2">
                              <StudentCertificateBadge certificate={item.certificate} />
                            </div>
                          )}
                        </div>

                        {/* Card Bottom Row: Date & Status Pill */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#DDE6DF] dark:border-[#374B3F] text-xs">
                          <span className="text-[#718096] dark:text-[#87978D] text-[11px] font-medium">{item.display_date}</span>
                          
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
                          <h3 className="text-sm font-bold text-[#102A43] dark:text-[#E6EFE9] group-hover:text-[#16834A] dark:group-hover:text-emerald-400 transition truncate">{item.display_title}</h3>
                          <p className="text-xs text-[#64748B] dark:text-[#B1C0B6]">{[item.location, item.display_date].filter(Boolean).join(' • ')}</p>
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

                        {item.certificate && (
                          <StudentCertificateBadge certificate={item.certificate} showNumber={false} />
                        )}

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
        onEdit={handleEditAchievement}
        onDownload={handleDownloadProof}
        onResubmit={(item) => { setEditingItem(item); setIsSubmitOpen(true) }}
        onDelete={handleDeleteDraft}
      />

      {/* Student Achievement Full Preview Modal */}
      <StudentAchievementPreviewModal
        achievement={previewItem}
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        onEdit={handleEditAchievement}
        onDownload={handleDownloadProof}
        onResubmit={(item) => { setEditingItem(item); setIsSubmitOpen(true) }}
      />

      {/* Achievement Submission & Edit Modal */}
      <AchievementSubmissionModal
        isOpen={isSubmitOpen}
        editingRecordId={editingItem?.id || null}
        taxonomy={taxonomy}
        onSaved={refreshData}
        onClose={() => { setIsSubmitOpen(false); setEditingItem(null) }}
      />
      <StudentAttendanceQrModal
        open={qrOpen}
        onOpenChange={setQrOpen}
        studentId={student.student_id}
        fullName={student.full_name}
      />
    </>
  )
}
