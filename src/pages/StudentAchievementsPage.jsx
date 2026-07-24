import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AchievementSubmissionModal from '../components/student/AchievementSubmissionModal'
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
  const user = currentUser || { full_name: 'Maria Santos', student_id: '2024-01234', program: 'BS Information Technology' }
  const location = useLocation()

  // State controls
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)

  useEffect(() => {
    if (location.state?.openSubmissionModal) {
      setIsSubmitOpen(true)
    }
    if (location.state?.selectedCategory) {
      setSelectedCategory(location.state.selectedCategory)
    }
  }, [location.state])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1)

  // Achievements State
  const [achievements, setAchievements] = useState([
    {
      id: 1,
      title: 'Best Research Paper Award',
      location: 'General Santos City',
      date: 'Apr 5, 2026',
      status: 'Returned',
      category: 'Academic',
      description: 'Awarded 1st place in Regional Undergraduate IT Research Symposium.',
      icon: GraduationCap,
      attached_file_name: 'research_paper_award.pdf'
    },
    {
      id: 2,
      title: 'Community Outreach Volunteer',
      location: 'Barangay Poblacion',
      date: 'Mar 20, 2026',
      status: 'Pending Review',
      category: 'Community',
      description: 'Volunteered for barangay computer literacy program.',
      icon: Heart,
      attached_file_name: 'outreach_certificate.pdf'
    },
    {
      id: 3,
      title: 'Basketball Intramurals Champion',
      location: 'NDMU Gymnasium',
      date: 'Feb 14, 2026',
      status: 'Verified',
      category: 'Sports',
      description: 'Point guard for Champion IT Department Varsity Team.',
      icon: Award,
      attached_file_name: 'intramurals_champ_cert.pdf'
    },
    {
      id: 4,
      title: 'Student Council President',
      location: 'NDMU Main Campus',
      date: 'Jan 10, 2026',
      status: 'Verified',
      category: 'Leadership',
      description: 'Elected Supreme Student Council President for AY 2025-2026.',
      icon: Users,
      attached_file_name: 'ssc_president_appointment.pdf'
    },
    {
      id: 5,
      title: "Dean's Lister - First Semester AY 2025-2026",
      location: 'Notre Dame of Marbel University',
      date: 'Dec 15, 2025',
      status: 'Verified',
      category: 'Academic',
      description: 'Achieved General Weighted Average of 1.18 in First Semester.',
      icon: GraduationCap,
      attached_file_name: 'deans_list_cert.pdf'
    }
  ])

  // Category items definitions & counts
  const categoryDefs = [
    { name: 'Academic', icon: GraduationCap },
    { name: 'Leadership', icon: Users },
    { name: 'Community', icon: Heart },
    { name: 'Sports', icon: Award },
    { name: 'Recognition', icon: Star },
    { name: 'Professional Development', icon: Briefcase }
  ]

  // Add achievement submission handler
  const handleAddNewAchievement = (newEntry) => {
    setAchievements([
      {
        ...newEntry,
        status: 'Pending Review',
        location: 'NDMU Campus',
        icon: Award
      },
      ...achievements
    ])
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Date', 'Status', 'Location', 'Description']
    const rows = achievements.map(a => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.date}"`,
      `"${a.status}"`,
      `"${a.location}"`,
      `"${a.description.replace(/"/g, '""')}"`
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

  // Filtered & Sorted List
  const filteredAchievements = achievements.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus
    return matchesSearch && matchesCat && matchesStatus
  }).sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.date) - new Date(a.date)
    if (sortOrder === 'oldest') return new Date(a.date) - new Date(b.date)
    if (sortOrder === 'title') return a.title.localeCompare(b.title)
    return 0
  })

  // Quick Stat Counts
  const totalCount = achievements.length
  const verifiedCount = achievements.filter(a => a.status === 'Verified').length
  const pendingCount = achievements.filter(a => a.status === 'Pending Review' || a.status === 'Pending').length

  return (
    <MainLayout>
      <div className="space-y-6 font-sans">
        
        {/* ================= 1. HEADER TITLE & TOP ACTIONS ROW ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Achievements</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              View, manage, and track your achievements. Attach supporting documents for verification by your program coordinator.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] text-xs font-bold flex items-center gap-2 transition shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Achievements</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSubmitOpen(true)}
              className="px-4.5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold flex items-center gap-2 transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Achievement</span>
            </button>
          </div>
        </div>

        {/* ================= 2. 3 STAT PILLS ROW ================= */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setSelectedCategory('All'); setSelectedStatus('All') }}
            className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition ${
              selectedCategory === 'All' && selectedStatus === 'All'
                ? 'bg-white border-[#2d8a4e] text-slate-900 ring-2 ring-[#2d8a4e]/20 shadow-xs'
                : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#2d8a4e]"></span>
            <span><strong className="text-slate-900">{totalCount}</strong> Total Achievements</span>
          </button>

          <button
            onClick={() => setSelectedStatus('Verified')}
            className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition ${
              selectedStatus === 'Verified'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300/40 shadow-xs'
                : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span><strong className="text-slate-900">{verifiedCount}</strong> Verified</span>
          </button>

          <button
            onClick={() => setSelectedStatus('Pending Review')}
            className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition ${
              selectedStatus === 'Pending Review'
                ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-300/40 shadow-xs'
                : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span><strong className="text-slate-900">{pendingCount}</strong> Pending Review</span>
          </button>
        </div>

        {/* ================= 3. FILTER & SEARCH CONTROL TOOLBAR ================= */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search achievements..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 text-xs text-slate-800 outline-none transition"
            />
          </div>

          {/* Select Controls & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:border-[#2d8a4e] outline-none transition"
            >
              <option value="All">Category: All</option>
              {categoryDefs.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:border-[#2d8a4e] outline-none transition"
            >
              <option value="All">Status: All</option>
              <option value="Verified">Verified</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Returned">Returned</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:border-[#2d8a4e] outline-none transition"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
            </select>

            {/* View Mode Toggle Switch */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-[#2d8a4e] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white text-[#2d8a4e] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* ================= 4. MAIN CONTENT GRID (2 COLUMNS: 3/4 + 1/4) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT COLUMN: ACHIEVEMENTS CARDS GRID (3/4 Width) */}
          <div className="lg:col-span-3 space-y-4">
            
            {filteredAchievements.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center text-slate-500 space-y-2">
                <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-extrabold text-slate-800 text-base">No achievements found</p>
                <p className="text-xs text-slate-400">Try adjusting your search query or category filters.</p>
              </div>
            ) : viewMode === 'grid' ? (
              
              /* GRID VIEW MATCHING UI MOCKUP */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredAchievements.map((item) => {
                  const CategoryIcon = item.icon || Trophy
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Green Certificate Banner Top Graphic */}
                      <div className="bg-[#2d8a4e] h-32 p-4 flex flex-col items-center justify-center text-white relative">
                        <button
                          onClick={() => alert(`Options for: ${item.title}`)}
                          className="absolute top-3 right-3 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        <CategoryIcon className="w-7 h-7 text-amber-300 mb-1" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-emerald-100">CERTIFICATE</span>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {/* Category Tag */}
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] text-[10px] font-bold mb-2">
                            {item.category}
                          </span>
                          
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
                          {item.status === 'Pending Review' && (
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
                  const CategoryIcon = item.icon || Trophy
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#2d8a4e] transition flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] flex items-center justify-center shrink-0">
                          <CategoryIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                          <p className="text-xs text-slate-400">{item.location} • {item.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                          {item.category}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{item.status}</span>
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
            
            {/* Widget 1: "By Category" List */}
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
                      className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
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
                <span>Upload Tips</span>
              </div>

              <ul className="space-y-2 text-slate-600 text-[11px] leading-relaxed list-disc pl-4">
                <li>Upload supporting documents for faster verification by your coordinator.</li>
                <li>Ensure documents are clear and legible before uploading.</li>
                <li>Include official certificates, awards, or event proofs.</li>
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

      {/* Achievement Submission Modal */}
      <AchievementSubmissionModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmitAchievement={handleAddNewAchievement}
      />
    </MainLayout>
  )
}
