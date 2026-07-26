import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVerification } from '../../hooks/useVerification'
import { useStudentRoster } from '../../hooks/useStudentRoster'
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
  Zap
} from 'lucide-react'



export default function CoordinatorDashboardView({ currentUser }) {
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
      docs_count: 1,
      attached_file_name: 'community_outreach_proof.pdf',
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
      docs_count: 1,
      attached_file_name: 'deans_lister_cert_ay2526.pdf',
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
      docs_count: 1,
      attached_file_name: 'org_president_appointment.pdf',
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
      docs_count: 1,
      attached_file_name: 'intramurals_volleyball_runnerup.pdf',
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
  const [selectedWorkspaceItem, setSelectedWorkspaceItem] = useState(null)
  const [workspaceRemarks, setWorkspaceRemarks] = useState('')
  const [returnRemarks, setReturnRemarks] = useState('')
  const [toastMessage, setToastMessage] = useState('')

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

  // (Filtered submissions and students are provided by useVerification & useStudentRoster hooks)


  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#2d8a4e] text-white text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-emerald-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= OVERVIEW TAB: Hero Banner + Program Scope + Content ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">

          {/* Hero Summary Banner */}
          <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">
            
            {/* Top Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Program Coordinator Dashboard</h1>
                  <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
                    Achievement Verification &amp; Management • {user.program_scope || 'BS Computer Science'}
                  </p>
                </div>
              </div>

              {/* NDMU Crest Emblem Badge */}
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1.5 flex items-center justify-center shrink-0 shadow-md self-start sm:self-auto">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#ffffff" opacity="0.9" />
                  <path d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z" fill="#1b4332" />
                  <path d="M50 30 L56 42 L69 42 L58 51 L62 64 L50 55 L38 64 L42 51 L31 42 L44 42 Z" fill="#f59e0b" />
                </svg>
              </div>
            </div>

            {/* 4 Stat Counter Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 relative z-10">
              
              <div className="p-4 rounded-2xl bg-[#133220]/90 border border-emerald-600/30">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>Pending Reviews</span>
                </div>
                <p className="text-3xl font-black text-white">{pendingCount}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#133220]/90 border border-emerald-600/30">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified</span>
                </div>
                <p className="text-3xl font-black text-white">{verifiedCount}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#133220]/90 border border-emerald-600/30">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                  <RotateCcw className="w-4 h-4 text-emerald-300" />
                  <span>Returned</span>
                </div>
                <p className="text-3xl font-black text-white">{returnedCount}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#133220]/90 border border-emerald-600/30">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                  <span>Avg Review Time</span>
                </div>
                <p className="text-3xl font-black text-white">2.5 hrs</p>
              </div>

            </div>

          </div>

          {/* Program Scope Filter Notice Banner */}
          <div className="p-4 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white text-[#2d8a4e] border border-[#cbe6d2] shrink-0 shadow-2xs">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#1e5831]">
                  Program Scope: {user.program_scope || 'BS Computer Science'}
                </p>
                <p className="text-[11px] text-emerald-800/80 font-medium mt-0.5">
                  You can only view and manage students enrolled in your assigned degree program.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#2d8a4e] text-white hidden sm:inline-block">
              ● Program Coordinator Mode
            </span>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT MAIN COLUMN: Recent Verification Activity Log (span-2) */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Recent Verification Activity Log</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Real-time audit stream for {user.program_scope || 'BS Computer Science'}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#1e5831] border border-emerald-200 text-[11px] font-bold">
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
                      badgeColor: 'bg-emerald-50 text-[#1e5831] border-emerald-200'
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
                          <div className="p-2.5 rounded-xl bg-white text-[#2d8a4e] border border-slate-200 shadow-2xs group-hover:bg-[#eef7f0] transition shrink-0 mt-0.5">
                            <ActIcon className="w-4 h-4 text-[#2d8a4e]" />
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

            {/* RIGHT SIDEBAR COLUMN: Coordinator Verification Guidelines (span-1) */}
            <div className="space-y-6">
              
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="p-2 rounded-xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Coordinator Guidelines</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Verification Standards & SLA Policy</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-[#1e5831] font-extrabold">
                      <Clock className="w-4 h-4 text-[#2d8a4e]" />
                      <span>Review SLA Commitment</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px] font-medium pt-1">
                      Review pending student submissions within <strong>24 to 48 hours</strong> of submission to maintain institutional compliance.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-[#1e5831] font-extrabold">
                      <ShieldCheck className="w-4 h-4 text-[#2d8a4e]" />
                      <span>Proof Document Criteria</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px] font-medium pt-1">
                      Ensure attached proof files are clear, unedited official certificates, certificates of participation, or verified publication links.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-[#1e5831] font-extrabold">
                      <Award className="w-4 h-4 text-[#2d8a4e]" />
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
        const workspaceItem = selectedWorkspaceItem || filteredSubmissions[0] || null
        return (
          <div className="space-y-4 animate-in fade-in duration-150">

            {/* === TOOLBAR === */}
            <div className="bg-white rounded-2xl px-5 py-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Verification Workspace</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Review and verify student achievement submissions</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>
                <button type="button" onClick={handleExportCSVReport} className="px-3.5 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm">
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Queue</span>
                </button>
              </div>
            </div>

            {/* === SEARCH + STATUS FILTER ROW === */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or student name..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition shadow-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {[['All', allSubmissions.length], ['Pending', allSubmissions.filter(s=>s.status==='Pending').length], ['Returned', allSubmissions.filter(s=>s.status==='Returned').length], ['Verified', allSubmissions.filter(s=>s.status==='Verified').length]].map(([label, count]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStatusFilter(label)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border whitespace-nowrap ${
                      statusFilter === label
                        ? label === 'Pending' ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : label === 'Returned' ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-[#2d8a4e] text-white border-[#2d8a4e] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label} {count > 0 ? `(${count})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* === MASTER-DETAIL SPLIT === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* LEFT: Queue List */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-extrabold text-slate-700">Submission Queue ({filteredSubmissions.length})</p>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {filteredSubmissions.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-medium">
                        No submissions match your current filters.
                      </div>
                    ) : (
                      filteredSubmissions.map(item => {
                        const isActive = workspaceItem?.id === item.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => { setSelectedWorkspaceItem(item); setWorkspaceRemarks('') }}
                            className={`w-full text-left p-4 transition cursor-pointer ${
                              isActive ? 'bg-blue-50 border-l-[3px] border-blue-500' : 'hover:bg-slate-50 border-l-[3px] border-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2d8a4e] flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5">
                                {(item.student_name || '?').charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-extrabold text-slate-900 leading-snug truncate">{item.title}</p>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{item.student_name}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === 'Verified' ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'Returned' ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {item.status}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">{item.docs_count} doc{item.docs_count !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: Inspection & Verification Panel */}
              <div className="lg:col-span-2">
                {!workspaceItem ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-extrabold text-slate-600">No Submission Selected</p>
                    <p className="text-xs text-slate-400 font-medium">Click on a submission from the queue to begin review.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

                    {/* Student Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-emerald-100 text-[#2d8a4e] flex items-center justify-center font-extrabold text-base shrink-0">
                          {(workspaceItem.student_name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{workspaceItem.student_name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">Student ID: {workspaceItem.student_id}</p>
                          {workspaceItem.program && (
                            <p className="text-[11px] text-[#2d8a4e] font-semibold">{workspaceItem.program}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                        workspaceItem.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : workspaceItem.status === 'Returned' ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {workspaceItem.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-6 space-y-5">

                      {/* Achievement Details */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Achievement Title</p>
                          <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{workspaceItem.title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Category</span>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">{workspaceItem.category}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Date</span>
                            <span className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {workspaceItem.date}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Scope Level</span>
                            <span className="text-xs font-semibold text-slate-700">{workspaceItem.scope_level}</span>
                          </div>
                          {workspaceItem.rank_conferred && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Rank / Position</span>
                              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-100">{workspaceItem.rank_conferred}</span>
                            </div>
                          )}
                          {workspaceItem.academic_year && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Academic Year</span>
                              <span className="text-xs font-semibold text-slate-700">{workspaceItem.academic_year}</span>
                            </div>
                          )}
                          {workspaceItem.semester && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Semester</span>
                              <span className="text-xs font-semibold text-slate-700">{workspaceItem.semester}</span>
                            </div>
                          )}
                        </div>
                        {(workspaceItem.event_name || workspaceItem.issuer) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                            {workspaceItem.event_name && (
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Event / Competition Name</p>
                                <p className="text-xs font-semibold text-slate-800 leading-snug">{workspaceItem.event_name}</p>
                              </div>
                            )}
                            {workspaceItem.issuer && (
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Issuing Body / Organization</p>
                                <p className="text-xs font-semibold text-slate-800 leading-snug">{workspaceItem.issuer}</p>
                              </div>
                            )}
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Description</p>
                          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-4 py-3">
                            <p className="text-xs text-emerald-900 font-medium leading-relaxed">{workspaceItem.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Supporting Documents */}
                      <div className="space-y-2.5">
                        <p className="text-xs font-extrabold text-slate-800">Supporting Documents ({workspaceItem.docs_count})</p>
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#2d8a4e]/10 text-[#2d8a4e] flex items-center justify-center shrink-0">
                              <Download className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">{workspaceItem.attached_file_name}</p>
                              <p className="text-[11px] text-slate-400 font-medium">~{Math.round(Math.random() * 300 + 200)} KB</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedReviewItem(workspaceItem)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Returned Remarks Display */}
                      {workspaceItem.return_remarks && (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">Previous Return Remarks</p>
                          <p className="text-xs text-amber-800 font-medium leading-relaxed">{workspaceItem.return_remarks}</p>
                        </div>
                      )}

                      {/* Comments / Feedback */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-slate-500" />
                          <p className="text-xs font-extrabold text-slate-800">Comments / Feedback</p>
                        </div>
                        <textarea
                          value={workspaceRemarks}
                          onChange={(e) => setWorkspaceRemarks(e.target.value)}
                          rows={3}
                          placeholder="Provide feedback or specify what needs to be revised..."
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] resize-none transition"
                        />
                      </div>

                      {/* Decision Action Bar */}
                      {workspaceItem.status !== 'Verified' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!workspaceRemarks.trim()) {
                                alert('Please provide feedback remarks before returning this submission.')
                                return
                              }
                              setAllSubmissions(prev => prev.map(s =>
                                s.id === workspaceItem.id ? { ...s, status: 'Returned', return_remarks: workspaceRemarks.trim() } : s
                              ))
                              setSelectedWorkspaceItem(prev => prev ? { ...prev, status: 'Returned', return_remarks: workspaceRemarks.trim() } : prev)
                              setWorkspaceRemarks('')
                              triggerToast('Submission returned to student with your remarks.')
                            }}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Return for Revision
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
                              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve &amp; Verify
                            </button>
                          )}
                        </div>
                      )}
                      {workspaceItem.status === 'Verified' && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <p className="text-xs font-bold text-emerald-700">This submission has been verified and approved successfully.</p>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )
      })()}

      {/* ================= TAB 3: STUDENTS ROSTER (Redesigned) ================= */}
      {activeTab === 'students' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Top Header Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center shadow-xs shrink-0">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#eef7f0]/70 border border-[#cbe6d2] text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition"
                />
              </div>

              {/* Year Level Filter Dropdown */}
              <div className="relative">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#eef7f0]/70 border border-[#cbe6d2] text-xs font-bold text-slate-700 outline-none focus:border-[#2d8a4e] cursor-pointer appearance-none"
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
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#eef7f0]/70 border border-[#cbe6d2] text-xs font-bold text-slate-700 outline-none focus:border-[#2d8a4e] cursor-pointer appearance-none"
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

          {/* Student Cards Grid (3 Columns) */}
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs font-medium">
              No students found matching your search or filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStudents.map(std => (
                <div
                  key={std.id}
                  onClick={() => setSelectedStudentDossier(std)}
                  className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-5"
                >
                  {/* Top Info: Avatar + Name + Student ID + Program */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-slate-800 text-white flex items-center justify-center font-extrabold text-base shrink-0 shadow-xs mt-0.5">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-extrabold text-slate-900 truncate leading-snug">{std.full_name}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{std.student_id}</p>
                      <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{std.program}</p>
                    </div>
                  </div>

                  {/* Middle Stats Container (Soft Light-Green Shaded Box) */}
                  <div className="bg-[#eef7f0] border border-[#cbe6d2] rounded-2xl p-4 grid grid-cols-2 gap-4">
                    {/* Achievements Stat */}
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>Achievements</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">{std.achievements_count}</p>
                    </div>

                    {/* Points Stat */}
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                        <span>Points</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">{std.verified_points}</p>
                    </div>
                  </div>

                  {/* Bottom Status Breakdown Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs font-bold">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>{std.verified_count} verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span>{std.pending_count} pending</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
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
              <div className="p-3 rounded-2xl bg-[#eef7f0] text-[#2d8a4e] border border-[#cbe6d2]">
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
                  <span className="font-bold text-[#2d8a4e]">Points: +{selectedReviewItem.points}</span>
                </div>
              </div>

              {/* Document Proof Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Attached Supporting Proof Document</span>
                </p>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-xs">{selectedReviewItem.attached_file_name}</span>
                  <span className="text-[10px] font-bold text-[#2d8a4e] px-2 py-0.5 bg-emerald-50 rounded-md">Validated PDF</span>
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 outline-none text-xs text-slate-800 transition resize-none"
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
                  className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold flex items-center gap-1.5 transition shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Verify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DOSSIER QUICK PREVIEW MODAL */}
      {selectedStudentDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <button
              onClick={() => setSelectedStudentDossier(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <img
                src={selectedStudentDossier.avatar_url}
                alt={selectedStudentDossier.full_name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#2d8a4e]"
              />
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedStudentDossier.full_name}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedStudentDossier.student_id} • {selectedStudentDossier.program}</p>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#2d8a4e] font-extrabold text-[10px] mt-1 inline-block border border-emerald-100">
                  {selectedStudentDossier.year_level}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Verified Points:</span>
                <span className="font-extrabold text-[#2d8a4e]">{selectedStudentDossier.verified_points} Points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted Achievements:</span>
                <span className="font-bold text-slate-800">{selectedStudentDossier.total_submissions} Entries</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Program Scope:</span>
                <span className="font-bold text-slate-800">BS Computer Science</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudentDossier(null)}
                className="px-5 py-2.5 rounded-2xl bg-[#2d8a4e] text-white font-bold text-xs shadow-md"
              >
                Close Summary ✓
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
