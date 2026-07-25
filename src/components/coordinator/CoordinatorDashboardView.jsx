import React, { useState } from 'react'
import { 
  Shield, 
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
  ExternalLink
} from 'lucide-react'

export default function CoordinatorDashboardView({ currentUser }) {
  const user = currentUser || {
    full_name: 'Dr. Ana Reyes',
    program_scope: 'BS Computer Science',
    department: 'Department of Computer Studies'
  }

  // Active Workspace Tab: 'overview' | 'workspace' | 'students' | 'reports'
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All') // 'All' | 'Pending' | 'Verified' | 'Returned'

  // Master List of Student Submissions (BS Computer Science Scope)
  const [allSubmissions, setAllSubmissions] = useState([
    {
      id: 101,
      title: 'Community Outreach Volunteer',
      student_name: 'Maria Santos',
      student_id: '2024-01234',
      program: 'BS Computer Science',
      category: 'Community',
      date: '3/20/2026',
      docs_count: 1,
      attached_file_name: 'community_outreach_proof.pdf',
      description: 'Participated in a 3-day barangay digital literacy workshop for local officials.',
      scope_level: 'Local / City Level',
      rank_conferred: 'Participant / Special Award',
      points: 5,
      status: 'Pending'
    },
    {
      id: 102,
      title: 'Regional Coding Hackathon Champion',
      student_name: 'Angela Castro',
      student_id: '2024-05678',
      program: 'BS Computer Science',
      category: 'Academic',
      date: '3/18/2026',
      docs_count: 2,
      attached_file_name: 'dict_hackathon_certificate.pdf',
      description: 'Awarded 1st Place overall in the Region XII IT Summit Software Development Hackathon.',
      scope_level: 'Regional (Region XII)',
      rank_conferred: 'Champion / 1st Place',
      points: 15,
      status: 'Pending'
    },
    {
      id: 103,
      title: 'Dean\'s Lister - First Semester AY 2025-2026',
      student_name: 'Maria Santos',
      student_id: '2024-01234',
      program: 'BS Computer Science',
      category: 'Academic',
      date: '2/10/2026',
      docs_count: 1,
      attached_file_name: 'deans_lister_cert_ay2526.pdf',
      description: 'Achieved GPA of 3.85 for 1st Semester AY 2025-2026.',
      scope_level: 'Institutional / Campus-Wide',
      rank_conferred: 'Dean\'s Lister',
      points: 10,
      status: 'Verified'
    },
    {
      id: 104,
      title: 'Computer Society President',
      student_name: 'Juan Dela Cruz',
      student_id: '2023-0142',
      program: 'BS Computer Science',
      category: 'Leadership',
      date: '1/15/2026',
      docs_count: 1,
      attached_file_name: 'org_president_appointment.pdf',
      description: 'Elected President of the NDMU Computer Society for AY 2025-2026.',
      scope_level: 'Institutional / Campus-Wide',
      rank_conferred: 'Leadership Officer / Lead',
      points: 10,
      status: 'Verified'
    },
    {
      id: 105,
      title: 'University Sports Fest Volleyball Finalist',
      student_name: 'Mark Bautista',
      student_id: '2023-0988',
      program: 'BS Computer Science',
      category: 'Athletics',
      date: '12/05/2025',
      docs_count: 1,
      attached_file_name: 'intramurals_volleyball_runnerup.pdf',
      description: '2nd Place finish in NDMU Intramurals Men\'s Volleyball Tournament.',
      scope_level: 'Institutional / Campus-Wide',
      rank_conferred: 'Finalist / Runner-Up',
      points: 5,
      status: 'Returned',
      return_remarks: 'Please attach an official signed certification from the Athletics Office. Scanned photo is unreadable.'
    }
  ])

  // Program Student Roster (BS Computer Science Only)
  const [studentRoster] = useState([
    {
      id: 'usr_std_001',
      student_id: '2024-01234',
      full_name: 'Maria Santos',
      program: 'BS Computer Science',
      year_level: '3rd Year',
      verified_points: 30,
      total_submissions: 5,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    {
      id: 'usr_std_002',
      student_id: '2024-05678',
      full_name: 'Angela Castro',
      program: 'BS Computer Science',
      year_level: '2nd Year',
      verified_points: 25,
      total_submissions: 3,
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
    },
    {
      id: 'usr_std_003',
      student_id: '2023-0142',
      full_name: 'Juan Dela Cruz',
      program: 'BS Computer Science',
      year_level: '3rd Year',
      verified_points: 40,
      total_submissions: 6,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      id: 'usr_std_004',
      student_id: '2023-0988',
      full_name: 'Mark Bautista',
      program: 'BS Computer Science',
      year_level: '4th Year',
      verified_points: 15,
      total_submissions: 2,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    }
  ])

  const [selectedReviewItem, setSelectedReviewItem] = useState(null)
  const [selectedStudentDossier, setSelectedStudentDossier] = useState(null)
  const [returnRemarks, setReturnRemarks] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Summary counts
  const pendingCount = allSubmissions.filter(s => s.status === 'Pending').length
  const verifiedCount = allSubmissions.filter(s => s.status === 'Verified').length
  const returnedCount = allSubmissions.filter(s => s.status === 'Returned').length

  // Approve action
  const handleApprove = (itemId) => {
    setAllSubmissions(prev => prev.map(item => 
      item.id === itemId ? { ...item, status: 'Verified', return_remarks: '' } : item
    ))
    triggerToast('Achievement approved & verified successfully!')
    setSelectedReviewItem(null)
  }

  // Return action
  const handleReturn = (itemId) => {
    if (!returnRemarks.trim()) {
      alert('Please provide remarks explaining why the achievement is being returned.')
      return
    }
    setAllSubmissions(prev => prev.map(item => 
      item.id === itemId ? { ...item, status: 'Returned', return_remarks: returnRemarks.trim() } : item
    ))
    triggerToast('Achievement returned to student with remarks.')
    setSelectedReviewItem(null)
    setReturnRemarks('')
  }

  // Export Program CSV Report
  const handleExportCSVReport = () => {
    const headers = ['Submission ID', 'Student Name', 'Student ID', 'Title', 'Category', 'Scope Level', 'Points', 'Status', 'Date']
    const rows = allSubmissions.map(s => [
      `SUB-${s.id}`,
      `"${s.student_name}"`,
      `"${s.student_id}"`,
      `"${s.title.replace(/"/g, '""')}"`,
      `"${s.category}"`,
      `"${s.scope_level}"`,
      s.points,
      `"${s.status}"`,
      `"${s.date}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `BS_Computer_Science_Verification_Report_2026.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    triggerToast('BS Computer Science verification CSV report downloaded!')
  }

  // Filtered Submissions for Tab 2 (Workspace)
  const filteredSubmissions = allSubmissions.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filtered Students for Tab 3 (Roster)
  const filteredStudents = studentRoster.filter(std => 
    std.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    std.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

      {/* ================= 1. HERO SUMMARY BANNER ================= */}
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
                Achievement Verification & Management • {user.program_scope || 'BS Computer Science'}
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

      {/* ================= WORKSPACE TAB BAR NAVIGATION ================= */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#2d8a4e] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'workspace'
                ? 'bg-[#2d8a4e] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Verification Workspace</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'students'
                ? 'bg-[#2d8a4e] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students ({studentRoster.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#2d8a4e] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports & Analytics</span>
          </button>
        </div>

        {/* Quick Report CSV Export Action */}
        <button
          type="button"
          onClick={handleExportCSVReport}
          className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#2d8a4e] font-extrabold text-xs border border-emerald-200 transition cursor-pointer flex items-center gap-1.5 ml-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Report</span>
        </button>

      </div>

      {/* ================= 2. PROGRAM SCOPE FILTER NOTICE BANNER ================= */}
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

      {/* ================= TAB 1: OVERVIEW WORKSPACE ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* PENDING VERIFICATION QUEUE */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Pending Verification Queue</h2>
                <p className="text-xs text-slate-500 mt-0.5">BS Computer Science students only</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#1e5831] border border-emerald-200 text-xs font-bold">
                {pendingCount} pending
              </span>
            </div>

            <div className="space-y-3">
              {allSubmissions.filter(s => s.status === 'Pending').length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-[#2d8a4e] mx-auto mb-2" />
                  <p className="font-bold text-slate-800 text-sm">Verification Queue Clear!</p>
                  <p className="text-slate-400 mt-1">All student achievement submissions for BS Computer Science have been reviewed.</p>
                </div>
              ) : (
                allSubmissions.filter(s => s.status === 'Pending').map(item => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#2d8a4e] hover:shadow-md transition flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-[#eef7f0] group-hover:text-[#2d8a4e] transition">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#2d8a4e] transition">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-600 font-medium">{item.student_name}</span>
                          <span className="text-slate-300">•</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400 font-medium">{item.date}</p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{item.docs_count} docs</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedReviewItem(item)}
                        className="px-4 py-2 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* VERIFICATION SUMMARY CARDS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Verification Summary — {user.program_scope || 'BS Computer Science'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-[#eef7f0]/60 border border-[#cbe6d2]">
                <p className="text-3xl font-black text-[#2d8a4e] mb-1">{verifiedCount}</p>
                <p className="text-xs font-bold text-[#1e5831]">Verified Achievements</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#eef7f0]/60 border border-[#cbe6d2]">
                <p className="text-3xl font-black text-[#1e5831] mb-1">{pendingCount}</p>
                <p className="text-xs font-bold text-[#1e5831]">Pending Review</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#eef7f0]/60 border border-[#cbe6d2]">
                <p className="text-3xl font-black text-amber-700 mb-1">{returnedCount}</p>
                <p className="text-xs font-bold text-amber-800">Returned with Remarks</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB 2: VERIFICATION WORKSPACE ================= */}
      {activeTab === 'workspace' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Verification Queue Workspace</h2>
              <p className="text-xs text-slate-500 font-medium">Filter, inspect proofs, and verify student accomplishment submissions</p>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5">
              {['All', 'Pending', 'Verified', 'Returned'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    statusFilter === st 
                      ? 'bg-[#2d8a4e] text-white shadow-2xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, achievement title, or category..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#2d8a4e] transition"
            />
          </div>

          {/* Detailed Submissions Table */}
          <div className="space-y-3">
            {filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-500 text-xs font-medium">
                No submissions found matching your search or filter criteria.
              </div>
            ) : (
              filteredSubmissions.map(item => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        item.status === 'Verified' 
                          ? 'bg-emerald-50 text-[#2d8a4e] border-emerald-200'
                          : item.status === 'Returned'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.status === 'Verified' ? '✓ Verified' : item.status === 'Returned' ? '💬 Returned' : '⏳ Pending'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      Student: <strong className="text-slate-800">{item.student_name}</strong> ({item.student_id}) • Scope: {item.scope_level}
                    </p>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {item.description}
                    </p>

                    {item.return_remarks && (
                      <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                        <strong>Remarks:</strong> {item.return_remarks}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => setSelectedReviewItem(item)}
                      className="px-4 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#2d8a4e] font-extrabold text-xs border border-emerald-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect Proof</span>
                    </button>

                    {item.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        className="px-4 py-2 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ================= TAB 3: STUDENTS ROSTER ================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Program Student Roster Directory</h2>
              <p className="text-xs text-slate-500 font-medium">Students enrolled in BS Computer Science program</p>
            </div>

            <div className="w-full sm:w-72 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student name or ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-[#2d8a4e] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredStudents.map(std => (
              <div
                key={std.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={std.avatar_url}
                    alt={std.full_name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#2d8a4e] shrink-0"
                  />
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900">{std.full_name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{std.student_id} • {std.year_level}</p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#2d8a4e] font-extrabold text-[10px] border border-emerald-100">
                        {std.verified_points} Points
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{std.total_submissions} entries</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudentDossier(std)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-[#2d8a4e] text-slate-700 hover:text-white transition cursor-pointer shrink-0 border border-slate-200"
                  title="View Student Dossier"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ================= TAB 4: REPORTS & ANALYTICS ================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Program Verification Metrics & Analytics</h2>
                <p className="text-xs text-slate-500 font-medium">Compliance performance for BS Computer Science</p>
              </div>
              <button
                type="button"
                onClick={handleExportCSVReport}
                className="px-4 py-2.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Program CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <p className="text-xs font-bold text-slate-600">Verification Compliance Rate</p>
                <p className="text-3xl font-black text-[#2d8a4e]">85%</p>
                <p className="text-[11px] text-emerald-800 font-semibold">High institutional compliance</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <p className="text-xs font-bold text-slate-600">Avg Verification Turnaround</p>
                <p className="text-3xl font-black text-[#2d8a4e]">2.5 Hours</p>
                <p className="text-[11px] text-emerald-800 font-semibold">Well within 24h SLA target</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <p className="text-xs font-bold text-slate-600">Total Program Verified Points</p>
                <p className="text-3xl font-black text-[#2d8a4e]">110 Points</p>
                <p className="text-[11px] text-emerald-800 font-semibold">Accumulated TOPSIS score</p>
              </div>
            </div>
          </div>

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
