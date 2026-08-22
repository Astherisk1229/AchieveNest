import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import campusBanner from '../../../assets/ndmu_campus_banner.png'
import { useVerification } from '../../../hooks/useVerification'
import { useStudentRoster } from '../../../hooks/useStudentRoster'
import CoordinatorMetricsSidebar from './CoordinatorMetricsSidebar'
import { calculateAverageReviewTime } from '../../../utils/verificationMetrics'
import { 
  Shield, 
  ShieldCheck,
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  TrendingUp, 
  Filter, 
  User, 
  FileText, 
  Check, 
  X, 
  MessageSquare,
  AlertCircle,
  Search,
  Users,
  BarChart3,
  Award,
  Download,
  Eye,
  Building2,
  GraduationCap,
  Calendar,
  ExternalLink,
  Activity,
  ChevronRight,
  Target,
  PieChart,
  Zap,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Share2,
  CreditCard,
  BookOpen,
  Heart,
  Trophy
} from 'lucide-react'




export default function CoordinatorDashboardPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const user = currentUser || {
    full_name: 'Dr. Ana Reyes',
    program_scope: 'BS Computer Science',
    department: 'Department of Computer Studies'
  }

  // Active Workspace Tab driven by URL query parameter: 'overview' | 'workspace' | 'students'
  let activeTabParam = null
  try {
    activeTabParam = searchParams ? searchParams.get('tab') : null
  } catch (e) {
    activeTabParam = null
  }

  const activeTab = ['overview', 'workspace', 'students'].includes(activeTabParam) ? activeTabParam : 'overview'

  const setActiveTab = (tabName) => {
    try {
      setSearchParams({ tab: tabName })
    } catch (e) {
      console.error('Error setting search params tab:', e)
    }
  }

  // Master Initial Submissions Data
  const [initialSubmissionsData] = useState([
    {
      id: 101,
      title: 'Community Outreach Volunteer',
      student_name: 'Maria Santos',
      student_id: '2024-01234',
      program: 'BS Computer Science',
      event_name: 'Barangay Digital Literacy Program 2026',
      issuer: 'Barangay Poblacion City Government',
      category: 'Community',
      scope_level: 'Local / City Level',
      rank_conferred: 'Participant / Special Award',
      academic_year: 'AY 2025-2026',
      semester: '2nd Semester',
      date: '3/20/2026',
      docs_count: 2,
      attached_file_name: 'community_outreach_proof.pdf',
      participation_photo_name: 'event_outreach_photo.jpg',
      description: 'Participated in a 3-day barangay digital literacy workshop for local officials.',
      status: 'Pending'
    },
    {
      id: 102,
      title: 'Regional Coding Hackathon Champion',
      student_name: 'Angela Castro',
      student_id: '2024-05678',
      program: 'BS Computer Science',
      event_name: '12th SOCCSKSARGEN IT Summit Hackathon',
      issuer: 'DICT Region XII / NDMU CITE',
      category: 'Academic',
      scope_level: 'Regional (Region XII)',
      rank_conferred: 'Champion / 1st Place',
      academic_year: 'AY 2025-2026',
      semester: '2nd Semester',
      date: '3/18/2026',
      docs_count: 2,
      attached_file_name: 'dict_hackathon_certificate.pdf',
      participation_photo_name: 'hackathon_awarding_photo.jpg',
      description: 'Awarded 1st Place overall in the Region XII IT Summit Software Development Hackathon.',
      status: 'Pending'
    },
    {
      id: 103,
      title: "Dean's Lister - First Semester AY 2025-2026",
      student_name: 'Maria Santos',
      student_id: '2024-01234',
      program: 'BS Computer Science',
      event_name: 'NDMU First Semester AY 2025-2026 Academic Recognition',
      issuer: 'Notre Dame of Marbel University Registrar',
      category: 'Academic',
      scope_level: 'Institutional / Campus-Wide',
      rank_conferred: "Dean's Lister",
      academic_year: 'AY 2025-2026',
      semester: '1st Semester',
      date: '2/10/2026',
      docs_count: 2,
      attached_file_name: 'deans_lister_cert_ay2526.pdf',
      participation_photo_name: 'deans_list_awarding_photo.jpg',
      description: 'Achieved GPA of 3.85 for 1st Semester AY 2025-2026.',
      status: 'Verified'
    },
    {
      id: 104,
      title: 'Computer Society President',
      student_name: 'Juan Dela Cruz',
      student_id: '2023-0142',
      program: 'BS Computer Science',
      event_name: 'NDMU Computer Society Officer Election AY 2025-2026',
      issuer: 'NDMU Computer Society / CEAC Dean\'s Office',
      category: 'Leadership',
      scope_level: 'Institutional / Campus-Wide',
      rank_conferred: 'Leadership Officer / Lead',
      academic_year: 'AY 2025-2026',
      semester: '1st Semester',
      date: '1/15/2026',
      docs_count: 2,
      attached_file_name: 'org_president_appointment.pdf',
      participation_photo_name: 'officer_induction_photo.jpg',
      description: 'Elected President of the NDMU Computer Society for AY 2025-2026.',
      status: 'Verified'
    },
    {
      id: 105,
      title: 'University Sports Fest Volleyball Finalist',
      student_name: 'Mark Bautista',
      student_id: '2023-0988',
      program: 'BS Computer Science',
      event_name: 'NDMU Intramurals 2025 Men\'s Volleyball Tournament',
      issuer: 'NDMU Athletics Office',
      category: 'Athletics',
      scope_level: 'Institutional / Campus-Wide',
      rank_conferred: 'Finalist / Runner-Up',
      academic_year: 'AY 2025-2026',
      semester: '1st Semester',
      date: '12/05/2025',
      docs_count: 2,
      attached_file_name: 'intramurals_volleyball_runnerup.pdf',
      participation_photo_name: 'volleyball_match_photo.jpg',
      description: '2nd Place finish in NDMU Intramurals Men\'s Volleyball Tournament.',
      status: 'Returned',
      return_remarks: 'Please attach an official signed certification from the Athletics Office. Scanned photo is unreadable.'
    }
  ])

  // Initial Student Roster Data
  const [initialStudentsData] = useState([
    {
      id: 'usr_std_001',
      student_id: '2021-00123',
      full_name: 'Maria Santos',
      email: 'maria.santos@ndmu.edu.ph',
      program: 'BS Computer Science (CEAC)',
      year_level: '4th Year',
      verified_points: 450,
      achievements_count: 12,
      verified_count: 10,
      pending_count: 2,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    {
      id: 'usr_std_002',
      student_id: '2021-00456',
      full_name: 'John Reyes',
      email: 'john.reyes@ndmu.edu.ph',
      program: 'BS Information Technology (CEAC)',
      year_level: '4th Year',
      verified_points: 320,
      achievements_count: 8,
      verified_count: 7,
      pending_count: 1,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      id: 'usr_std_003',
      student_id: '2022-00789',
      full_name: 'Ana Cruz',
      email: 'ana.cruz@ndmu.edu.ph',
      program: 'BS Computer Science (CEAC)',
      year_level: '3rd Year',
      verified_points: 580,
      achievements_count: 15,
      verified_count: 13,
      pending_count: 2,
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
    },
    {
      id: 'usr_std_004',
      student_id: '2022-00234',
      full_name: 'Carlos Mendoza',
      email: 'carlos.mendoza@ndmu.edu.ph',
      program: 'BS Nursing (CHS)',
      year_level: '3rd Year',
      verified_points: 240,
      achievements_count: 6,
      verified_count: 5,
      pending_count: 1,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    },
    {
      id: 'usr_std_005',
      student_id: '2023-00567',
      full_name: 'Elena Torres',
      email: 'elena.torres@ndmu.edu.ph',
      program: 'BS Business Administration (CBGA)',
      year_level: '2nd Year',
      verified_points: 150,
      achievements_count: 4,
      verified_count: 3,
      pending_count: 1,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    }
  ])

  // Custom MVC Bridge Hooks
  const {
    allSubmissions,
    filteredSubmissions,
    pendingCount,
    verifiedCount,
    returnedCount,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    handleApprove: handleApproveHook,
    handleReturn: handleReturnHook,
    handleExportCSVReport: handleExportCSVReportHook
  } = useVerification(initialSubmissionsData)

  const {
    filteredStudents,
    yearFilter,
    setYearFilter,
    courseFilter,
    setCourseFilter
  } = useStudentRoster(initialStudentsData)

  const [selectedReviewItem, setSelectedReviewItem] = useState(null)
  const [selectedStudentDossier, setSelectedStudentDossier] = useState(null)
  const [dossierActiveTab, setDossierActiveTab] = useState('all') // 'all' | 'verified' | 'pending' | 'returned'
  const [dossierCategoryFilter, setDossierCategoryFilter] = useState('All')

  const [selectedWorkspaceItem, setSelectedWorkspaceItem] = useState(null)
  const [workspaceRemarks, setWorkspaceRemarks] = useState('')
  const [returnRemarks, setReturnRemarks] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // Verification Workspace Filter States (Default: Current AY 2025-2026)
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [scopeFilter, setScopeFilter] = useState('All Scopes')
  const [ayFilter, setAyFilter] = useState('AY 2025-2026')
  const [sortBy, setSortBy] = useState('Newest')



  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Wrapper handlers using Hook + Toast
  const handleApprove = (itemId) => {
    handleApproveHook(itemId)
    triggerToast('Achievement approved & verified successfully!')
    setSelectedReviewItem(null)
  }

  const handleReturn = (itemId) => {
    if (!returnRemarks.trim()) {
      alert('Please provide remarks explaining why the achievement is being returned.')
      return
    }
    handleReturnHook(itemId, returnRemarks.trim())
    triggerToast('Achievement returned to student with remarks.')
    setSelectedReviewItem(null)
    setReturnRemarks('')
  }

  const handleExportCSVReport = () => {
    handleExportCSVReportHook(user.program_scope || 'BS Computer Science')
    triggerToast('BS Computer Science verification CSV report downloaded!')
  }

  const averageReviewTime = calculateAverageReviewTime(allSubmissions)

  const handleMetricStatusSelect = (status) => {
    const validStatus = ['Pending', 'Verified', 'Returned'].includes(status) ? status : 'All'
    setStatusFilter(validStatus)
    setSelectedWorkspaceItem(null)
    setSearchParams({ tab: 'workspace', status: validStatus })
  }


  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#16834a] text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#245F42]" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-[#245F42] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= OVERVIEW TAB: Hero Banner + Program Scope + Content ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Hero Summary Banner */}
          <div className="bg-[#EFF7F0] dark:bg-[#21372A] p-6 sm:p-8 rounded-3xl shadow-xl border border-[#69A97C] dark:border-[#466B54] relative overflow-hidden">
            
            {/* Top Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#159552] border border-emerald-400/30 flex items-center justify-center text-white shadow-md shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#17663B] dark:text-[#EFF6F1] tracking-tight">Program Coordinator Dashboard</h1>
                  <p className="text-xs text-[#356148] dark:text-[#BCD0C1] font-medium mt-0.5">
                    Achievement Verification &amp; Management • {user.program_scope || 'BS Computer Science'}
                  </p>
                </div>
              </div>

              {/* Decorative Icon Surface */}
              <div className="w-10 h-10 rounded-2xl bg-[#E7F5EA] dark:bg-[#1D2A23] border border-[#69A97C]/30 flex items-center justify-center text-[#159552] dark:text-[#59AD7C] shadow-sm shrink-0 self-start sm:self-auto">
                <Award className="w-5 h-5 text-[#159552] dark:text-[#59AD7C]" />
              </div>
            </div>

          </div>

          {/* Program Scope Filter Notice Banner */}
          <div className="p-4 rounded-2xl bg-[#EAF4EC] dark:bg-[#1D2A23] border border-[#B9D8C1] dark:border-[#374B3F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#121A16] border border-[#B9D8C1] dark:border-[#374B3F] flex items-center justify-center text-[#16834A] shrink-0">
                <Filter className="w-4 h-4 text-[#16834A]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#145C39] dark:text-[#E6EFE9]">
                  Program Scope: {user.program_scope || 'BS Computer Science (BSCS)'}
                </h3>
                <p className="text-[11px] text-[#356148] dark:text-[#B1C0B6] font-medium">
                  Viewing and verifying achievement entries for students enrolled under your assigned degree program.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#176B43] text-white shadow-xs shrink-0 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>Program Coordinator Mode</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT MAIN COLUMN: Recent Verification Activity Log (span-2) */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-[#16834a] border border-emerald-100">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Recent Verification Activity Log</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Real-time audit stream for {user.program_scope || 'BS Computer Science'}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#064e2b] border border-emerald-200 text-[11px] font-bold">
                    Live Audit Stream
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: 'act-1',
                      title: 'Verified Achievement Entry',
                      detail: 'Approved "Machine Learning Research Paper" submitted by Maria Santos',
                      timestamp: '25 mins ago',
                      type: 'verified',
                      icon: CheckCircle2,
                      badgeColor: 'bg-emerald-50 text-[#064e2b] border-emerald-200'
                    },
                    {
                      id: 'act-2',
                      title: 'Returned for Revision',
                      detail: 'Returned "Community Volunteer Cert" to John Doe with required remarks',
                      timestamp: '1 hour ago',
                      type: 'returned',
                      icon: RotateCcw,
                      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
                    },
                    {
                      id: 'act-3',
                      title: 'New Student Submission Received',
                      detail: 'Maria Santos submitted "Community Outreach Volunteer" for verification',
                      timestamp: '3 hours ago',
                      type: 'pending',
                      icon: Clock,
                      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
                    },
                    {
                      id: 'act-4',
                      title: 'Program Activity Synchronized',
                      detail: 'Verification records updated across 4 BS Computer Science student dossiers.',
                      timestamp: 'Yesterday at 4:15 PM',
                      type: 'system',
                      icon: TrendingUp,
                      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
                    }
                  ].map(act => {
                    const ActIcon = act.icon
                    return (
                      <div
                        key={act.id}
                        className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-emerald-300 hover:bg-white transition flex items-start justify-between gap-4 group"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="p-2.5 rounded-xl bg-white text-[#16834a] border border-slate-200 shadow-2xs group-hover:bg-[#E7F3E9] transition shrink-0 mt-0.5">
                            <ActIcon className="w-4 h-4 text-[#16834a]" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-900">{act.title}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${act.badgeColor}`}>
                                {act.type.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{act.detail}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{act.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT SIDEBAR COLUMN: Verification Metrics Summary & Coordinator Guidelines (span-1) */}
            <div className="space-y-6">
              
              {/* Verification Metrics Summary Sidebar Card */}
              <CoordinatorMetricsSidebar
                pendingCount={pendingCount}
                verifiedCount={verifiedCount}
                returnedCount={returnedCount}
                averageReviewTime={averageReviewTime}
                activeStatus={statusFilter}
                onStatusSelect={handleMetricStatusSelect}
              />
              
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="p-2 rounded-xl bg-emerald-50 text-[#16834a] border border-emerald-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Coordinator Guidelines</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Verification Standards & SLA Policy</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-[#064e2b] font-extrabold">
                      <Clock className="w-4 h-4 text-[#16834a]" />
                      <span>Review SLA Commitment</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px] font-medium pt-1">
                      Review pending student submissions within <strong>24 to 48 hours</strong> of submission to maintain institutional compliance.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-[#064e2b] font-extrabold">
                      <ShieldCheck className="w-4 h-4 text-[#16834a]" />
                      <span>Proof Document Criteria</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px] font-medium pt-1">
                      Ensure attached proof files are clear, unedited official certificates, certificates of participation, or verified publication links.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-[#064e2b] font-extrabold">
                      <Award className="w-4 h-4 text-[#16834a]" />
                      <span>Verification Scope Standards</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px] font-medium pt-1">
                      Achievements are verified based on scope level: Institutional, Local, Regional, National, or International. Ensure the submitted scope matches proof documents.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold">
                      <RotateCcw className="w-4 h-4 text-amber-700" />
                      <span>Return Remarks Requirement</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed text-[11px] font-medium pt-1">
                      Always provide clear, constructive feedback when returning an entry to a student so they can re-upload correct proof documents.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 2: VERIFICATION WORKSPACE (Master-Detail) ================= */}
      {activeTab === 'workspace' && (() => {
        // Multi-Criteria Filtering & Sorting Algorithm (Strictly Active AY 2025-2026)
        const finalSubmissions = (filteredSubmissions || []).filter(item => {
          // Strictly exclude past academic years from active verification queue
          const itemAY = item.academic_year || 'AY 2025-2026'
          if (itemAY !== 'AY 2025-2026') return false

          if (categoryFilter !== 'All Categories' && item.category !== categoryFilter) return false
          if (scopeFilter !== 'All Scopes' && item.scope_level !== scopeFilter) return false
          return true
        }).sort((a, b) => {
          if (sortBy === 'Newest') return new Date(b.date || 0) - new Date(a.date || 0)
          if (sortBy === 'Oldest') return new Date(a.date || 0) - new Date(b.date || 0)
          if (sortBy === 'Name') return (a.student_name || '').localeCompare(b.student_name || '')
          if (sortBy === 'Title') return (a.title || '').localeCompare(b.title || '')
          return 0
        })

        const workspaceItem = selectedWorkspaceItem || finalSubmissions[0] || null

        // Active Filter Counter & Reset Handler
        const activeFiltersCount =
          (categoryFilter !== 'All Categories' ? 1 : 0) +
          (scopeFilter !== 'All Scopes' ? 1 : 0) +
          (sortBy !== 'Newest' ? 1 : 0)

        const resetWorkspaceFilters = () => {
          setCategoryFilter('All Categories')
          setScopeFilter('All Scopes')
          setSortBy('Newest')
        }

        return (

          <div className="flex flex-col h-[calc(100vh-125px)] space-y-3 overflow-hidden animate-in fade-in duration-150">

            {/* === FIXED TOP CONTROLS CONTAINER (Shrink-0, Never Moves) === */}
            <div className="shrink-0 space-y-3">
              
              {/* Toolbar Header */}
              <div className="bg-white rounded-2xl px-5 py-3 border border-slate-200/90 shadow-2xs">
                <h2 className="text-base font-extrabold text-slate-900">Verification Workspace</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Review and verify active <strong className="text-[#16834a]">AY 2025-2026</strong> student achievement submissions
                </p>
              </div>

              {/* Unified Search & Filter Control Bar */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2">
                
                {/* Row 1: Search Bar Input + Status Filter Pills */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by title, student name, or Student ID..."
                      className="w-full pl-10 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#16834a] focus:bg-white transition"
                    />
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 md:pb-0">
                    {[
                      ['All', finalSubmissions.length],
                      ['Pending', finalSubmissions.filter(s => s.status === 'Pending').length],
                      ['Returned', finalSubmissions.filter(s => s.status === 'Returned').length],
                      ['Verified', finalSubmissions.filter(s => s.status === 'Verified').length]
                    ].map(([label, count]) => {
                      const isSelected = statusFilter === label
                      let activeClass = 'bg-[#176B43] text-white border-[#176B43]'
                      if (label === 'Pending') activeClass = 'bg-blue-600 text-white border-blue-600'
                      if (label === 'Returned') activeClass = 'bg-amber-600 text-white border-amber-600'
                      if (label === 'Verified') activeClass = 'bg-emerald-700 text-white border-emerald-700'

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setStatusFilter(label)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border whitespace-nowrap ${
                            isSelected
                              ? `${activeClass} shadow-2xs`
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {label} ({count})
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Row 2: Integrated Filter Controls */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  
                  {/* Category Dropdown */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-[#16834a] cursor-pointer"
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Academic">Academic</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Community">Community</option>
                    <option value="Athletics">Athletics</option>
                    <option value="Culture & Arts">Culture &amp; Arts</option>
                    <option value="Research & Innovation">Research</option>
                  </select>

                  {/* Scope Level Dropdown */}
                  <select
                    value={scopeFilter}
                    onChange={(e) => setScopeFilter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-[#16834a] cursor-pointer"
                  >
                    <option value="All Scopes">All Scope Levels</option>
                    <option value="Institutional / Campus-Wide">Institutional</option>
                    <option value="Local / City Level">Local / City</option>
                    <option value="Regional Level">Regional</option>
                    <option value="National Level">National</option>
                    <option value="International Level">International</option>
                  </select>

                  {/* Static Active Academic Year Indicator */}
                  <div className="w-full px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs font-extrabold text-[#064e2b] flex items-center justify-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#16834a]" />
                    <span>AY 2025-2026 (Active)</span>
                  </div>

                  {/* Sort Order Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-[#16834a] cursor-pointer"
                  >
                    <option value="Newest">Sort: Newest First</option>
                    <option value="Oldest">Sort: Oldest First</option>
                    <option value="Name">Sort: Student Name A-Z</option>
                    <option value="Title">Sort: Title A-Z</option>
                  </select>

                </div>

              </div>
            </div>



            {/* === MASTER-DETAIL SPLIT CONTAINER (100% Flex-1 Viewport Fit) === */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start min-h-0 overflow-hidden">

              {/* LEFT: Submission Queue Box (100% Fixed - Internal Scrollbar Only) */}
              <div className="lg:col-span-1 h-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col min-h-0">
                
                {/* Minimal Header Box */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                  <span className="text-xs font-extrabold text-slate-800 tracking-wide">Submission Queue</span>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                    {finalSubmissions.length}
                  </span>
                </div>

                {/* Item List (Internal Vertical Scrollbar Only) */}
                <div className="divide-y divide-slate-100 flex-1 overflow-y-auto min-h-0">
                  {finalSubmissions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-2">
                      <p className="font-bold text-slate-600">No submissions match your current filters.</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your category or status filters.</p>
                    </div>
                  ) : (
                    finalSubmissions.map(item => {
                      const isActive = workspaceItem?.id === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => { setSelectedWorkspaceItem(item); setWorkspaceRemarks('') }}
                          className={`w-full text-left px-4 py-3 transition cursor-pointer flex items-center justify-between gap-3 ${
                            isActive
                              ? 'bg-[#f2f9f4] border-l-3 border-[#69A97C]'
                              : 'hover:bg-slate-50/80 border-l-3 border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Avatar Badge */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5 transition ${
                              isActive
                                ? 'bg-[#176B43] text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {(item.student_name || '?').charAt(0)}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <p className={`text-xs leading-snug truncate ${isActive ? 'font-extrabold text-[#064e2b]' : 'font-bold text-slate-800'}`}>
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium truncate">
                                {item.student_name} • <span className="font-mono text-slate-400">{item.student_id}</span>
                              </p>
                              
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {/* Status Pill */}
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  item.status === 'Verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : item.status === 'Returned' ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {item.status}
                                </span>

                                {/* Category Tag */}
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70">
                                  {item.category}
                                </span>

                                {/* Docs Count */}
                                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  {item.docs_count} doc{item.docs_count !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Minimal Active Indicator Pill */}
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100/90 text-[#064e2b] text-[10px] font-extrabold border border-emerald-300/60 shrink-0">
                              Viewing
                            </span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>



              {/* RIGHT: Inspection & Verification Panel (Independently Scrollable Right Detail Panel) */}
              <div className="lg:col-span-2 h-full flex flex-col min-h-0">

                {!workspaceItem ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 flex flex-col items-center justify-center text-center space-y-3 h-full">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-extrabold text-slate-700">No Submission Selected</p>
                    <p className="text-xs text-slate-500 font-medium">Click on a submission from the queue to begin review.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden h-full flex flex-col min-h-0">

                    {/* Student Profile Header (Clean & Uncluttered - Fixed Top of Right Card) */}
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-4 shrink-0">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                          {(workspaceItem.student_name || '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 leading-snug truncate">{workspaceItem.student_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">Student ID: {workspaceItem.student_id}</p>
                          {workspaceItem.program && (
                            <p className="text-[11px] text-[#16834a] font-bold mt-0.5 truncate">{workspaceItem.program}</p>
                          )}
                        </div>
                      </div>

                      {/* Status Pill Badge */}
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-extrabold tracking-wide uppercase border shrink-0 ${
                        workspaceItem.status === 'Verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : workspaceItem.status === 'Returned' ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {workspaceItem.status}
                      </span>
                    </div>

                    {/* Student Detail Content Body (SCROLLS INSIDE RIGHT CARD) */}
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto min-h-0">

                      {/* Achievement Title Box */}
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Achievement Title</p>
                        <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{workspaceItem.title}</h3>
                      </div>

                      {/* Structured Metadata Grid */}
                      <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4.5 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4">
                          
                          {/* Category */}
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Category</p>
                            <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80">
                              {workspaceItem.category}
                            </span>
                          </div>

                          {/* Scope Level */}
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Scope Level</p>
                            <p className="text-xs font-bold text-slate-900">{workspaceItem.scope_level}</p>
                          </div>

                          {/* Rank / Position */}
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Rank / Position</p>
                            <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200/80">
                              {workspaceItem.rank_conferred || 'Participant'}
                            </span>
                          </div>

                          {/* Date Conferred */}
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Date Conferred</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                              <Calendar className="w-3.5 h-3.5 text-[#16834a]" />
                              <span>{workspaceItem.date}</span>
                            </div>
                          </div>

                          {/* Academic Year */}
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Academic Year</p>
                            <p className="text-xs font-bold text-slate-900">{workspaceItem.academic_year || 'AY 2025-2026'}</p>
                          </div>

                          {/* Semester */}
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Term / Semester</p>
                            <p className="text-xs font-bold text-slate-900">{workspaceItem.semester || '1st Semester'}</p>
                          </div>

                        </div>
                      </div>

                      {/* Event Name & Issuing Body Cards */}
                      {(workspaceItem.event_name || workspaceItem.issuer) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {workspaceItem.event_name && (
                            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Event / Competition Name</p>
                              <p className="text-xs font-bold text-slate-900 leading-snug">{workspaceItem.event_name}</p>
                            </div>
                          )}
                          {workspaceItem.issuer && (
                            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Issuing Body / Organization</p>
                              <p className="text-xs font-bold text-slate-900 leading-snug">{workspaceItem.issuer}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Narrative Description */}
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Narrative Description</p>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                          <p className="text-xs text-slate-800 font-medium leading-relaxed">{workspaceItem.description}</p>
                        </div>
                      </div>

                      {/* Supporting Documents & Proofs (Prominent & Always Accessible) */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <p className="text-xs font-extrabold text-slate-900">Supporting Documents &amp; Evidence ({workspaceItem.docs_count || 1})</p>
                        
                        {/* Certificate Document Card */}
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#16834a] flex items-center justify-center shrink-0 border border-emerald-100">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{workspaceItem.attached_file_name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">Validated PDF • ~345 KB</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedReviewItem(workspaceItem)}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>

                        {/* Photo Evidence Card */}
                        {workspaceItem.participation_photo_name && (
                          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{workspaceItem.participation_photo_name}</p>
                                <p className="text-[11px] text-slate-500 font-mono">Photo Evidence • ~1.2 MB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedReviewItem(workspaceItem)}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Photo</span>
                              </button>
                              <button
                                type="button"
                                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Previous Returned Remarks Display */}
                      {workspaceItem.return_remarks && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 space-y-1">
                          <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wide">Previous Return Remarks</p>
                          <p className="text-xs text-amber-900 font-medium leading-relaxed">{workspaceItem.return_remarks}</p>
                        </div>
                      )}

                      {/* Comments / Feedback Textarea (Prominent & Always Accessible) */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-slate-500" />
                          <label className="text-xs font-bold text-slate-800">Comments / Feedback</label>
                        </div>
                        <textarea
                          value={workspaceRemarks}
                          onChange={(e) => setWorkspaceRemarks(e.target.value)}
                          rows={3}
                          placeholder="Provide feedback or specify what needs to be revised..."
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#16834a] focus:bg-white transition resize-none"
                        />
                      </div>

                    </div>

                    {/* Fixed Bottom Decision Dock (Stays Fixed at Bottom of Right Card) */}
                    {workspaceItem.status !== 'Verified' ? (
                      <div className="shrink-0 bg-white px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md z-10">
                        <span className="text-[11px] text-slate-500 font-medium">
                          Select a decision action to update submission status
                        </span>
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (!workspaceRemarks.trim()) {
                                alert('Please provide feedback remarks in the textarea before returning this submission.')
                                return
                              }
                              setAllSubmissions(prev => prev.map(s =>
                                s.id === workspaceItem.id ? { ...s, status: 'Returned', return_remarks: workspaceRemarks.trim() } : s
                              ))
                              setSelectedWorkspaceItem(prev => prev ? { ...prev, status: 'Returned', return_remarks: workspaceRemarks.trim() } : prev)
                              setWorkspaceRemarks('')
                              triggerToast('Submission returned to student with your remarks.')
                            }}
                            className="px-5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                            <span>Return for Revision</span>
                          </button>

                          {workspaceItem.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => {
                                setAllSubmissions(prev => prev.map(s =>
                                  s.id === workspaceItem.id ? { ...s, status: 'Verified', return_remarks: '' } : s
                                ))
                                setSelectedWorkspaceItem(prev => prev ? { ...prev, status: 'Verified' } : prev)
                                setWorkspaceRemarks('')
                                triggerToast('Achievement approved & verified successfully!')
                              }}
                              className="px-6 py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#16834a] text-white font-extrabold text-xs shadow-2xs transition cursor-pointer flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Approve &amp; Verify</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="shrink-0 px-6 py-3 bg-emerald-50 border-t border-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-xs font-bold text-emerald-700">This submission has been verified and approved successfully.</p>
                      </div>
                    )}

                  </div>
                )}
              </div>

            </div>
          </div>
        )
      })()}

      {/* ================= TAB 3: STUDENTS ROSTER & PORTFOLIO INSPECTOR ================= */}
      {activeTab === 'students' && (
        selectedStudentDossier ? (
          (() => {
            // Filter submissions for this specific student
            const studentSubmissions = allSubmissions.filter(s =>
              s.student_name.toLowerCase().trim() === selectedStudentDossier.full_name.toLowerCase().trim() ||
              s.student_id === selectedStudentDossier.student_id
            )

            const studentVerified = studentSubmissions.filter(s => s.status === 'Verified')
            const studentPending = studentSubmissions.filter(s => s.status === 'Pending')
            const studentReturned = studentSubmissions.filter(s => s.status === 'Returned')

            // Apply active tab & category filtering
            let activeList = dossierActiveTab === 'all' ? studentSubmissions
              : dossierActiveTab === 'verified' ? studentVerified
              : dossierActiveTab === 'pending' ? studentPending
              : studentReturned

            if (dossierCategoryFilter !== 'All') {
              activeList = activeList.filter(s => s.category.toLowerCase() === dossierCategoryFilter.toLowerCase())
            }

            return (
              <div className="space-y-6 animate-in fade-in duration-200 font-sans pb-12">
                
                {/* Top Navigation & Action Header */}
                <div className="w-full mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentDossier(null)}
                    className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition shadow-2xs flex items-center gap-2 cursor-pointer w-fit"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#16834a]" />
                    <span>Back to Students Roster</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 hidden md:inline">
                      Program Coordinator • Inspecting Student Portfolio
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerToast(`Exported official portfolio report for ${selectedStudentDossier.full_name}`)}
                      className="px-4 py-2.5 rounded-2xl bg-[#EFF7F0] hover:bg-[#143326] text-white font-extrabold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Export Student Portfolio</span>
                    </button>
                  </div>
                </div>

                {/* Main Portfolio Container */}
                <div className="w-full space-y-6">

                  {/* HERO PROFILE BANNER CARD */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                    
                    {/* SVG Background Layer */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
                      <svg viewBox="0 0 1200 240" preserveAspectRatio="none" className="w-full h-full">
                        <defs>
                          <linearGradient id="coordinatorHeroGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#143d2b" />
                            <stop offset="50%" stopColor="#064e2b" />
                            <stop offset="100%" stopColor="#0d281e" />
                          </linearGradient>
                        </defs>
                        <path d="M 0,0 L 220,0 C 210,70 170,150 90,240 L 0,240 Z" fill="url(#coordinatorHeroGreenGrad)" />
                      </svg>

                      <div className="absolute top-0 left-0 w-[18%] h-full mix-blend-overlay opacity-30 pointer-events-none overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 40% 100%, 0 100%)' }}>
                        <img
                          src={campusBanner}
                          alt="NDMU Campus Backdrop"
                          width="1200"
                          height="240"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Banner Header Body */}
                    <div className="relative z-10 px-6 pt-5 sm:px-8 sm:pt-6 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-950/90 border border-amber-300/50 flex items-center justify-center text-amber-300 text-sm shadow-md shrink-0">
                          🔰
                        </div>
                        <div className="leading-tight">
                          <span className="text-sm font-black tracking-tight text-white block">AchieveNest</span>
                          <span className="text-[9px] font-bold text-[#245F42] tracking-widest uppercase block">NDMU</span>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-slate-400 tracking-wide font-serif italic hidden sm:block">
                        Veritas • Caritas • Excellentia
                      </div>
                    </div>

                    {/* White Reserved Content Area with Overlapping Avatar & Details */}
                    <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8 relative z-20">
                      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        
                        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                          
                          {/* Circular Profile Avatar */}
                          <div className="relative shrink-0 z-30 sm:-mb-1">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden aspect-square">
                              {selectedStudentDossier.avatar_url ? (
                                <img
                                  src={selectedStudentDossier.avatar_url}
                                  alt={selectedStudentDossier.full_name}
                                  className="w-full h-full object-cover rounded-full aspect-square"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#16834a] text-white font-black text-3xl flex items-center justify-center">
                                  {selectedStudentDossier.full_name.charAt(0)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Student Details & Info Chips */}
                          <div className="space-y-1.5 pt-1 sm:pt-0">
                            <div className="flex items-center gap-2">
                              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                                {selectedStudentDossier.full_name}
                              </h2>
                              <span className="w-5 h-5 rounded-full bg-[#16834a] text-white inline-flex items-center justify-center text-xs shadow-xs font-bold" title="Verified Account">
                                ✓
                              </span>
                            </div>

                            <p className="text-xs font-extrabold text-[#16834a]">{selectedStudentDossier.program || 'BS Computer Science'}</p>
                            <p className="text-xs text-slate-600 font-semibold">{selectedStudentDossier.year_level || '3rd Year Student'} • Notre Dame of Marbel University</p>
                            <p className="text-xs text-slate-500 font-medium">Koronadal City, South Cotabato</p>

                            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px]">
                              <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                                <GraduationCap className="w-3.5 h-3.5 text-[#16834a]" />
                                <span>{selectedStudentDossier.program}</span>
                              </div>

                              <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-[#16834a]" />
                                <span>{selectedStudentDossier.year_level}</span>
                              </div>

                              <div className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/90 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                                <CreditCard className="w-3.5 h-3.5 text-[#16834a]" />
                                <span>Student ID: {selectedStudentDossier.student_id}</span>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Far-Right Column: 4 Stat Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[90px]">
                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Submissions</p>
                            <p className="text-2xl font-black text-slate-900">{studentSubmissions.length}</p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center min-w-[90px]">
                            <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Verified</p>
                            <p className="text-2xl font-black text-emerald-800">{studentVerified.length}</p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-center min-w-[90px]">
                            <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">Pending</p>
                            <p className="text-2xl font-black text-blue-800">{studentPending.length}</p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-center min-w-[90px]">
                            <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Returned</p>
                            <p className="text-2xl font-black text-amber-800">{studentReturned.length}</p>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* MAIN TWO-COLUMN LAYOUT */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-6">

                      {/* About Me Card */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16834a] flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">About Me</h3>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          I am a dedicated and driven student enrolled in {selectedStudentDossier.program} at Notre Dame of Marbel University. With a strong passion for technology, community service, and academic excellence, I actively seek opportunities to grow both personally and professionally.
                        </p>
                      </div>

                      {/* Experience & Involvement Card */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16834a] flex items-center justify-center">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">Experience &amp; Involvement</h3>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm">President</p>
                              <p className="text-slate-500 font-semibold">Computer Society NDMU</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                              Aug 2025 – Present
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm">Dean's Lister</p>
                              <p className="text-slate-500 font-semibold">CEAC – Notre Dame of Marbel University</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                              AY 2024–2025
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm">Community Extension Volunteer</p>
                              <p className="text-slate-500 font-semibold">Koronadal City Barangay Program</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                              Jan – Mar 2025
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Student Accomplishment Record Section */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16834a] flex items-center justify-center">
                              <Award className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-slate-900">Student Accomplishment Record</h3>
                              <p className="text-xs text-slate-500 font-medium">Verified, pending, and returned student submissions</p>
                            </div>
                          </div>

                          {/* Category Dropdown Filter */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Category:</span>
                            <select
                              value={dossierCategoryFilter}
                              onChange={(e) => setDossierCategoryFilter(e.target.value)}
                              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800 outline-none focus:border-[#16834a] cursor-pointer"
                            >
                              <option value="All">All Categories</option>
                              <option value="Academic">Academic</option>
                              <option value="Leadership">Leadership</option>
                              <option value="Community">Community</option>
                              <option value="Athletics">Athletics</option>
                              <option value="Recognition">Recognition</option>
                            </select>
                          </div>
                        </div>

                        {/* 4 Status Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          <button
                            type="button"
                            onClick={() => setDossierActiveTab('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                              dossierActiveTab === 'all'
                                ? 'bg-[#176B43] text-white border-[#176B43] shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            All Submissions ({studentSubmissions.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDossierActiveTab('verified')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                              dossierActiveTab === 'verified'
                                ? 'bg-[#16834a] text-white border-[#16834a] shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Verified ({studentVerified.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDossierActiveTab('pending')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                              dossierActiveTab === 'pending'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Pending Review ({studentPending.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDossierActiveTab('returned')}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                              dossierActiveTab === 'returned'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Returned ({studentReturned.length})
                          </button>
                        </div>

                        {/* Active Submissions List Cards */}
                        <div className="space-y-4">
                          {activeList.length === 0 ? (
                            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                              <Award className="w-8 h-8 text-slate-400 mx-auto" />
                              <p className="text-xs font-bold text-slate-600">No {dossierActiveTab === 'all' ? '' : dossierActiveTab} accomplishments found</p>
                              <p className="text-[11px] text-slate-400">Try changing the status tab or category filter above.</p>
                            </div>
                          ) : (
                            activeList.map(item => (
                              <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4 hover:border-emerald-300 transition"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <span className="text-[10px] font-extrabold text-[#16834a] uppercase tracking-wider">Achievement Entry</span>
                                    <h4 className="text-base font-extrabold text-slate-900 leading-snug">{item.title}</h4>
                                  </div>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    item.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : item.status === 'Returned' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>
                                    {item.status.toUpperCase()}
                                  </span>
                                </div>

                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Category</p>
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                      {item.category}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Scope Level</p>
                                    <p className="font-bold text-slate-800">{item.scope_level}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Rank / Position</p>
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                                      {item.rank_conferred || 'Participant'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Date Conferred</p>
                                    <p className="font-bold text-slate-800">{item.date}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Academic Year</p>
                                    <p className="font-bold text-slate-800">{item.academic_year || 'AY 2025-2026'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Semester</p>
                                    <p className="font-bold text-slate-800">{item.semester || '1st Semester'}</p>
                                  </div>
                                </div>

                                {(item.event_name || item.issuer) && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    {item.event_name && (
                                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Event / Competition Name</p>
                                        <p className="font-extrabold text-slate-800">{item.event_name}</p>
                                      </div>
                                    )}
                                    {item.issuer && (
                                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Issuing Organization</p>
                                        <p className="font-extrabold text-slate-800">{item.issuer}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {item.description && (
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Description</p>
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs font-medium text-emerald-950">
                                      {item.description}
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2 pt-1 border-t border-slate-100">
                                  <p className="text-xs font-extrabold text-slate-800">Attached Proof Documents</p>
                                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2.5">
                                      <FileText className="w-4 h-4 text-[#16834a]" />
                                      <span className="font-extrabold text-slate-800">{item.attached_file_name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedReviewItem(item)}
                                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition"
                                    >
                                      View Document
                                    </button>
                                  </div>
                                </div>

                                {item.status === 'Returned' && item.return_remarks && (
                                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 space-y-1">
                                    <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Coordinator Revision Remarks</p>
                                    <p className="text-xs text-amber-950 font-medium">{item.return_remarks}</p>
                                  </div>
                                )}

                                {item.status === 'Pending' && (
                                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => handleReturn(item.id)}
                                      className="px-4 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs border border-amber-200 transition cursor-pointer"
                                    >
                                      Return for Revision
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleApprove(item.id)}
                                      className="px-4 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                                    >
                                      Approve &amp; Verify ✓
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                      </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-1 space-y-6">

                      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16834a] flex items-center justify-center">
                            <Mail className="w-4 h-4" />
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">Contact Information</h3>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Email</p>
                            <div className="p-3 rounded-2xl bg-[#E7F3E9]/70 border border-[#cbe6d2] font-semibold text-slate-800">
                              {selectedStudentDossier.email}
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Phone</p>
                            <div className="p-3 rounded-2xl bg-[#E7F3E9]/70 border border-[#cbe6d2] font-semibold text-slate-800">
                              +63 912 345 6789
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Address</p>
                            <div className="p-3 rounded-2xl bg-[#E7F3E9]/70 border border-[#cbe6d2] font-semibold text-slate-800">
                              Koronadal City, South Cotabato
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16834a] flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">Skills &amp; Competencies</h3>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          {[
                            { name: 'Leadership', level: 'Expert' },
                            { name: 'Communication', level: 'Expert' },
                            { name: 'Technical Skills', level: 'Proficient' },
                            { name: 'Teamwork', level: 'Expert' },
                            { name: 'Problem Solving', level: 'Proficient' },
                            { name: 'Time Management', level: 'Expert' }
                          ].map((sk, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                              <span className="font-bold text-slate-800">{sk.name}</span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                {sk.level}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              </div>
            )
          })()
        ) : (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Top Header Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#16834a] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Students</h2>
                  <p className="text-xs text-slate-500 font-medium">{filteredStudents.length} students in your program</p>
                </div>
              </div>

              {/* Toolbar: Search + Year Dropdown + Course Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                
                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, ID, or email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#E7F3E9]/70 border border-[#cbe6d2] text-xs font-medium text-slate-800 outline-none focus:border-[#16834a] transition"
                  />
                </div>

                {/* Year Level Filter Dropdown */}
                <div className="relative">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#E7F3E9]/70 border border-[#cbe6d2] text-xs font-bold text-slate-700 outline-none focus:border-[#16834a] cursor-pointer appearance-none"
                  >
                    <option value="All Years">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>

                {/* Course Filter Dropdown */}
                <div className="relative">
                  <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#E7F3E9]/70 border border-[#cbe6d2] text-xs font-bold text-slate-700 outline-none focus:border-[#16834a] cursor-pointer appearance-none"
                  >
                    <option value="All Courses">All Courses</option>
                    <option value="BS Computer Science">BS Computer Science</option>
                    <option value="BS Information Technology">BS Information Technology</option>
                    <option value="BS Nursing">BS Nursing</option>
                    <option value="BS Business Administration">BS Business Administration</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>

              </div>

            </div>

            {/* Simplified High-Readability Student Data Table */}
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs font-medium">
                No students found matching your search or filter criteria.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">Student Information</th>
                        <th className="py-3 px-4">Program</th>
                        <th className="py-3 px-4">Year Level</th>
                        <th className="py-3 px-4 text-center">Achievements</th>
                        <th className="py-3 px-4 text-center">Verified Points</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {filteredStudents.map(std => (
                        <tr
                          key={std.id}
                          onClick={() => setSelectedStudentDossier(std)}
                          className="hover:bg-emerald-50/60 transition cursor-pointer group"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={std.avatar_url}
                                alt={std.full_name}
                                className="w-9 h-9 rounded-full border border-slate-200 object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 group-hover:text-[#16834a] transition text-xs leading-tight">
                                  {std.full_name}
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {std.student_id} <span className="text-slate-300">•</span> {std.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-extrabold text-slate-800 text-xs leading-tight">{std.program}</p>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-extrabold text-slate-800 text-xs leading-tight">{std.year_level}</p>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 text-sm">{std.achievements_count}</span>
                            <span className="text-[10px] text-slate-500 font-semibold ml-2">
                              (<span className="text-emerald-700 font-bold">{std.verified_count} Verified</span> • <span className="text-amber-700 font-bold">{std.pending_count} Pending</span>)
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/90 text-[#064e2b] font-extrabold text-xs border border-emerald-200">
                              <TrendingUp className="w-3.5 h-3.5 text-[#16834a]" />
                              <span>{std.verified_points} Points</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedStudentDossier(std)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] text-white text-xs font-extrabold transition shadow-2xs flex items-center gap-1.5 mx-auto cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Inspect Dossier</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* REVIEW & APPROVAL PROOF MODAL */}
      {selectedReviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <button
              onClick={() => setSelectedReviewItem(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="p-3 rounded-2xl bg-[#E7F3E9] text-[#16834a] border border-[#cbe6d2]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Review Student Submission</h3>
                <p className="text-xs text-slate-500">{user.program_scope || 'BS Computer Science'} Verification</p>
              </div>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto pr-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{selectedReviewItem.title}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {selectedReviewItem.category}
                  </span>
                </div>
                <p className="text-slate-600 font-medium">Submitted by: <strong className="text-slate-900">{selectedReviewItem.student_name}</strong> ({selectedReviewItem.student_id})</p>
                <p className="text-slate-500 leading-relaxed">{selectedReviewItem.description}</p>
                
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Scope: {selectedReviewItem.scope_level}</span>
                  <span className="font-bold text-[#16834a]">Points: +{selectedReviewItem.points}</span>
                </div>
              </div>

              {/* Document Proof Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#16834a]" />
                  <span>Attached Supporting Proof Document</span>
                </p>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-xs">{selectedReviewItem.attached_file_name}</span>
                  <span className="text-[10px] font-bold text-[#16834a] px-2 py-0.5 bg-emerald-50 rounded-md">Validated PDF</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Return Remarks (Required if returning entry to student)
                </label>
                <textarea
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  rows={2}
                  placeholder="Specify missing document details or correction required..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 outline-none text-xs text-slate-800 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleReturn(selectedReviewItem.id)}
                  className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return with Remarks</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(selectedReviewItem.id)}
                  className="px-5 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Verify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
