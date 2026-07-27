import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Trophy,
  Users,
  Award,
  ShieldCheck,
  TrendingUp,
  Search,
  Plus,
  Filter,
  UserCheck,
  Building2,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Clock,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Edit,
  Trash2,
  Lock,
  RefreshCw,
  Eye,
  Check,
  BarChart3
} from 'lucide-react'

import useOSAD from '../../hooks/useOSAD'

export default function OSADDashboardView({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const {
    metrics,
    awardCategories,
    awardees,
    accreditationReports,
    auditLogs,
    getUsers,
    getStudentLeaderboards,
    getAccreditationReportDetails,
    assignProgramCoordinator,
    assignOrganizationModerator,
    revokeRole,
    createAwardCategory,
    generateAwardCandidates,
    confirmAwardee,
    refreshAuditLogs
  } = useOSAD()

  // Account Management States
  const [userRoleFilter, setUserRoleFilter] = useState('all') // 'all' | 'student' | 'personnel'
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [selectedUserForRole, setSelectedUserForRole] = useState(null)
  const [roleModalType, setRoleModalType] = useState(null) // 'coordinator' | 'moderator'
  const [assignedProgram, setAssignedProgram] = useState('BS Computer Science')
  const [assignedOrg, setAssignedOrg] = useState('Computer Society NDMU')

  // Award Management States
  const [isAddAwardOpen, setIsAddAwardOpen] = useState(false)
  const [newAwardData, setNewAwardData] = useState({
    title: '',
    category_type: 'Student Leadership',
    description: '',
    min_points: 200,
    weight_multiplier: 1.5,
    required_prerequisites: 'Program Coordinator Verification',
    attached_template_id: 'OSAD-TPL-01',
    attached_template_name: 'Official NDMU Certificate of Participation'
  })

  // Identify Awardees States
  const [selectedCategoryForRanking, setSelectedCategoryForRanking] = useState(awardCategories[0]?.id || 'award-01')
  const [generatedCandidates, setGeneratedCandidates] = useState([])
  const [hasRanked, setHasRanked] = useState(false)
  const [leaderboardFilter, setLeaderboardFilter] = useState('all') // 'all' | 'CEAC' | 'CBA'

  // Accreditation Reports Inspection State
  const [selectedReportId, setSelectedReportId] = useState('rpt-01')
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  // Audit Log Search State
  const [auditSearchTerm, setAuditSearchTerm] = useState('')
  const [auditSeverityFilter, setAuditSeverityFilter] = useState('all')

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Handle Role Assignment
  const handleAssignRoleSubmit = (e) => {
    e.preventDefault()
    if (!selectedUserForRole) return

    if (roleModalType === 'coordinator') {
      assignProgramCoordinator(selectedUserForRole.id, assignedProgram)
      showToast(`Assigned Program Coordinator role for [${assignedProgram}] to ${selectedUserForRole.full_name}`)
    } else if (roleModalType === 'moderator') {
      assignOrganizationModerator(selectedUserForRole.id, assignedOrg)
      showToast(`Assigned Organization Moderator role for [${assignedOrg}] to ${selectedUserForRole.full_name}`)
    }

    setSelectedUserForRole(null)
    setRoleModalType(null)
  }

  // Handle Create Award Category
  const handleCreateAwardSubmit = (e) => {
    e.preventDefault()
    if (!newAwardData.title) return

    createAwardCategory(newAwardData)
    setIsAddAwardOpen(false)
    setNewAwardData({
      title: '',
      category_type: 'Student Leadership',
      description: '',
      min_points: 200,
      weight_multiplier: 1.5,
      required_prerequisites: 'Program Coordinator Verification',
      attached_template_id: 'OSAD-TPL-01',
      attached_template_name: 'Official NDMU Certificate of Participation'
    })
    showToast(`Created new award category: ${newAwardData.title}`)
  }

  // Handle Ranking Generation
  const handleRunRankingEngine = () => {
    const candidates = generateAwardCandidates(selectedCategoryForRanking)
    setGeneratedCandidates(candidates)
    setHasRanked(true)
    showToast(`Generated ranked candidate list for evaluation! (${candidates.length} candidates evaluated)`)
  }

  // Handle Awardee Confirmation
  const handleConfirmAwardeeAction = (candidate) => {
    confirmAwardee(candidate)
    setGeneratedCandidates(prev => prev.filter(c => c.student_id !== candidate.student_id))
    showToast(`Confirmed [${candidate.student_name}] as official awardee for ${candidate.award_title}!`)
  }

  const filteredUsers = getUsers(userRoleFilter, userSearchTerm)
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchSev = auditSeverityFilter === 'all' ? true : log.severity === auditSeverityFilter
    const term = auditSearchTerm.toLowerCase()
    const matchTerm = !term ? true : (
      log.admin_user.toLowerCase().includes(term) ||
      log.action_type.toLowerCase().includes(term) ||
      log.target_entity.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    )
    return matchSev && matchTerm
  })

  return (
    <div className="space-y-8 font-sans relative">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1b4332] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400/30 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="text-xs font-bold">{toastMessage}</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. OSAD EXECUTIVE COMMAND CENTER MODULE (tab === 'overview')              */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">

          {/* Hero Executive Header Banner (Pristine Executive Context) */}
          <div className="bg-[#1b4332] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#245233] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Trophy className="w-7 h-7 text-emerald-300" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                      CENTRAL EXECUTIVE GOVERNANCE
                    </span>
                    <span className="px-3 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold">
                      AY 2025-2026 • Main Campus
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    OSAD Executive Command Center
                  </h1>
                  <p className="text-xs text-emerald-200/90 font-medium max-w-2xl leading-relaxed">
                    Director Marcus Vance, Ph.D. • Central oversight suite for university user account governance, administrative role assignment, automated honor roll ranking, and institutional accreditation audit logs.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c2416] border border-[#1e4a30] shrink-0 self-start md:self-auto space-y-1">
                <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Accreditation Readiness</p>
                <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>97.8% PACUCOA & CHEd Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Executive Action & Governance Hub */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#2d8a4e]" />
                Executive Quick Action & Governance Hub
              </h2>
              <span className="text-[11px] font-bold text-slate-400">4 Administrative Workflows</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setSearchParams({ tab: 'accounts' })}
                className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-md hover:shadow-xl hover:border-emerald-300 transition duration-300 text-left flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2d8a4e] group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#2d8a4e] transition">Account & Role Governance</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Assign Program Coordinator & Org Moderator roles to faculty</p>
                </div>
              </button>

              <button
                onClick={() => setSearchParams({ tab: 'awardees' })}
                className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-md hover:shadow-xl hover:border-amber-300 transition duration-300 text-left flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700 transition">Award Ranking Engine</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Run automated multi-criteria honor roll scoring algorithm</p>
                </div>
              </button>

              <button
                onClick={() => setSearchParams({ tab: 'reports' })}
                className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-md hover:shadow-xl hover:border-blue-300 transition duration-300 text-left flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-800 transition">Accreditation Reports</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Export PACUCOA, CHEd, & OSAD annual audit PDFs/CSVs</p>
                </div>
              </button>

              <button
                onClick={() => setSearchParams({ tab: 'audit' })}
                className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-md hover:shadow-xl hover:border-purple-300 transition duration-300 text-left flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-800 transition">System Security Logs</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Inspect real-time administrative logs and security trail</p>
                </div>
              </button>
            </div>
          </div>

          {/* Redesigned High-Impact Executive KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex items-center gap-4 hover:shadow-lg transition">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0 font-bold">
                <Users className="w-6.5 h-6.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Enrolled Students</p>
                <p className="text-2xl font-extrabold text-slate-900">{metrics.total_students} Accounts</p>
                <p className="text-[11px] text-emerald-800 font-extrabold">5 Colleges • 18 Programs</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex items-center gap-4 hover:shadow-lg transition">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0 font-bold">
                <ShieldCheck className="w-6.5 h-6.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Verified Records</p>
                <p className="text-2xl font-extrabold text-[#2d8a4e]">{metrics.total_verified_achievements}</p>
                <p className="text-[11px] text-emerald-700 font-extrabold">+14.2% vs Last Academic Term</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex items-center gap-4 hover:shadow-lg transition">
              <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 font-bold">
                <Award className="w-6.5 h-6.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active OSAD Awards</p>
                <p className="text-2xl font-extrabold text-slate-900">{metrics.active_awards} Standards</p>
                <p className="text-[11px] text-amber-700 font-extrabold">OSAD Templates 01-05 Attached</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex items-center gap-4 hover:shadow-lg transition">
              <div className="w-13 h-13 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0 font-bold">
                <ShieldAlert className="w-6.5 h-6.5 text-[#2d8a4e]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Security & Audit Trail</p>
                <p className="text-2xl font-extrabold text-slate-900">Protected</p>
                <p className="text-[11px] text-slate-600 font-extrabold">Zero Unresolved Audit Alerts</p>
              </div>
            </div>
          </div>

          {/* University Achievement Analytics & Recent Awardees Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Achievement Analytics Graph Card */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-[#2d8a4e]" />
                  <span>University Achievement Distribution by College</span>
                </h3>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">AY 2025-2026</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800">CEAC - Engineering, Architecture & Computing</span>
                    <span className="text-[#2d8a4e]">420 Achievements (33.5%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#2d8a4e] rounded-full" style={{ width: '33.5%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800">CBA - Business & Accountancy</span>
                    <span className="text-[#2d8a4e]">310 Achievements (24.7%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '24.7%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800">CAS - Arts & Sciences</span>
                    <span className="text-[#2d8a4e]">280 Achievements (22.3%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '22.3%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800">CED - College of Education</span>
                    <span className="text-[#2d8a4e]">244 Achievements (19.5%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: '19.5%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmed Awardees List Card */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-amber-500" />
                  <span>Recent Confirmed OSAD Awardees</span>
                </h3>
                <button
                  onClick={() => setSearchParams({ tab: 'awardees' })}
                  className="text-xs font-bold text-[#2d8a4e] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {awardees.map(awd => (
                  <div key={awd.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">{awd.student_name}</p>
                      <p className="text-[11px] font-bold text-[#2d8a4e] truncate">{awd.award_title}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{awd.program} • {awd.total_score} pts</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-200 shrink-0">
                      Rank #{awd.rank}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACCOUNT MANAGEMENT & ROLE ASSIGNMENT MODULE (tab === 'accounts')        */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Module Header */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Account Management & Role Assignment Suite
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Inspect University Accounts & Assign Program Coordinator and Organization Moderator Roles
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl self-start md:self-auto">
              <button
                onClick={() => setUserRoleFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${userRoleFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All Accounts
              </button>
              <button
                onClick={() => setUserRoleFilter('student')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${userRoleFilter === 'student' ? 'bg-white text-[#2d8a4e] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Students
              </button>
              <button
                onClick={() => setUserRoleFilter('personnel')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${userRoleFilter === 'personnel' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Personnel & Faculty
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search accounts by name, ID number, department, or program..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">User Details</th>
                    <th className="p-4">ID Number</th>
                    <th className="p-4">Role Context</th>
                    <th className="p-4">Department / Program</th>
                    <th className="p-4">Assigned Administrative Roles</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        No user accounts found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(usr => (
                      <tr key={usr.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-extrabold text-slate-900">
                          <div>
                            <p className="text-xs">{usr.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{usr.email}</p>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-700">
                          {usr.student_id || usr.employee_id}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${usr.role === 'student' ? 'bg-emerald-50 text-[#2d8a4e] border-emerald-200' : 'bg-purple-50 text-purple-800 border-purple-200'}`}>
                            {usr.role === 'student' ? 'Student' : 'Faculty / Personnel'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-bold">
                          {usr.program || usr.department}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(!usr.assigned_roles || usr.assigned_roles.length === 0) ? (
                              <span className="text-[10px] text-slate-400 italic">None</span>
                            ) : (
                              usr.assigned_roles.map(r => (
                                <span key={r} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200 flex items-center gap-1">
                                  {r === 'program_coordinator' ? `Coordinator (${usr.coordinator_program})` :
                                   r === 'organization_moderator' ? `Moderator (${usr.moderator_org})` : r}
                                  <button
                                    onClick={() => {
                                      revokeRole(usr.id, r)
                                      showToast(`Revoked role [${r}] from ${usr.full_name}`)
                                    }}
                                    className="hover:text-rose-600 ml-1 cursor-pointer"
                                    title="Revoke Role"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {usr.role === 'personnel' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUserForRole(usr)
                                  setRoleModalType('coordinator')
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#2d8a4e] border border-emerald-200 text-[11px] font-extrabold transition cursor-pointer"
                              >
                                + Assign Coordinator
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUserForRole(usr)
                                  setRoleModalType('moderator')
                                }}
                                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-extrabold transition cursor-pointer"
                              >
                                + Assign Moderator
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AWARD MANAGEMENT MODULE (tab === 'awards')                               */}
      {/* ========================================================================= */}
      {activeTab === 'awards' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Module Header */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  University Award Categories & Scoring Criteria Setup
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Configure Multi-Criteria Scoring Standards, Point Multipliers, and Attached OSAD Certificate Templates
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddAwardOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Award Category</span>
            </button>
          </div>

          {/* Award Category Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {awardCategories.map(cat => (
              <div key={cat.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4 flex flex-col justify-between hover:shadow-xl transition duration-300">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold">
                      {cat.category_type}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">{cat.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">{cat.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase">Min Points</p>
                      <p className="font-extrabold text-[#2d8a4e] text-sm">{cat.min_points} pts</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase">Multiplier</p>
                      <p className="font-extrabold text-amber-700 text-sm">{cat.weight_multiplier}x</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px]">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase">Attached OSAD Template</p>
                    <p className="font-extrabold text-slate-900 truncate">{cat.attached_template_name} ({cat.attached_template_id})</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. IDENTIFY AWARDEES & RANKING ENGINE MODULE (tab === 'awardees')          */}
      {/* ========================================================================= */}
      {activeTab === 'awardees' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Module Header */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Automated Candidate Identification & Ranking Engine
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Run Algorithm Against Active Award Criteria to Generate Ranked Roster of Eligible Awardees
                </p>
              </div>
            </div>

            {/* Category Selector Controls */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <select
                value={selectedCategoryForRanking}
                onChange={(e) => {
                  setSelectedCategoryForRanking(e.target.value)
                  setHasRanked(false)
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#2d8a4e] cursor-pointer shadow-xs"
              >
                {awardCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.title} ({cat.min_points} pts min)</option>
                ))}
              </select>

              <button
                onClick={handleRunRankingEngine}
                className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Run Ranking Engine</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STUDENT POINTS LEADERBOARD GRAPH CARD                                      */}
          {/* ========================================================================= */}
          {(() => {
            const leaderboardData = getStudentLeaderboards(leaderboardFilter)
            const topStudent = leaderboardData[0]
            const secondStudent = leaderboardData[1]
            const thirdStudent = leaderboardData[2]

            return (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6">
                
                {/* Header & Filter Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Student Points Leaderboard & Analytics Graph</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#2d8a4e] border border-emerald-200 text-[10px] font-bold">
                          LIVE POINT RANKS
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Visualizing verified student achievement points across university colleges
                      </p>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: 'all', label: 'All Students' },
                      { id: 'CEAC', label: 'CEAC (Engineering & IT)' },
                      { id: 'CBA', label: 'CBA (Business)' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setLeaderboardFilter(f.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                          leaderboardFilter === f.id
                            ? 'bg-[#1b4332] text-white shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top 3 Podium Cards */}
                {leaderboardData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* #1 Top Ranker */}
                    {topStudent && (
                      <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-emerald-50/50 border-2 border-amber-400/50 shadow-md relative overflow-hidden flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="w-9 h-9 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shadow-md border border-amber-300">
                            🥇 #1
                          </span>
                          <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs shadow-xs">
                            {topStudent.total_points} PTS
                          </span>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 leading-snug">{topStudent.student_name}</h3>
                          <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">{topStudent.student_id} • {topStudent.program}</p>
                          <p className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>{topStudent.verified_count} Verified Proofs</span>
                          </p>
                        </div>

                        {/* Visual Bar */}
                        <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full w-full"></div>
                        </div>
                      </div>
                    )}

                    {/* #2 Ranker */}
                    {secondStudent && (
                      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="w-9 h-9 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center font-black text-sm border border-slate-300">
                            🥈 #2
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-800 text-white font-black text-xs shadow-xs">
                            {secondStudent.total_points} PTS
                          </span>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 leading-snug">{secondStudent.student_name}</h3>
                          <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">{secondStudent.student_id} • {secondStudent.program}</p>
                          <p className="text-[11px] font-bold text-slate-600 mt-1">
                            {secondStudent.verified_count} Verified Proofs
                          </p>
                        </div>

                        {/* Visual Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-[#2d8a4e] h-full rounded-full"
                            style={{ width: `${secondStudent.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* #3 Ranker */}
                    {thirdStudent && (
                      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="w-9 h-9 rounded-2xl bg-amber-900/10 text-amber-800 flex items-center justify-center font-black text-sm border border-amber-800/20">
                            🥉 #3
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-700 text-white font-black text-xs shadow-xs">
                            {thirdStudent.total_points} PTS
                          </span>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 leading-snug">{thirdStudent.student_name}</h3>
                          <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">{thirdStudent.student_id} • {thirdStudent.program}</p>
                          <p className="text-[11px] font-bold text-slate-600 mt-1">
                            {thirdStudent.verified_count} Verified Proofs
                          </p>
                        </div>

                        {/* Visual Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-[#2d8a4e] h-full rounded-full"
                            style={{ width: `${thirdStudent.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Main Visual Points Bar Graph Chart */}
                <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#2d8a4e]" />
                      <span>Visual Points Comparison Bar Graph</span>
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      Scale: 0 to 500 Points
                    </span>
                  </div>

                  {/* Graph Grid Lines */}
                  <div className="space-y-4 relative">
                    
                    {/* Axis Ticks */}
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 border-b border-slate-200 pb-1.5 px-1">
                      <span>0 PTS</span>
                      <span>100 PTS</span>
                      <span>200 PTS</span>
                      <span>300 PTS</span>
                      <span>400 PTS</span>
                      <span>500 PTS</span>
                    </div>

                    {/* Student Horizontal Points Bars */}
                    <div className="space-y-3.5 pt-1">
                      {leaderboardData.map((student) => (
                        <div key={student.id} className="space-y-1.5 group">
                          
                          {/* Student Header Label & Point Badge */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                                student.rank === 1 ? 'bg-amber-400 text-amber-950 font-black' :
                                student.rank === 2 ? 'bg-slate-300 text-slate-800' :
                                student.rank === 3 ? 'bg-amber-800/20 text-amber-800' : 'bg-slate-200 text-slate-600'
                              }`}>
                                #{student.rank}
                              </span>
                              <span className="font-extrabold text-slate-900">{student.student_name}</span>
                              <span className="text-slate-400 font-mono text-[11px]">({student.student_id})</span>
                              <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">• {student.program}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-500 font-mono">
                                {student.verified_count} Proofs
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs ${
                                student.rank === 1
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-50 text-[#1e5831] border border-emerald-200'
                              }`}>
                                {student.total_points} PTS
                              </span>
                            </div>
                          </div>

                          {/* Graphical Bar */}
                          <div className="w-full bg-slate-200/80 rounded-2xl h-4 p-0.5 border border-slate-200 overflow-hidden relative">
                            <div
                              className={`h-full rounded-xl transition-all duration-500 flex items-center justify-end pr-2 text-[9px] font-black text-white ${
                                student.rank === 1
                                  ? 'bg-gradient-to-r from-[#1b4332] via-[#2d8a4e] to-emerald-400 shadow-sm'
                                  : student.rank === 2
                                  ? 'bg-gradient-to-r from-[#1b4332] to-[#2d8a4e]'
                                  : 'bg-gradient-to-r from-slate-700 to-[#2d8a4e]'
                              }`}
                              style={{ width: `${Math.max(student.percentage, 8)}%` }}
                            >
                              <span className="drop-shadow-xs">{student.total_points}</span>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                </div>

              </div>
            )
          })()}

          {/* Evaluation Results Section */}
          {hasRanked && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-[#2d8a4e]" />
                  <span>Ranked Eligible Candidates ({generatedCandidates.length} Evaluated)</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200/80">
                    <tr>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Student ID</th>
                      <th className="p-4">Program</th>
                      <th className="p-4">Total Points</th>
                      <th className="p-4">Weighted Score</th>
                      <th className="p-4 text-right">Confirmation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {generatedCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          No candidates met the minimum point criteria for this category.
                        </td>
                      </tr>
                    ) : (
                      generatedCandidates.map(cand => (
                        <tr key={cand.student_id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 font-extrabold text-amber-700">
                            <span className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs">
                              #{cand.rank}
                            </span>
                          </td>
                          <td className="p-4 font-extrabold text-slate-900">{cand.student_name}</td>
                          <td className="p-4 font-mono font-bold text-slate-600">{cand.student_id}</td>
                          <td className="p-4 font-bold text-slate-700">{cand.program}</td>
                          <td className="p-4 font-extrabold text-[#2d8a4e]">{cand.total_points} pts</td>
                          <td className="p-4 font-extrabold text-amber-700 text-sm">{cand.weighted_score} pts</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleConfirmAwardeeAction(cand)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-extrabold transition shadow-xs cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirm Awardee</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Confirmed Awardees Roster Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-amber-500" />
              <span>Official Confirmed OSAD Awardees Roster</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">Rank</th>
                    <th className="p-4">Awardee Name</th>
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Degree Program</th>
                    <th className="p-4">Award Category</th>
                    <th className="p-4">Total Score</th>
                    <th className="p-4 text-right">Confirmed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {awardees.map(awd => (
                    <tr key={awd.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-extrabold text-amber-700">Rank #{awd.rank}</td>
                      <td className="p-4 font-extrabold text-slate-900">{awd.student_name}</td>
                      <td className="p-4 font-mono font-bold text-slate-600">{awd.student_id}</td>
                      <td className="p-4 text-slate-700 font-bold">{awd.program}</td>
                      <td className="p-4 font-extrabold text-[#2d8a4e]">{awd.award_title}</td>
                      <td className="p-4 font-extrabold text-amber-700">{awd.total_score} pts</td>
                      <td className="p-4 text-right text-slate-500 font-mono text-[11px]">{awd.confirmed_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REPORTS SECTION & ACCREDITATION SUITE (tab === 'reports')               */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 5. REPORTS SECTION & ACCREDITATION SUITE (tab === 'reports')               */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (() => {
        const activeReportDetails = getAccreditationReportDetails(selectedReportId)

        return (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Module Header */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    University Accreditation & Institutional Reports Suite
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Inspect Report Contents, Department Metrics & Included Records Prior to Exporting
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                <button
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>Full Screen Inspection</span>
                </button>
                
                <button
                  onClick={() => showToast(`Exported [${activeReportDetails.title}] as Official PDF Document!`)}
                  className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>Export Active Report PDF</span>
                </button>
              </div>
            </div>

            {/* Interactive Report Selector Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accreditationReports.map(rpt => {
                const isSelected = rpt.id === selectedReportId
                return (
                  <div
                    key={rpt.id}
                    onClick={() => setSelectedReportId(rpt.id)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-[#eef7f0] border-[#2d8a4e] shadow-md ring-2 ring-[#2d8a4e]/30'
                        : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1e5831] text-[10px] font-extrabold">
                          {rpt.agency}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-[#2d8a4e] text-white text-[9px] font-extrabold uppercase">
                            Inspecting Content
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{rpt.title}</h3>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 text-slate-600 font-bold">
                      <span>{rpt.accreditation_status}</span>
                      <span className="text-[#2d8a4e] font-extrabold">{rpt.total_student_achievements + rpt.total_faculty_accomplishments} total recs</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* LIVE REPORT DOCUMENT CONTENT INSPECTION PANEL */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 relative overflow-hidden">
              
              {/* Document Header Seal Banner */}
              <div className="border-b-2 border-slate-900/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#1b4332] text-white p-2.5 flex items-center justify-center shrink-0 shadow-md">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#0f4625" stroke="#f59e0b" strokeWidth="4" />
                      <circle cx="50" cy="50" r="28" fill="#ffffff" />
                      <path d="M50 28 L57 42 L72 42 L60 52 L65 67 L50 57 L35 67 L40 52 L28 42 L43 42 Z" fill="#f59e0b" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-amber-900 tracking-widest">NOTRE DAME OF MARBEL UNIVERSITY</p>
                    <p className="text-[9px] font-extrabold text-slate-500 uppercase">OFFICE OF STUDENT AFFAIRS & SERVICES (OSAD)</p>
                    <h2 className="text-lg font-serif font-extrabold text-slate-900 pt-0.5">{activeReportDetails.title}</h2>
                    <p className="text-xs font-bold text-[#2d8a4e] mt-0.5">Agency: {activeReportDetails.agency} • Period: {activeReportDetails.period} • Generated: {activeReportDetails.generated_date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 text-[#1e5831] border border-emerald-200 text-xs font-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2d8a4e]" />
                    <span>{activeReportDetails.accreditation_status}</span>
                  </span>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">Student Accomplishments</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{activeReportDetails.total_student_achievements} Records</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">Faculty Achievements</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{activeReportDetails.total_faculty_accomplishments} Records</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">Combined Total Scope</p>
                  <p className="text-xl font-extrabold text-[#2d8a4e] mt-0.5">{activeReportDetails.total_student_achievements + activeReportDetails.total_faculty_accomplishments} Verified</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">Compliance Index</p>
                  <p className="text-xl font-extrabold text-amber-700 mt-0.5">{activeReportDetails.accreditation_status}</p>
                </div>
              </div>

              {/* Section 1: Departmental Compliance Breakdown Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Section A: Departmental Achievement & Compliance Breakdown</span>
                </h3>

                <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200/80">
                      <tr>
                        <th className="p-3.5">College / Department</th>
                        <th className="p-3.5">Student Records</th>
                        <th className="p-3.5">Faculty Records</th>
                        <th className="p-3.5">Verification Rate</th>
                        <th className="p-3.5 text-right">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {activeReportDetails.departmentBreakdown.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-extrabold text-slate-900">{row.dept}</td>
                          <td className="p-3.5 font-bold text-[#2d8a4e]">{row.student_records} recs</td>
                          <td className="p-3.5 font-bold text-amber-800">{row.faculty_records} recs</td>
                          <td className="p-3.5 font-mono font-bold text-slate-700">{row.verification_rate}</td>
                          <td className="p-3.5 text-right">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1e5831] border border-emerald-200 text-[10px] font-extrabold">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Sample Included Verified Records Audit */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Section B: Sample Verified Bundled Accomplishment Entries</span>
                </h3>

                <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200/80">
                      <tr>
                        <th className="p-3.5">Accomplishment Title</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Owner / Faculty</th>
                        <th className="p-3.5">Department</th>
                        <th className="p-3.5">Verification Badge</th>
                        <th className="p-3.5 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {activeReportDetails.includedRecordsSample.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-extrabold text-slate-900">{item.title}</td>
                          <td className="p-3.5 font-semibold text-slate-600">{item.category}</td>
                          <td className="p-3.5 font-bold text-slate-800">{item.owner}</td>
                          <td className="p-3.5 font-mono text-slate-500">{item.dept}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold">
                              {item.verified_by}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono text-slate-500">{item.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Official Signatory Approval Box */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">Compiled & Certified By</p>
                  <p className="font-extrabold text-slate-900 text-sm">Director Marcus Vance, Ph.D.</p>
                  <p className="text-slate-500 font-medium text-[11px]">Director, Office of Student Affairs & Services (OSAD)</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">Institutional Verification Seal</p>
                  <p className="font-extrabold text-slate-900 text-sm">Notre Dame of Marbel University Central Registrar</p>
                  <p className="text-slate-500 font-medium text-[11px]">Accreditation Audit Serial: NDMU-OSAD-2026-ACC-882</p>
                </div>
              </div>

            </div>

            {/* Full Screen Preview Inspection Modal */}
            {isPreviewModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 relative">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-6 h-6 text-[#2d8a4e]" />
                      <h3 className="font-extrabold text-lg text-slate-900">Document Inspection View</h3>
                    </div>
                    
                    <button
                      onClick={() => setIsPreviewModalOpen(false)}
                      className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      ✕ Close Inspection
                    </button>
                  </div>

                  {/* Render Detailed Inspection */}
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h2 className="text-xl font-serif font-extrabold text-slate-900">{activeReportDetails.title}</h2>
                    <p className="text-xs text-slate-600 font-medium">Agency Target: {activeReportDetails.agency} • Status: {activeReportDetails.accreditation_status}</p>
                    
                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                      <p className="font-bold text-slate-800">Verification Certification:</p>
                      <p className="text-slate-600 leading-relaxed">
                        This official report contains {activeReportDetails.total_student_achievements} verified student achievements and {activeReportDetails.total_faculty_accomplishments} faculty accomplishments compiled from Notre Dame of Marbel University's central achievement ledger.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        showToast(`Exported ${activeReportDetails.title} PDF!`)
                        setIsPreviewModalOpen(false)
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-extrabold transition shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Confirm & Export PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )
      })()}

      {/* ========================================================================= */}
      {/* 6. SYSTEM AUDIT LOGS MODULE (tab === 'audit')                              */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Module Header */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2d8a4e] border border-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  System Security & Transaction Audit Logs
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Real-Time Security Trail Tracking Administrative Role Changes, Verification Overrides, and Criteria Updates
                </p>
              </div>
            </div>

            <button
              onClick={() => showToast('Exported Security Audit Trail CSV!')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Audit CSV</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 flex items-center gap-3 w-full">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search audit logs by admin user, action type, or target entity..."
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={auditSeverityFilter}
                onChange={(e) => setAuditSeverityFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
              </select>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Admin User</th>
                    <th className="p-4">Action Type</th>
                    <th className="p-4">Target Entity</th>
                    <th className="p-4">Transaction Details</th>
                    <th className="p-4 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        No audit logs found matching your filter parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-mono text-[11px] text-slate-500 font-bold">{log.timestamp}</td>
                        <td className="p-4 font-extrabold text-slate-900">{log.admin_user}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-extrabold border border-slate-200">
                            {log.action_type}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-800">{log.target_entity}</td>
                        <td className="p-4 text-slate-600 font-medium max-w-xs truncate">{log.details}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${log.severity === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : log.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Assign Role Modal */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#2d8a4e]" />
                <span>Assign {roleModalType === 'coordinator' ? 'Program Coordinator' : 'Organization Moderator'} Role</span>
              </h3>
              <button onClick={() => setSelectedUserForRole(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Target Faculty Member</p>
                <p className="text-xs font-extrabold text-slate-900">{selectedUserForRole.full_name}</p>
                <p className="text-[11px] text-slate-500 font-medium">{selectedUserForRole.department}</p>
              </div>

              {roleModalType === 'coordinator' ? (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Select Academic Program</label>
                  <select
                    value={assignedProgram}
                    onChange={(e) => setAssignedProgram(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                  >
                    <option value="BS Computer Science">BS Computer Science</option>
                    <option value="BS Information Technology">BS Information Technology</option>
                    <option value="BS Civil Engineering">BS Civil Engineering</option>
                    <option value="BS Business Administration">BS Business Administration</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Select Student Organization</label>
                  <select
                    value={assignedOrg}
                    onChange={(e) => setAssignedOrg(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                  >
                    <option value="Computer Society NDMU">Computer Society NDMU</option>
                    <option value="Junior Executive Club">Junior Executive Club</option>
                    <option value="Supreme Student Council">Supreme Student Council</option>
                    <option value="Civil Engineering Association">Civil Engineering Association</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUserForRole(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition"
                >
                  Confirm & Assign Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Award Category Modal */}
      {isAddAwardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Create New OSAD Award Category</span>
              </h3>
              <button onClick={() => setIsAddAwardOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateAwardSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Award Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Outstanding Student Researcher of the Year"
                  value={newAwardData.title}
                  onChange={(e) => setNewAwardData({ ...newAwardData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Category Type</label>
                <select
                  value={newAwardData.category_type}
                  onChange={(e) => setNewAwardData({ ...newAwardData, category_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                >
                  <option value="Student Leadership">Student Leadership</option>
                  <option value="Research & Innovation">Research & Innovation</option>
                  <option value="Sports & Athletics">Sports & Athletics</option>
                  <option value="Culture & Arts">Culture & Arts</option>
                  <option value="Academic Excellence">Academic Excellence</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Min Points Required</label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={newAwardData.min_points}
                    onChange={(e) => setNewAwardData({ ...newAwardData, min_points: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Scoring Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="3.0"
                    value={newAwardData.weight_multiplier}
                    onChange={(e) => setNewAwardData({ ...newAwardData, weight_multiplier: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Attached OSAD Certificate Template</label>
                <select
                  value={newAwardData.attached_template_id}
                  onChange={(e) => setNewAwardData({
                    ...newAwardData,
                    attached_template_id: e.target.value,
                    attached_template_name: e.target.options[e.target.selectedIndex].text
                  })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                >
                  <option value="OSAD-TPL-01">Official NDMU Certificate of Participation</option>
                  <option value="OSAD-TPL-02">Certificate of Leadership & Merit</option>
                  <option value="OSAD-TPL-03">Certificate of Workshop Completion</option>
                  <option value="OSAD-TPL-04">Excellence & Special Distinction Award</option>
                  <option value="OSAD-TPL-05">NDMU Sports & Athletics Accreditation Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Description & Criteria Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe award objectives and criteria details..."
                  value={newAwardData.description}
                  onChange={(e) => setNewAwardData({ ...newAwardData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAwardOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
