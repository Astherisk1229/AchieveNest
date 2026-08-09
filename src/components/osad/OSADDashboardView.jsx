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
  ChevronDown,
  BarChart3
} from 'lucide-react'

import useOSAD from '../../hooks/useOSAD'
import campusBanner from '../../assets/ndmu_campus_banner.png'
import PersonnelSelectorModal from './PersonnelSelectorModal'
import SearchablePersonnelDropdown from './SearchablePersonnelDropdown'
import OSADAccountsTab from './tabs/OSADAccountsTab'
import OSADAwardeesTab from './tabs/OSADAwardeesTab'
import OSADReportsTab from './tabs/OSADReportsTab'
import OSADAuditTab from './tabs/OSADAuditTab'

export default function OSADDashboardView({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const {
    metrics,
    departments,
    organizations,
    clubs,
    awardCategories,
    awardees,
    accreditationReports,
    auditLogs,
    getUsers,
    getPersonnelList,
    getStudentPortfolios,
    createDepartment,
    createOrganization,
    createClub,
    getStudentLeaderboards,
    getAccreditationReportDetails,
    assignCollegeDean,
    assignProgramCoordinator,
    assignOrganizationModerator,
    revokeRole,
    createAwardCategory,
    generateAwardCandidates,
    confirmAwardee,
    refreshAuditLogs
  } = useOSAD()

  // Account & Portfolio Viewing States
  const [userRoleFilter, setUserRoleFilter] = useState('student') // 'student' | 'personnel'
  const [selectedCollege, setSelectedCollege] = useState('all') // 'all' | 'CEAC' | 'CBA' | 'CAS' | 'CED'
  const [selectedSort, setSelectedSort] = useState('name') // 'name' | 'id' | 'points' | 'proofs'
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [selectedUserForRole, setSelectedUserForRole] = useState(null)
  const [roleModalType, setRoleModalType] = useState(null) // 'coordinator' | 'moderator'
  const [assignedProgram, setAssignedProgram] = useState('BS Computer Science')
  const [assignedOrg, setAssignedOrg] = useState('Computer Society NDMU')
  const [viewingStudentPortfolio, setViewingStudentPortfolio] = useState(null)
  const [portfolioModalPage, setPortfolioModalPage] = useState(1) // 1 | 2 | 3
  const [personnelSelectorTarget, setPersonnelSelectorTarget] = useState(null) // { title, targetName, roleType }

  // Personnel Selection Utility Search Query
  const [personnelSearchQuery, setPersonnelSearchQuery] = useState('')

  // Department, Organization & Club Modal States
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false)
  const [newDeptData, setNewDeptData] = useState({ name: '', code: '', programs: 'BS Computer Science, BS Information Technology' })
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false)
  const [newOrgData, setNewOrgData] = useState({ name: '', category: 'CEAC — Department Organization' })
  const [isAddClubOpen, setIsAddClubOpen] = useState(false)
  const [newClubData, setNewClubData] = useState({ name: '', parent_org: 'Computer Society NDMU', category: 'Non-Academic Club & Extra-Curricular' })

  // Award Category Form State
  const [isAddAwardOpen, setIsAddAwardOpen] = useState(false)
  const [newAwardData, setNewAwardData] = useState({
    title: '',
    category_type: 'Academic Excellence',
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

  // Handle Create Department with Auto-Reconciliation Toast
  const handleCreateDepartmentSubmit = (e) => {
    e.preventDefault()
    if (!newDeptData.name) return
    const progs = newDeptData.programs.split(',').map(p => p.trim()).filter(Boolean)
    const result = createDepartment({ name: newDeptData.name, code: newDeptData.code, programs: progs })
    setIsAddDeptOpen(false)
    setNewDeptData({ name: '', code: '', programs: 'BS Computer Science, BS Information Technology' })
    const reconciledMsg = (result?.reconciledCount || 0) > 0 
      ? ` & auto-reconciled ${result.reconciledCount} pre-imported student accounts!`
      : '!'
    showToast(`Created Academic Department: [${newDeptData.name}]${reconciledMsg}`)
  }

  // Handle Create Organization
  const handleCreateOrganizationSubmit = (e) => {
    e.preventDefault()
    if (!newOrgData.name) return
    createOrganization(newOrgData)
    setIsAddOrgOpen(false)
    setNewOrgData({ name: '', category: departments[0] ? `${departments[0].code} — Department Organization` : 'Non-Academic Club & Extra-Curricular' })
    showToast(`Created Student Organization: [${newOrgData.name}]`)
  }

  // Handle Create Club
  const handleCreateClubSubmit = (e) => {
    e.preventDefault()
    if (!newClubData.name) return
    createClub(newClubData)
    setIsAddClubOpen(false)
    setNewClubData({ name: '', parent_org: organizations[0]?.name || 'Computer Society NDMU', category: 'Non-Academic Club & Extra-Curricular' })
    showToast(`Created Student Club: [${newClubData.name}]`)
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
        <div className="space-y-6 animate-in fade-in duration-200 font-sans">

          {/* Hero Executive Header Banner (Minimalist Utilitarian Architecture) */}
          <div className="bg-[#1b4332] dark:bg-[#0a2417] text-white p-6 sm:p-7 rounded-2xl border border-[#245233] dark:border-emerald-900/60 relative overflow-hidden shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Trophy className="w-6 h-6 text-emerald-200" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                      CENTRAL EXECUTIVE GOVERNANCE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold">
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

              <div className="p-3.5 rounded-xl bg-[#0c2416] border border-[#1e4a30] shrink-0 self-start md:self-auto space-y-0.5">
                <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Accreditation Readiness</p>
                <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>97.8% PACUCOA & CHEd Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Quick Action & Governance Hub (Minimalist 2-Color Bento Box Grid) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#2d8a4e] dark:text-emerald-400" />
                Executive Quick Action & Governance Hub
              </h2>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">4 Workflows</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setSearchParams({ tab: 'accounts' })}
                className="p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 hover:border-[#2d8a4e] dark:hover:border-emerald-500 transition duration-200 text-left flex flex-col justify-between space-y-4 group cursor-pointer shadow-2xs dark:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center font-bold shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition">Account & Role Governance</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-snug">Assign Program Coordinator & Org Moderator roles to faculty</p>
                </div>
              </button>

              <button
                onClick={() => setSearchParams({ tab: 'awardees' })}
                className="p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 hover:border-[#2d8a4e] dark:hover:border-emerald-500 transition duration-200 text-left flex flex-col justify-between space-y-4 group cursor-pointer shadow-2xs dark:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center font-bold shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition">Award Ranking Engine</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-snug">Run automated multi-criteria honor roll scoring algorithm</p>
                </div>
              </button>

              <button
                onClick={() => setSearchParams({ tab: 'reports' })}
                className="p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 hover:border-[#2d8a4e] dark:hover:border-emerald-500 transition duration-200 text-left flex flex-col justify-between space-y-4 group cursor-pointer shadow-2xs dark:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center font-bold shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition">Accreditation Reports</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-snug">Export PACUCOA, CHEd, & OSAD annual audit PDFs/CSVs</p>
                </div>
              </button>

              <button
                onClick={() => setSearchParams({ tab: 'audit' })}
                className="p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 hover:border-[#2d8a4e] dark:hover:border-emerald-500 transition duration-200 text-left flex flex-col justify-between space-y-4 group cursor-pointer shadow-2xs dark:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center font-bold shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition">System Security Logs</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-snug">Inspect real-time administrative logs and security trail</p>
                </div>
              </button>
            </div>
          </div>

          {/* High-Impact Executive KPI Counter Cards (Strict 2-Color Bento Grid: Slate + Emerald) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Enrolled Students</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{metrics.total_students} Accounts</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">5 Colleges • 18 Programs</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Verified Records</p>
                <p className="text-xl font-extrabold text-[#2d8a4e] dark:text-emerald-400">{metrics.total_verified_achievements}</p>
                <p className="text-[11px] text-[#2d8a4e] dark:text-emerald-300 font-extrabold">+14.2% vs Last Term</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0 font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Active OSAD Awards</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{metrics.active_awards} Standards</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">OSAD Templates 01-05 Attached</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs dark:shadow-none">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 font-bold">
                <ShieldAlert className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Security & Audit Trail</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">Protected</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-extrabold">Zero Unresolved Alerts</p>
              </div>
            </div>
          </div>

          {/* University Achievement Analytics & Recent Awardees Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Achievement Analytics Graph Card */}
            <div className="lg:col-span-7 bg-white dark:bg-[#131e2e] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-2xs dark:shadow-none">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />
                  <span>University Achievement Distribution by College</span>
                </h3>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">AY 2025-2026</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800 dark:text-slate-200">CEAC - Engineering, Architecture & Computing</span>
                    <span className="text-[#2d8a4e] dark:text-emerald-400 font-extrabold">420 Achievements (33.5%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#1b4332] dark:bg-emerald-500 rounded-full" style={{ width: '33.5%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800 dark:text-slate-200">CBA - Business & Accountancy</span>
                    <span className="text-[#2d8a4e] dark:text-emerald-400 font-extrabold">310 Achievements (24.7%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#2d8a4e] dark:bg-emerald-600 rounded-full" style={{ width: '24.7%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800 dark:text-slate-200">CAS - Arts & Sciences</span>
                    <span className="text-[#2d8a4e] dark:text-emerald-400 font-extrabold">280 Achievements (22.3%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-600 dark:bg-emerald-700 rounded-full" style={{ width: '22.3%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800 dark:text-slate-200">CED - College of Education</span>
                    <span className="text-[#2d8a4e] dark:text-emerald-400 font-extrabold">244 Achievements (19.5%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 dark:bg-emerald-800 rounded-full" style={{ width: '19.5%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmed Awardees List Card */}
            <div className="lg:col-span-5 bg-white dark:bg-[#131e2e] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs dark:shadow-none">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />
                  <span>Recent Confirmed OSAD Awardees</span>
                </h3>
                <button
                  onClick={() => setSearchParams({ tab: 'awardees' })}
                  className="text-xs font-bold text-[#2d8a4e] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
                {awardees.map(awd => (
                  <div key={awd.id} className="p-3.5 bg-white dark:bg-[#131e2e] hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{awd.student_name}</p>
                      <p className="text-[11px] font-bold text-[#2d8a4e] dark:text-emerald-400 truncate">{awd.award_title}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{awd.program} • {awd.total_score} pts</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-100 dark:border-emerald-800/50 shrink-0">
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
      {/* 2. STUDENT GOVERNANCE & ACCOUNTS MODULE (tab === 'accounts')              */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <OSADAccountsTab
          userRoleFilter={userRoleFilter}
          setUserRoleFilter={setUserRoleFilter}
          userSearchTerm={userSearchTerm}
          setUserSearchTerm={setUserSearchTerm}
          selectedCollege={selectedCollege}
          setSelectedCollege={setSelectedCollege}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
          getUsers={getUsers}
          getPersonnelList={getPersonnelList}
          assignProgramCoordinator={assignProgramCoordinator}
        />
      )}

      {/* ========================================================================= */}
      {/* 2B. COLLEGE DEPARTMENTS & DEAN GOVERNANCE (tab === 'departments')          */}
      {/* ========================================================================= */}
      {activeTab === 'departments' && (
        <div className="space-y-6 animate-in fade-in duration-200 font-sans">
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  College Departments &amp; Dean Governance
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Create University College Departments &amp; Assign Faculty Deans
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddDeptOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create College Department</span>
            </button>
          </div>

          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map(dept => (
              <div key={dept.id} className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between hover:shadow-lg transition duration-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-extrabold">
                      {dept.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{dept.student_count} Enrolled Students</span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">{dept.name}</h3>

                  <div className="space-y-1.5 pt-2">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Degree Programs Managed</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dept.programs.map(prog => (
                        <span key={prog} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-extrabold border border-slate-200 dark:border-slate-700">
                          {prog}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Assigned College Dean:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{dept.dean_name || 'Unassigned'}</span>
                  </div>

                  <button
                    onClick={() => {
                      setPersonnelSelectorTarget({
                        title: 'Select College Dean',
                        targetName: dept.code,
                        roleType: 'dean'
                      })
                    }}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-[#2d8a4e] dark:hover:text-emerald-300 text-xs font-extrabold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    + Reassign College Dean
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2C. STUDENT ORGANIZATIONS MODULE (tab === 'organizations')                 */}
      {/* ========================================================================= */}
      {activeTab === 'organizations' && (
        <div className="space-y-6 animate-in fade-in duration-200 font-sans">
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Student Organizations &amp; Program Coordinator Governance
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Create Recognized Student Organizations &amp; Assign Faculty Program Coordinators
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddOrgOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Student Organization</span>
            </button>
          </div>

          {/* Student Organization Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {organizations.map(org => (
              <div key={org.id} className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between hover:shadow-lg transition duration-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-extrabold">
                      {org.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{org.member_count} Active Members</span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">{org.name}</h3>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Program Coordinator:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{org.coordinator_name || 'Unassigned'}</span>
                  </div>

                  <button
                    onClick={() => {
                      setPersonnelSelectorTarget({
                        title: 'Select Program Coordinator',
                        targetName: org.name,
                        roleType: 'coordinator'
                      })
                    }}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-[#2d8a4e] dark:hover:text-emerald-300 text-xs font-extrabold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    + Reassign Program Coordinator
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2D. STUDENT CLUBS MODULE (tab === 'clubs')                                 */}
      {/* ========================================================================= */}
      {activeTab === 'clubs' && (
        <div className="space-y-6 animate-in fade-in duration-200 font-sans">
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Student Clubs &amp; Organization Moderator Governance
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Create Student Clubs &amp; Assign Faculty Organization Moderators
                </p>
              </div>
            </div>
          </div>

          {/* Student Club Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clubs.map(club => (
              <div key={club.id} className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between hover:shadow-lg transition duration-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-extrabold">
                      under {club.parent_org}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{club.member_count} Members</span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">{club.name}</h3>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Organization Moderator:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{club.moderator_name || 'Unassigned'}</span>
                  </div>

                  <button
                    onClick={() => {
                      setPersonnelSelectorTarget({
                        title: 'Select Organization Moderator',
                        targetName: club.name,
                        roleType: 'moderator'
                      })
                    }}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-200 hover:text-purple-800 dark:hover:text-purple-300 text-xs font-extrabold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    + Reassign Org Moderator
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AWARD MANAGEMENT MODULE (tab === 'awards')                               */}
      {/* ========================================================================= */}
      {activeTab === 'awards' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Module Header */}
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-[#2d8a4e] dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  University Award Categories &amp; Scoring Criteria Setup
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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
              <div key={cat.id} className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between hover:shadow-xl dark:hover:border-emerald-500/50 transition duration-300">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60 text-[10px] font-extrabold">
                      {cat.category_type}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cat.is_active ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">{cat.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">{cat.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase">Min Points</p>
                      <p className="font-extrabold text-[#2d8a4e] dark:text-emerald-400 text-sm">{cat.min_points} pts</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase">Multiplier</p>
                      <p className="font-extrabold text-[#2d8a4e] dark:text-emerald-400 text-sm">{cat.weight_multiplier}x</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 text-[11px]">
                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Attached OSAD Template</p>
                    <p className="font-extrabold text-slate-900 dark:text-white truncate">{cat.attached_template_name} ({cat.attached_template_id})</p>
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
        <OSADAwardeesTab
          awardCategories={awardCategories}
          awardees={awardees}
          getStudentLeaderboards={getStudentLeaderboards}
          confirmAwardee={confirmAwardee}
        />
      )}


      {/* ========================================================================= */}
      {/* 5. REPORTS SECTION & ACCREDITATION SUITE (tab === 'reports')               */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <OSADReportsTab
          accreditationReports={accreditationReports}
          getAccreditationReportDetails={getAccreditationReportDetails}
        />
      )}
      {/* ========================================================================= */}
      {/* 6. SYSTEM AUDIT LOGS MODULE (tab === 'audit')                              */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <OSADAuditTab
          auditLogs={auditLogs}
          refreshAuditLogs={refreshAuditLogs}
        />
      )}

      {/* ================= MODALS ================= */}

      {/* Assign Role Modal */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#2d8a4e] dark:text-emerald-400" />
                <span>Assign {roleModalType === 'coordinator' ? 'Program Coordinator' : 'Organization Moderator'} Role</span>
              </h3>
              <button onClick={() => setSelectedUserForRole(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
              {/* Personnel Selection Utility (Searchable Faculty Input) */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Search &amp; Select Faculty Member</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search faculty by name or Employee ID (e.g. EMP-7491)..."
                    value={personnelSearchQuery}
                    onChange={(e) => setPersonnelSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  {getPersonnelList(personnelSearchQuery).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedUserForRole(p)}
                      className={`w-full p-2.5 text-left text-xs transition cursor-pointer flex items-center justify-between ${selectedUserForRole?.id === p.id ? 'bg-emerald-50/80 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-300 font-extrabold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'}`}
                    >
                      <div>
                        <p className="font-bold">{p.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.employee_id} • {p.department}</p>
                      </div>
                      {selectedUserForRole?.id === p.id && <Check className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {roleModalType === 'coordinator' ? (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Select Academic Program</label>
                  <select
                    value={assignedProgram}
                    onChange={(e) => setAssignedProgram(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                  >
                    <option value="BS Computer Science">BS Computer Science</option>
                    <option value="BS Information Technology">BS Information Technology</option>
                    <option value="BS Civil Engineering">BS Civil Engineering</option>
                    <option value="BS Business Administration">BS Business Administration</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Select Student Organization</label>
                  <select
                    value={assignedOrg}
                    onChange={(e) => setAssignedOrg(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                  >
                    <option value="Computer Society NDMU">Computer Society NDMU</option>
                    <option value="Junior Executive Club">Junior Executive Club</option>
                    <option value="Supreme Student Council">Supreme Student Council</option>
                    <option value="Civil Engineering Association">Civil Engineering Association</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForRole(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  Confirm &amp; Assign Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Award Category Modal */}
      {isAddAwardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Create New OSAD Award Category</span>
              </h3>
              <button onClick={() => setIsAddAwardOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateAwardSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Award Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Outstanding Student Researcher of the Year"
                  value={newAwardData.title}
                  onChange={(e) => setNewAwardData({ ...newAwardData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Category Type</label>
                <select
                  value={newAwardData.category_type}
                  onChange={(e) => setNewAwardData({ ...newAwardData, category_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Min Points Required</label>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    value={newAwardData.min_points}
                    onChange={(e) => setNewAwardData({ ...newAwardData, min_points: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Scoring Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="3.0"
                    value={newAwardData.weight_multiplier}
                    onChange={(e) => setNewAwardData({ ...newAwardData, weight_multiplier: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Attached OSAD Certificate Template</label>
                <select
                  value={newAwardData.attached_template_id}
                  onChange={(e) => setNewAwardData({
                    ...newAwardData,
                    attached_template_id: e.target.value,
                    attached_template_name: e.target.options[e.target.selectedIndex].text
                  })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                >
                  <option value="OSAD-TPL-01">Official NDMU Certificate of Participation</option>
                  <option value="OSAD-TPL-02">Certificate of Leadership & Merit</option>
                  <option value="OSAD-TPL-03">Certificate of Workshop Completion</option>
                  <option value="OSAD-TPL-04">Excellence & Special Distinction Award</option>
                  <option value="OSAD-TPL-05">NDMU Sports & Athletics Accreditation Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Description & Criteria Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe award objectives and criteria details..."
                  value={newAwardData.description}
                  onChange={(e) => setNewAwardData({ ...newAwardData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAwardOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {isAddDeptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2d8a4e] dark:text-emerald-400" />
                <span>Create Academic Department</span>
              </h3>
              <button onClick={() => setIsAddDeptOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateDepartmentSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. College of Engineering, Architecture & Computing (CEAC)"
                  value={newDeptData.name}
                  onChange={(e) => setNewDeptData({ ...newDeptData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Academic Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CEAC"
                  value={newDeptData.code}
                  onChange={(e) => setNewDeptData({ ...newDeptData, code: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Managed Programs (Comma Separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BS Computer Science, BS Information Technology, BS Civil Engineering"
                  value={newDeptData.programs}
                  onChange={(e) => setNewDeptData({ ...newDeptData, programs: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Assign College Dean (Optional)</label>
                <SearchablePersonnelDropdown
                  selectedId={newDeptData.dean_id}
                  personnelList={getPersonnelList('')}
                  placeholder="Unassigned (Assign Later)"
                  accentColor="emerald"
                  onSelect={(person) => {
                    setNewDeptData({
                      ...newDeptData,
                      dean_id: person ? person.id : null,
                      dean_name: person ? person.full_name : 'Unassigned'
                    })
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDeptOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {isAddOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Create Student Organization</span>
              </h3>
              <button onClick={() => setIsAddOrgOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateOrganizationSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NDMU Computer Society"
                  value={newOrgData.name}
                  onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Organization Category</label>
                <select
                  value={newOrgData.category}
                  onChange={(e) => setNewOrgData({ ...newOrgData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <optgroup label="Academic / Created Departments">
                    {departments.map(dept => (
                      <option key={dept.id} value={`${dept.code} — Department Organization`}>
                        {dept.code} — {dept.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Non-Academic & Extra-Curricular Clubs">
                    <option value="Non-Academic Club & Extra-Curricular">Non-Academic Club & Extra-Curricular</option>
                    <option value="Student Government & Governance">Student Government & Governance</option>
                    <option value="Special Interest & Performing Arts">Special Interest & Performing Arts</option>
                    <option value="Socio-Civic & Community Extension">Socio-Civic & Community Extension</option>
                    <option value="Sports & Athletics">Sports & Athletics</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Assign Program Coordinator (Optional)</label>
                <SearchablePersonnelDropdown
                  selectedId={newOrgData.coordinator_id}
                  personnelList={getPersonnelList('')}
                  placeholder="Unassigned (Assign Later)"
                  accentColor="purple"
                  onSelect={(person) => {
                    setNewOrgData({
                      ...newOrgData,
                      coordinator_id: person ? person.id : null,
                      coordinator_name: person ? person.full_name : 'Unassigned'
                    })
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOrgOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Student Club Modal */}
      {isAddClubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Create Student Club</span>
              </h3>
              <button onClick={() => setIsAddClubOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateClubSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Club Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Robotics Student Guild"
                  value={newClubData.name}
                  onChange={(e) => setNewClubData({ ...newClubData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Parent Organization</label>
                <select
                  value={newClubData.parent_org}
                  onChange={(e) => setNewClubData({ ...newClubData, parent_org: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.name}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Club Category</label>
                <select
                  value={newClubData.category}
                  onChange={(e) => setNewClubData({ ...newClubData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <optgroup label="Academic / Created Departments">
                    {departments.map(dept => (
                      <option key={dept.id} value={`${dept.code} — Department Club`}>
                        {dept.code} — {dept.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Non-Academic & Extra-Curricular Clubs">
                    <option value="Non-Academic Club & Extra-Curricular">Non-Academic Club & Extra-Curricular</option>
                    <option value="Student Government & Governance">Student Government & Governance</option>
                    <option value="Special Interest & Performing Arts">Special Interest & Performing Arts</option>
                    <option value="Socio-Civic & Community Extension">Socio-Civic & Community Extension</option>
                    <option value="Sports & Athletics">Sports & Athletics</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Assign Organization Moderator (Optional)</label>
                <SearchablePersonnelDropdown
                  selectedId={newClubData.moderator_id}
                  personnelList={getPersonnelList('')}
                  placeholder="Unassigned (Assign Later)"
                  accentColor="purple"
                  onSelect={(person) => {
                    setNewClubData({
                      ...newClubData,
                      moderator_id: person ? person.id : null,
                      moderator_name: person ? person.full_name : 'Unassigned'
                    })
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClubOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  Create Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Portfolio Viewing Inspection Modal (Paginated Student Portfolio) */}
      {viewingStudentPortfolio && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 font-sans">
            <div className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
              
              {/* Modal Top Header & Page Navigation Bar */}
              <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight">Student Portfolio Inspection</h2>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {viewingStudentPortfolio.full_name} • ID: {viewingStudentPortfolio.student_id || '2023-10492'}
                    </p>
                  </div>
                </div>

                {/* Page Tab Selector Pill */}
                <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 self-start sm:self-auto text-xs font-extrabold">
                  <button
                    onClick={() => setPortfolioModalPage(1)}
                    className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${portfolioModalPage === 1 ? 'bg-[#2d8a4e] text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    <span>1. Profile</span>
                  </button>
                  <button
                    onClick={() => setPortfolioModalPage(2)}
                    className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${portfolioModalPage === 2 ? 'bg-[#2d8a4e] text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    <span>2. Experience</span>
                  </button>
                  <button
                    onClick={() => setPortfolioModalPage(3)}
                    className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${portfolioModalPage === 3 ? 'bg-[#2d8a4e] text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    <span>3. Verified Proofs</span>
                  </button>
                </div>
              </div>

              {/* Modal Body Page Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                
                {/* PAGE 1: PROFILE OVERVIEW & DIGITAL IDENTITY */}
                {portfolioModalPage === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    
                    {/* Campus Banner Header Card */}
                    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-md">
                      <img
                        src={campusBanner}
                        alt="NDMU Campus Banner"
                        className="w-full h-32 object-cover opacity-40 mix-blend-overlay"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#143d2b] via-[#1b4332]/80 to-transparent p-6 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs font-serif italic text-emerald-200">
                          <span>AchieveNest • NDMU OSAD Governance</span>
                          <span>Veritas • Caritas • Excellentia</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest">
                            Verified Active Student
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Student Info Overview Card */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-[#2d8a4e] text-white flex items-center justify-center text-2xl font-extrabold shadow-md border-2 border-white dark:border-slate-700 shrink-0">
                          {viewingStudentPortfolio.full_name?.split(' ').map(n => n[0]).join('') || 'SD'}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{viewingStudentPortfolio.full_name}</h2>
                            <span className="w-5 h-5 rounded-full bg-[#2d8a4e] text-white inline-flex items-center justify-center text-xs shadow-xs font-bold" title="Verified Account">
                              ✓
                            </span>
                          </div>
                          <p className="text-xs font-extrabold text-[#2d8a4e] dark:text-emerald-400">
                            {viewingStudentPortfolio.program} • {viewingStudentPortfolio.college || 'CEAC'} ({viewingStudentPortfolio.year_level || '3rd Year Student'})
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Koronadal City, South Cotabato • {viewingStudentPortfolio.email}</p>
                        </div>
                      </div>

                      {/* 3 Summary Stat Badges */}
                      <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 text-center min-w-[90px] shadow-2xs">
                          <span className="text-xl font-black text-[#2d8a4e] dark:text-emerald-400 block leading-none">{viewingStudentPortfolio.total_points || 320}</span>
                          <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase">Points</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 text-center min-w-[90px] shadow-2xs">
                          <span className="text-xl font-black text-slate-900 dark:text-white block leading-none">{viewingStudentPortfolio.verified_count || 8}</span>
                          <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase">Verified</span>
                        </div>
                      </div>
                    </div>

                    {/* Official Digital Barcode Student ID Badge Card */}
                    <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">OFFICIAL NDMU STUDENT DIGITAL ID</p>
                        <p className="text-xs font-mono font-bold text-slate-300">NDMU-STUDENT-{cleanStudentId}</p>
                      </div>
                      <div className="bg-white p-2 rounded-xl shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 200 40" className="w-36 h-8">
                          <rect x="0" y="0" width="4" height="40" fill="#000" />
                          <rect x="6" y="0" width="2" height="40" fill="#000" />
                          <rect x="10" y="0" width="6" height="40" fill="#000" />
                          <rect x="18" y="0" width="2" height="40" fill="#000" />
                          <rect x="22" y="0" width="4" height="40" fill="#000" />
                          <rect x="28" y="0" width="8" height="40" fill="#000" />
                          <rect x="38" y="0" width="2" height="40" fill="#000" />
                          <rect x="42" y="0" width="4" height="40" fill="#000" />
                          <rect x="48" y="0" width="6" height="40" fill="#000" />
                          <rect x="56" y="0" width="2" height="40" fill="#000" />
                          <rect x="60" y="0" width="8" height="40" fill="#000" />
                          <rect x="70" y="0" width="4" height="40" fill="#000" />
                          <rect x="76" y="0" width="2" height="40" fill="#000" />
                          <rect x="80" y="0" width="6" height="40" fill="#000" />
                          <rect x="88" y="0" width="4" height="40" fill="#000" />
                          <rect x="94" y="0" width="2" height="40" fill="#000" />
                          <rect x="98" y="0" width="8" height="40" fill="#000" />
                          <rect x="108" y="0" width="4" height="40" fill="#000" />
                          <rect x="114" y="0" width="2" height="40" fill="#000" />
                          <rect x="118" y="0" width="6" height="40" fill="#000" />
                          <rect x="126" y="0" width="4" height="40" fill="#000" />
                          <rect x="132" y="0" width="8" height="40" fill="#000" />
                          <rect x="142" y="0" width="2" height="40" fill="#000" />
                          <rect x="146" y="0" width="6" height="40" fill="#000" />
                          <rect x="154" y="0" width="4" height="40" fill="#000" />
                          <rect x="160" y="0" width="2" height="40" fill="#000" />
                          <rect x="164" y="0" width="8" height="40" fill="#000" />
                          <rect x="174" y="0" width="4" height="40" fill="#000" />
                          <rect x="180" y="0" width="2" height="40" fill="#000" />
                          <rect x="184" y="0" width="6" height="40" fill="#000" />
                          <rect x="192" y="0" width="4" height="40" fill="#000" />
                        </svg>
                      </div>
                    </div>

                    {/* About Me Section */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />
                        <span>About Student</span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        Enrolled student in {viewingStudentPortfolio.program} at Notre Dame of Marbel University. Actively participating in academic competitions, leadership initiatives, and university community extension projects.
                      </p>
                    </div>
                  </div>
                )}

                {/* PAGE 2: EXPERIENCE & INVOLVEMENT TIMELINE */}
                {portfolioModalPage === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />
                        <span>Experience &amp; Organization Involvement Timeline</span>
                      </h3>
                      <span className="text-xs font-bold text-slate-400">5 Registered Roles</span>
                    </div>

                    <div className="relative pl-6 space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {[
                        { role: 'President', org: 'Computer Society NDMU', period: 'Aug 2025 – Present' },
                        { role: "Dean's Lister", org: 'CEAC – Notre Dame of Marbel University', period: 'AY 2024–2025' },
                        { role: 'Community Extension Lead', org: 'Koronadal City Barangay Program', period: 'Jan – Mar 2025' },
                        { role: 'Hackathon Finalist', org: 'DICT RegTech Hackathon 2024', period: 'Oct 2024' },
                        { role: 'Core Developer', org: 'University Web Dev Team', period: 'Jun 2024 – Present' }
                      ].map((exp, idx) => (
                        <div key={idx} className="relative flex items-start justify-between gap-4">
                          <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-[#2d8a4e] text-white flex items-center justify-center text-xs font-bold ring-4 ring-white dark:ring-slate-900">
                            ✓
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex-1">
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{exp.role}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{exp.org}</p>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0 pt-2">{exp.period}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAGE 3: VERIFIED PROOFS & CERTIFICATES LEDGER */}
                {portfolioModalPage === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />
                        <span>Verified Achievement Proof Documents Ledger</span>
                      </h3>
                      <span className="text-xs font-bold text-slate-400">
                        Showing 1–3 of {viewingStudentPortfolio.verified_count || 8} Verified Certificates
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(viewingStudentPortfolio.portfolio_items || [
                        { id: '1', title: '1st Place — National AI & Robotics Challenge 2026', category: 'National Competition', points: 120, date: '2026-02-14', status: 'OSAD Verified', proof_url: 'https://ndmu.edu.ph/proof/cert-881.pdf' },
                        { id: '2', title: 'Supreme Student Council Executive Leadership Service', category: 'Student Leadership', points: 100, date: '2026-01-20', status: 'OSAD Verified', proof_url: 'https://ndmu.edu.ph/proof/cert-882.pdf' },
                        { id: '3', title: 'Community Outreach & Extension Volunteer Accreditation', category: 'Community Extension', points: 80, date: '2025-11-18', status: 'OSAD Verified', proof_url: 'https://ndmu.edu.ph/proof/cert-883.pdf' }
                      ]).map(item => (
                        <div key={item.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#2d8a4e] transition">
                          <div className="space-y-1">
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white">{item.title}</p>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">{item.category}</span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="font-mono text-slate-400">{item.date}</span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <a 
                                href={item.proof_url || '#'} 
                                target="_blank" 
                                rel="noreferrer" 
                                onClick={(e) => { e.preventDefault(); showToast(`Opening verified certificate PDF for ${item.title}`); }} 
                                className="text-[#2d8a4e] dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-1"
                              >
                                <span>View Certificate PDF</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-extrabold">
                              +{item.points} PTS
                            </span>
                            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#2d8a4e] dark:text-emerald-400" />
                              <span>{item.status || 'Verified'}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Controls with Pagination Controls */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={portfolioModalPage === 1}
                    onClick={() => setPortfolioModalPage(prev => Math.max(1, prev - 1))}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                  >
                    Previous Page
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 px-2">
                    Page {portfolioModalPage} of 3
                  </span>

                  <button
                    disabled={portfolioModalPage === 3}
                    onClick={() => setPortfolioModalPage(prev => Math.min(3, prev + 1))}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                  >
                    Next Page
                  </button>
                </div>

                <button
                  onClick={() => setViewingStudentPortfolio(null)}
                  className="px-6 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs transition cursor-pointer shadow-sm self-end sm:self-auto"
                >
                  Close Inspection
                </button>
              </div>

            </div>
          </div>
        )}

      {/* Searchable Personnel Selection Utility Modal */}
      <PersonnelSelectorModal
        isOpen={!!personnelSelectorTarget}
        onClose={() => setPersonnelSelectorTarget(null)}
        title={personnelSelectorTarget?.title || 'Select Faculty Member'}
        targetName={personnelSelectorTarget?.targetName || ''}
        personnelList={getPersonnelList('')}
        roleType={personnelSelectorTarget?.roleType || 'coordinator'}
        onSelectPersonnel={(person) => {
          if (personnelSelectorTarget?.roleType === 'dean') {
            assignCollegeDean(person.id, personnelSelectorTarget.targetName)
            showToast(`Assigned ${person.full_name} as College Dean for ${personnelSelectorTarget.targetName}`)
          } else if (personnelSelectorTarget?.roleType === 'coordinator') {
            assignProgramCoordinator(person.id, personnelSelectorTarget.targetName)
            showToast(`Assigned ${person.full_name} as Program Coordinator for ${personnelSelectorTarget.targetName}`)
          } else {
            assignOrganizationModerator(person.id, personnelSelectorTarget.targetName)
            showToast(`Assigned ${person.full_name} as Organization Moderator for ${personnelSelectorTarget.targetName}`)
          }
        }}
      />

    </div>
  )
}
