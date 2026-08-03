import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import PersonnelSubmissionModal from '../components/personnel/PersonnelSubmissionModal'
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
  Info,
  BookOpen,
  Building2,
  ShieldCheck
} from 'lucide-react'
import { getCurrentUser } from '../services/authService'

export default function PersonnelAchievementsPage({ currentUser }) {
  const navigate = useNavigate()
  const user = currentUser || getCurrentUser() || {
    full_name: 'Dr. Maria Santos',
    employee_id: 'EMP-2021-0842',
    department: 'Department of Computer Studies'
  }

  const activeRoleContext = user?.active_role_context || 'personnel'

  useEffect(() => {
    if (['organization_moderator', 'program_coordinator', 'department_secretary'].includes(activeRoleContext)) {
      navigate('/personnel/dashboard', { replace: true })
    }
  }, [activeRoleContext, navigate])

  const location = useLocation()

  // State controls
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

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
  }, [location.state])

  // Grouped NDMU Rating Sheet Categories (Clean Personnel Labels)
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

  // Achievements State
  const [achievements, setAchievements] = useState([
    {
      id: 1,
      title: 'Machine Learning Frameworks in Higher Education Analytics',
      location: 'IEEE Access Journal (Scopus)',
      date: 'Apr 15, 2026',
      status: 'Verified',
      category: 'B.2 Publication',
      description: 'Peer-reviewed research article on predictive student performance modeling.',
      icon: BookOpen,
      attached_file_name: 'ieee_access_publication_santos.pdf'
    },
    {
      id: 2,
      title: 'CHED Regional Training on AI Curriculum Integration',
      location: 'CHED Region XII',
      date: 'Mar 20, 2026',
      status: 'Pending Review',
      category: 'A.3 Attendance to Seminars/Trainings',
      description: 'Resource speaker and trainer for 45 IT department faculty members.',
      icon: Users,
      attached_file_name: 'ched_ai_workshop_certificate.pdf'
    },
    {
      id: 3,
      title: 'Koronadal City LGU Digital Governance Extension Project',
      location: 'City Government of Koronadal',
      date: 'Feb 14, 2026',
      status: 'Verified',
      category: 'C.2 Community Involvement',
      description: 'Project Lead for community IT extension program training local barangay secretaries.',
      icon: Heart,
      attached_file_name: 'lgu_extension_project_mou.pdf'
    },
    {
      id: 4,
      title: 'NDMU Outstanding Research Faculty of the Year',
      location: 'Notre Dame of Marbel University',
      date: 'Jan 10, 2026',
      status: 'Verified',
      category: 'B.4 Professional Recognition or Awards',
      description: 'Conferred during University Foundation Day for highest Scopus citations.',
      icon: Award,
      attached_file_name: 'outstanding_faculty_award_2026.pdf'
    },
    {
      id: 5,
      title: 'AWS Certified Solutions Architect - Associate',
      location: 'Amazon Web Services',
      date: 'Nov 5, 2025',
      status: 'Returned',
      category: 'A.2 Active Membership to Prof Orgs',
      description: 'International cloud architecture professional certification.',
      icon: ShieldCheck,
      attached_file_name: 'aws_solutions_architect_certificate.pdf'
    }
  ])

  // Add new achievement handler
  const handleAddNewAchievement = (newEntry) => {
    const formattedEntry = {
      id: newEntry.id || Date.now(),
      title: newEntry.title,
      location: newEntry.issuer || 'NDMU CITE',
      date: newEntry.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending Review',
      category: newEntry.category || 'B.2 Publication',
      description: newEntry.description || '',
      icon: BookOpen,
      attached_file_name: newEntry.attached_file_name || 'proof_document.pdf'
    }

    setAchievements([formattedEntry, ...achievements])
  }

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Issuing Institution', 'Category', 'Date', 'Status']
    const rows = achievements.map(a => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.location}"`,
      `"${a.category}"`,
      `"${a.date}"`,
      `"${a.status}"`
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

  // Filtered & Sorted List
  const filteredAchievements = achievements.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = selectedCategory === 'All' || 
      item.category === selectedCategory ||
      (selectedCategory.startsWith('Area A') && item.category.startsWith('A.')) ||
      (selectedCategory.startsWith('Area B') && item.category.startsWith('B.')) ||
      (selectedCategory.startsWith('Area C') && item.category.startsWith('C.')) ||
      (selectedCategory === 'Degrees & Orgs' && (item.category.includes('Degree') || item.category.includes('Membership') || item.category.includes('A.1') || item.category.includes('A.2'))) ||
      (selectedCategory === 'Seminars & Trainings' && (item.category.includes('Seminar') || item.category.includes('Training') || item.category.includes('A.3'))) ||
      (selectedCategory === 'Lectures & Publications' && (item.category.includes('Lecturer') || item.category.includes('Publication') || item.category.includes('B.1') || item.category.includes('B.2'))) ||
      (selectedCategory === 'Research & Awards' && (item.category.includes('Research') || item.category.includes('Award') || item.category.includes('Recognition') || item.category.includes('B.3') || item.category.includes('B.4'))) ||
      (selectedCategory === 'Instructional Materials' && (item.category.includes('Instructional') || item.category.includes('Material') || item.category.includes('B.5'))) ||
      (selectedCategory === 'Service & Community' && (item.category.includes('Service') || item.category.includes('Community') || item.category.includes('Involvement') || item.category.includes('C.1') || item.category.includes('C.2')))
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
        
        {/* ================= 1. HEADER TITLE BAR ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Achievements</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              View, manage, and track your achievements. Attach supporting documents for verification by your department secretary and HR.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#eef7f0] border border-[#cbe6d2] text-[#2d8a4e] text-xs font-bold flex items-center gap-2 transition shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Achievements</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSubmitOpen(true)}
              className="px-4.5 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Achievement</span>
            </button>
          </div>
        </div>

        {/* ================= 2. 3 STAT PILLS ROW ================= */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => { setSelectedCategory('All'); setSelectedStatus('All') }}
            className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedCategory === 'All' && selectedStatus === 'All'
                ? 'bg-white border-[#2d8a4e] text-slate-900 ring-2 ring-[#2d8a4e]/20 shadow-xs'
                : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#2d8a4e]"></span>
            <span><strong className="text-slate-900">{totalCount}</strong> Total Achievements</span>
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
            <span><strong className="text-emerald-900">{verifiedCount}</strong> Verified</span>
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
            <span><strong className="text-amber-900">{pendingCount}</strong> Pending Review</span>
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
            
            {/* Category Select Organized with Optgroups */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:border-[#2d8a4e] outline-none transition"
            >
              <option value="All">Category: All</option>

              <optgroup label="Overall Rating Areas">
                <option value="Area A: Professional Dev">Area A: Professional Development</option>
                <option value="Area B: Productivity & Creative">Area B: Productivity & Creative Work</option>
                <option value="Area C: Service & Leadership">Area C: Service & Leadership</option>
              </optgroup>

              {categoryGroups.map((group) => (
                <optgroup key={group.area} label={group.area}>
                  {group.items.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
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
              
              /* GRID VIEW MATCHING STUDENT UI REFERENCE EXACLTY */
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
                          type="button"
                          onClick={() => alert(`Options for: ${item.title}`)}
                          className="absolute top-3 right-3 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
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
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#2d8a4e]" />
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
                ))}
              </div>
            </div>

            {/* Widget 2: "Upload Tips" Box */}
            <div className="bg-[#eef7f0]/60 rounded-3xl p-5 border border-[#cbe6d2] space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#1e5831] font-extrabold">
                <Info className="w-4 h-4 text-[#2d8a4e]" />
                <span>Upload Tips</span>
              </div>

              <ul className="space-y-2 text-slate-600 text-[11px] leading-relaxed list-disc pl-4">
                <li>Upload supporting documents for faster verification by your department secretary.</li>
                <li>Ensure documents are clear and legible before uploading.</li>
                <li>Include official certificates, publication memos, or event proofs.</li>
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

      {/* SINGLE ADAPTIVE PERSONNEL SUBMISSION MODAL */}
      <PersonnelSubmissionModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmitAccomplishment={handleAddNewAchievement}
        initialCategory={initialModalCategory}
      />
    </MainLayout>
  )
}
