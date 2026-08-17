/**
 * HRDashboardPage.jsx
 * Phase 8: Human Resource (HR) Office Executive Admin Portal View Component.
 * Modular architecture delegating sub-modules to dedicated page components.
 */

import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Users, Building2, FileCheck, ShieldCheck, CheckCircle2,
  Clock, Download, UserPlus, FileText, Lock, Sparkles
} from 'lucide-react'
import { useHR } from '../../hooks/useHR'
import HRModel from '../../models/HRModel'
import DepartmentSecretaryAssignmentModal from './modals/DepartmentSecretaryAssignmentModal'
import CreatePersonnelAccountModal from './modals/CreatePersonnelAccountModal'
import HRPersonnelDirectory from './HRPersonnelDirectoryPage'
import HREvaluationSubmissions from './HREvaluationSubmissionsPage'
import HRFacultyEvaluationAndRanking from './HRFacultyEvaluationAndRankingPage'
import HRAuditTrail from './HRAuditTrailPage'

export function HRDashboard({ currentUser }) {
  const hrUser = currentUser || { full_name: 'Director Evelyn Tan', email: 'hr@ndmu.edu.ph', employee_id: 'HR-2010-001' }

  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')

  const {
    activeTab, setActiveTab,
    personnelList,
    filteredPersonnel,
    pendingEndorsements,
    directHRQueue,
    endorsedQueue,
    accomplishments,
    auditLogs,
    passwordResets,
    searchQuery, setSearchQuery,
    collegeFilter, setCollegeFilter,
    selectedPersonnel, setSelectedPersonnel,
    selectedAccomplishment, setSelectedAccomplishment,
    isRankModalOpen, setIsRankModalOpen,
    isProofModalOpen, setIsProofModalOpen,
    stats,
    handleCreatePersonnelAccount,
    handleUpdateRank,
    handleAssignDepartmentSecretary,
    handleSealVerification,
    handleReturnAccomplishment,
    handleApprovePasswordReset
  } = useHR()

  // Sync activeTab with URL search parameter (?tab=personnel, etc.)
  const effectiveTab = tabFromUrl || activeTab || 'overview'

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl, activeTab, setActiveTab])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  // Modal Form State
  const [isAssignDeptSecModalOpen, setIsAssignDeptSecModalOpen] = useState(false)
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false)
  const [employmentFilter, setEmploymentFilter] = useState('ALL')
  const [newRank, setNewRank] = useState('Assistant Professor I')
  const [newStatus, setNewStatus] = useState('Full-Time Permanent')
  const [returnRemarks, setReturnRemarks] = useState('')
  const [sealCode, setSealCode] = useState('HR-SEAL-2026-0099')
  const [toastMsg, setToastMsg] = useState(null)

  // Ranking Masterboard Filters
  const [masterboardSearch, setMasterboardSearch] = useState('')
  const [masterboardDept, setMasterboardDept] = useState('All')
  const [masterboardStatus, setMasterboardStatus] = useState('All')

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const exportCSV = (filename, rows) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportFacultyMatrix = () => {
    const headers = ['Employee ID', 'Full Name', 'College', 'Department', 'Academic Rank', 'Status', 'Tenure Years', 'Verified Accomplishments']
    const dataRows = filteredPersonnel.map(p => [
      p.employee_id, p.full_name, p.college, p.department, p.academic_rank, p.employment_status, p.tenure_years, p.verified_accomplishments_count
    ])
    exportCSV('NDMU_Faculty_CHEd_PACUCOA_Matrix.csv', [headers, ...dataRows])
  }

  const openRankModal = (personnel) => {
    setSelectedPersonnel(personnel)
    setNewRank(personnel.academic_rank || 'Assistant Professor I')
    setNewStatus(personnel.employment_status || 'Full-Time Permanent')
    setIsRankModalOpen(true)
  }

  const openProofModal = (accomplishment) => {
    setSelectedAccomplishment(accomplishment)
    setIsProofModalOpen(true)
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 selection:bg-[#2d8a4e] selection:text-white pb-12">
      
      {/* ================= DASHBOARD HEADER (ONLY ON OVERVIEW TAB) ================= */}
      {effectiveTab === 'overview' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Dashboard
            </h1>
            <p className="text-base font-normal text-slate-600 dark:text-slate-400 leading-normal mt-1">
              Monitor personnel administration and faculty evaluation activities requiring HR attention.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white dark:bg-[#131e2e] px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-right shadow-2xs">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Active Evaluation Cycle</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className="text-base font-bold text-slate-900 dark:text-white">AY 2025–2026</span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#EDF3EC] text-[#346538] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#D4E3D2] dark:border-emerald-800/60 text-xs font-bold">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================= MODULE 1: DASHBOARD ================= */}
      {effectiveTab === 'overview' && (
        <div className="space-y-6">
          {/* Operational Overview Surface */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
                <ShieldCheck className="w-5.5 h-5.5 text-[#2d8a4e] dark:text-emerald-400" /> Operational Overview
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Workload</span>
            </div>

            {/* Metric Priority Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Priority A: Awaiting HR Review (Spot Pastel Warm Gold) */}
              <button
                type="button"
                onClick={() => handleTabChange('verification')}
                className="p-5 rounded-xl bg-[#FBF3DB] dark:bg-amber-950/30 hover:bg-[#F8ECBF] dark:hover:bg-amber-950/50 border border-[#F2E5B8] dark:border-amber-900/60 text-left transition group cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#956400] dark:text-amber-300">Awaiting HR Review</span>
                  <div className="w-9 h-9 rounded-lg bg-[#F5E6B5] dark:bg-amber-900/60 text-[#956400] dark:text-amber-300 flex items-center justify-center font-bold">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="mt-3.5">
                  <p className="text-3xl font-bold text-[#634300] dark:text-amber-100 leading-tight">{stats.pendingEndorsements || 2}</p>
                  <p className="text-sm font-normal text-[#805600] dark:text-amber-300/90 leading-normal mt-1">Department-forwarded evaluations</p>
                </div>
              </button>

              {/* Priority A: Current Review (Spot Pastel Pale Green) */}
              <div className="p-5 rounded-xl bg-[#EDF3EC] dark:bg-emerald-950/30 border border-[#D4E3D2] dark:border-emerald-900/60 text-left transition flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#346538] dark:text-emerald-300">Current Review</span>
                  <div className="w-9 h-9 rounded-lg bg-[#DBE8DA] dark:bg-emerald-900/60 text-[#346538] dark:text-emerald-300 flex items-center justify-center font-bold">
                    <FileCheck className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="mt-3.5 space-y-2">
                  {stats.activeReview ? (
                    <>
                      <div>
                        <p className="text-base font-bold text-[#1b4332] dark:text-emerald-100 leading-tight">{stats.activeReview.faculty_name || 'Dr. Maria Santos'}</p>
                        <p className="text-xs font-medium text-[#346538] dark:text-emerald-300/80">{stats.activeReview.department || 'Department of Computer Studies'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-[#1b4332] dark:text-emerald-200">
                          <span>16 of 18 items reviewed</span>
                          <span>89%</span>
                        </div>
                        <div className="w-full bg-[#C6DBC4] dark:bg-emerald-900/70 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#1b4332] dark:bg-emerald-400 h-full rounded-full w-[89%] transition-all duration-300"></div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProofModal(stats.activeReview)}
                        className="w-full mt-1 py-2 px-3 rounded-lg bg-[#1b4332] hover:bg-[#143326] text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        Continue Review →
                      </button>
                    </>
                  ) : (
                    <div className="py-2 space-y-2">
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200">No active review</p>
                      <p className="text-xs font-normal text-slate-600 dark:text-slate-400">Select an evaluation from the waiting queue.</p>
                      <button
                        type="button"
                        onClick={() => handleTabChange('verification')}
                        className="text-xs font-bold text-[#1b4332] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        View Queue →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Priority B: Ready for Finalization (Spot Pastel Muted Blue) */}
              <button
                type="button"
                onClick={() => handleTabChange('verification')}
                className="p-5 rounded-xl bg-[#E1F3FE] dark:bg-blue-950/30 hover:bg-[#D2ECFC] dark:hover:bg-blue-950/50 border border-[#C8E7FB] dark:border-blue-900/60 text-left transition group cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1F6C9F] dark:text-blue-300">Ready for Finalization</span>
                  <div className="w-9 h-9 rounded-lg bg-[#CBE8FA] dark:bg-blue-900/60 text-[#1F6C9F] dark:text-blue-300 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="mt-3.5">
                  <p className="text-3xl font-bold text-[#13486B] dark:text-blue-100 leading-tight">{stats.readyForFinalizationCount || 1}</p>
                  <p className="text-sm font-normal text-[#1F6C9F] dark:text-blue-300/90 leading-normal mt-1">Evaluation awaiting confirmation</p>
                </div>
              </button>

              {/* Priority B: Completed Evaluations (Spot Pastel Wash) */}
              <button
                type="button"
                onClick={() => handleTabChange('masterboard')}
                className="p-5 rounded-xl bg-[#F4F8F5] dark:bg-emerald-950/20 hover:bg-[#E8F1EA] dark:hover:bg-emerald-950/40 border border-[#D9E6DD] dark:border-emerald-800/50 text-left transition group cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-600 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1b4332] dark:text-emerald-300">Completed Evaluations</span>
                  <div className="w-9 h-9 rounded-lg bg-[#D4E4D8] dark:bg-emerald-900/50 text-[#1b4332] dark:text-emerald-300 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="mt-3.5">
                  <p className="text-3xl font-bold text-[#1b4332] dark:text-emerald-100 leading-tight">{stats.verifiedAccomplishments || 1}</p>
                  <p className="text-sm font-normal text-[#2d8a4e] dark:text-emerald-300/90 leading-normal mt-1">AY 2025–2026</p>
                </div>
              </button>
            </div>

            {/* Secondary Context Bar: Total Personnel */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-medium">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{stats.totalPersonnel || 52} Total Personnel</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Faculty and administrative personnel directory across university colleges.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('personnel')}
                className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
              >
                View Directory →
              </button>
            </div>
          </div>

          {/* Pending HR Actions Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
                <Clock className="w-5.5 h-5.5 text-amber-600 dark:text-amber-400" /> Pending HR Actions
              </h2>
              <button
                type="button"
                onClick={() => handleTabChange('verification')}
                className="text-sm font-semibold text-[#1b4332] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                View All Submissions →
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
              {/* Row 1: Awaiting HR Review */}
              <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#956400] dark:bg-amber-400"></span>
                    <span>Evaluations awaiting HR review</span>
                  </p>
                  <p className="text-sm font-normal text-slate-600 dark:text-slate-400 leading-normal">
                    {stats.pendingEndorsements || 2} faculty evaluation submissions forwarded by departments awaiting initial HR review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('verification')}
                  className="px-4 py-2 rounded-lg bg-[#956400] hover:bg-[#7a5200] text-white font-semibold text-sm transition cursor-pointer shrink-0 shadow-xs"
                >
                  Review Queue →
                </button>
              </div>

              {/* Row 2: Current Evaluation in Progress */}
              <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#346538] dark:bg-emerald-400"></span>
                    <span>Current evaluation in progress</span>
                  </p>
                  <p className="text-sm font-normal text-slate-600 dark:text-slate-400 leading-normal">
                    {stats.activeReview ? `${stats.activeReview.faculty_name} · 16 of 18 items reviewed` : 'No evaluation currently in progress.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (stats.activeReview) openProofModal(stats.activeReview)
                    else handleTabChange('verification')
                  }}
                  className="px-4 py-2 rounded-lg bg-[#1b4332] hover:bg-[#143326] text-white font-semibold text-sm transition cursor-pointer shrink-0 shadow-xs"
                >
                  {stats.activeReview ? 'Continue Review →' : 'View Queue →'}
                </button>
              </div>

              {/* Row 3: Ready for Finalization */}
              <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1F6C9F] dark:bg-blue-400"></span>
                    <span>Evaluations ready for finalization</span>
                  </p>
                  <p className="text-sm font-normal text-slate-600 dark:text-slate-400 leading-normal">
                    {stats.readyForFinalizationCount || 1} evaluation ready for final HR confirmation and official seal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('verification')}
                  className="px-4 py-2 rounded-lg bg-[#1F6C9F] hover:bg-[#18557e] text-white font-semibold text-sm transition cursor-pointer shrink-0 shadow-xs"
                >
                  Finalize →
                </button>
              </div>

              {/* Row 4: Password Resets */}
              {stats.pendingResets > 0 && (
                <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-600 dark:bg-slate-400"></span>
                      <span>Personnel password reset requests</span>
                    </p>
                    <p className="text-sm font-normal text-slate-600 dark:text-slate-400 leading-normal">
                      {stats.pendingResets} faculty credential reset request(s) awaiting processing in Personnel Directory.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('personnel')}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm transition cursor-pointer shrink-0 shadow-xs"
                  >
                    Process →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Access Bento Grid */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
              <Sparkles className="w-5.5 h-5.5 text-[#2d8a4e] dark:text-emerald-400" /> Quick Access
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Personnel Directory */}
              <button
                type="button"
                onClick={() => handleTabChange('personnel')}
                className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 hover:bg-[#EDF3EC] dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-[#D4E3D2] dark:hover:border-emerald-800 text-left transition group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] dark:text-emerald-400 shrink-0 shadow-2xs">
                    <UserPlus className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-[#1b4332] dark:group-hover:text-emerald-400">Personnel Directory</h3>
                    <p className="text-sm font-normal text-slate-600 dark:text-slate-400 leading-normal mt-0.5">Personnel records, assignments, employment details, and academic ranks.</p>
                  </div>
                </div>
                <span className="text-base font-semibold text-slate-400 group-hover:text-[#1b4332] dark:group-hover:text-emerald-400 ml-2">→</span>
              </button>

              {/* Evaluation Submissions */}
              <button
                type="button"
                onClick={() => handleTabChange('verification')}
                className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 hover:bg-[#EDF3EC] dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-[#D4E3D2] dark:hover:border-emerald-800 text-left transition group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] dark:text-emerald-400 shrink-0 shadow-2xs">
                    <FileCheck className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-[#1b4332] dark:group-hover:text-emerald-400">Evaluation Submissions</h3>
                    <p className="text-sm font-normal text-slate-600 dark:text-slate-400 leading-normal mt-0.5">Process faculty evaluations requiring HR review.</p>
                  </div>
                </div>
                <span className="text-base font-semibold text-slate-400 group-hover:text-[#1b4332] dark:group-hover:text-emerald-400 ml-2">→</span>
              </button>

              {/* Faculty Evaluation & Ranking */}
              <button
                type="button"
                onClick={() => handleTabChange('masterboard')}
                className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 hover:bg-[#EDF3EC] dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-[#D4E3D2] dark:hover:border-emerald-800 text-left transition group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] dark:text-emerald-400 shrink-0 shadow-2xs">
                    <Download className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-[#1b4332] dark:group-hover:text-emerald-400">Faculty Evaluation &amp; Ranking</h3>
                    <p className="text-sm font-normal text-slate-600 dark:text-slate-400 leading-normal mt-0.5">View finalized scores, rankings, and promotion-review information.</p>
                  </div>
                </div>
                <span className="text-base font-semibold text-slate-400 group-hover:text-[#1b4332] dark:group-hover:text-emerald-400 ml-2">→</span>
              </button>

              {/* Audit Trail */}
              <button
                type="button"
                onClick={() => handleTabChange('audit')}
                className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 hover:bg-[#EDF3EC] dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-[#D4E3D2] dark:hover:border-emerald-800 text-left transition group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] dark:text-emerald-400 shrink-0 shadow-2xs">
                    <ShieldCheck className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-[#1b4332] dark:group-hover:text-emerald-400">Audit Trail</h3>
                    <p className="text-sm font-normal text-slate-600 dark:text-slate-400 leading-normal mt-0.5">Review recorded HR administrative activities and changes.</p>
                  </div>
                </div>
                <span className="text-base font-semibold text-slate-400 group-hover:text-[#1b4332] dark:group-hover:text-emerald-400 ml-2">→</span>
              </button>
            </div>
          </div>

          {/* Recent HR Activity Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
                <FileText className="w-5.5 h-5.5 text-emerald-600 dark:text-emerald-400" /> Recent HR Activity
              </h2>
              <button
                type="button"
                onClick={() => handleTabChange('audit')}
                className="text-sm font-semibold text-[#1b4332] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                View Audit Trail →
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(auditLogs && auditLogs.length > 0 ? auditLogs.slice(0, 5) : [
                { id: '1', action_type: 'HR_SCORE_SEAL_APPLIED', target_personnel: 'Dr. Maria Santos', created_at: 'Today, 10:32 AM', details: 'Finalized evaluation score 124/160' },
                { id: '2', action_type: 'RANK_PROMOTION_UPDATE', target_personnel: 'Prof. Ricardo Gomez', created_at: 'Yesterday, 3:45 PM', details: 'Promoted from Instructor III to Assistant Professor I' },
                { id: '3', action_type: 'CREDENTIAL_RESET_ISSUED', target_personnel: 'Dr. Ana Reyes', created_at: 'Aug 16, 2026', details: 'Issued temporary security passkey' },
              ]).map((log) => (
                <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2d8a4e] shrink-0"></div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-base">
                        {log.action_type === 'HR_SCORE_SEAL_APPLIED' ? 'Faculty Evaluation Finalized' : log.action_type === 'RANK_PROMOTION_UPDATE' ? 'Academic Rank Updated' : log.action_type === 'CREDENTIAL_RESET_ISSUED' ? 'Password Reset Approved' : log.action_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-normal text-slate-600 dark:text-slate-400 leading-normal mt-0.5">{log.target_personnel} · {log.details}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 shrink-0">{log.created_at}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 2: PERSONNEL DIRECTORY ================= */}
      {effectiveTab === 'personnel' && (
        <HRPersonnelDirectory
          personnelList={personnelList}
          filteredPersonnel={filteredPersonnel}
          passwordResets={passwordResets}
          stats={stats}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          collegeFilter={collegeFilter}
          setCollegeFilter={setCollegeFilter}
          employmentFilter={employmentFilter}
          setEmploymentFilter={setEmploymentFilter}
          openRankModal={openRankModal}
          setIsCreateAccountModalOpen={setIsCreateAccountModalOpen}
          setIsAssignDeptSecModalOpen={setIsAssignDeptSecModalOpen}
          handleApprovePasswordReset={handleApprovePasswordReset}
          showToast={showToast}
          hrUser={hrUser}
        />
      )}

      {/* ================= MODULE 3: EVALUATION SUBMISSIONS ================= */}
      {effectiveTab === 'verification' && (
        <HREvaluationSubmissions
          directHRQueue={directHRQueue}
          endorsedQueue={endorsedQueue}
          accomplishments={accomplishments}
          openProofModal={openProofModal}
        />
      )}

      {/* ================= MODULE 4: FACULTY EVALUATION & RANKING ================= */}
      {effectiveTab === 'masterboard' && (
        <HRFacultyEvaluationAndRanking
          portfolios={accomplishments}
          searchQuery={masterboardSearch}
          setSearchQuery={setMasterboardSearch}
          departmentFilter={masterboardDept}
          setDepartmentFilter={setMasterboardDept}
          statusFilter={masterboardStatus}
          setStatusFilter={setMasterboardStatus}
          onSelectAuditPortfolio={openProofModal}
        />
      )}

      {/* ================= MODULE 5: AUDIT TRAIL ================= */}
      {(effectiveTab === 'audit' || effectiveTab === 'reports') && (
        <HRAuditTrail
          auditLogs={auditLogs}
          filteredPersonnel={filteredPersonnel}
          handleExportFacultyMatrix={handleExportFacultyMatrix}
          exportCSV={exportCSV}
        />
      )}

      {/* ================= EDIT RANK MODAL ================= */}
      {isRankModalOpen && selectedPersonnel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">Update Academic Rank &amp; Status</h3>
              <button onClick={() => setIsRankModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Faculty Member</label>
                <p className="p-3 rounded-xl bg-slate-50 font-bold text-slate-900">{selectedPersonnel.full_name} ({selectedPersonnel.employee_id})</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Rank Designation</label>
                <select
                  value={newRank}
                  onChange={e => setNewRank(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                >
                  {HRModel.ACADEMIC_RANKS.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Employment Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                >
                  {HRModel.EMPLOYMENT_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRankModalOpen(false)}
                className="w-1/2 py-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateRank(selectedPersonnel.id, newRank, newStatus)
                  showToast(`Updated academic rank for ${selectedPersonnel.full_name}`)
                }}
                className="w-1/2 py-3 rounded-xl bg-[#1b4332] text-white hover:bg-[#12361e] font-bold text-xs shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PROOF INSPECTION & VERIFICATION MODAL ================= */}
      {isProofModalOpen && selectedAccomplishment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">HR Accomplishment Verification &amp; Seal</h3>
              <button onClick={() => setIsProofModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <h4 className="font-bold text-[#1b4332] text-sm">{selectedAccomplishment.title}</h4>
                <p className="text-slate-600">{selectedAccomplishment.faculty_name} • {selectedAccomplishment.college}</p>
                <p className="text-slate-500 font-mono text-[11px] mt-1">Publisher/Issuer: {selectedAccomplishment.publisher_or_issuer}</p>
              </div>

              {selectedAccomplishment.secretary_remarks && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department Secretary Remarks</label>
                  <p className="p-3 rounded-xl bg-slate-50 text-slate-700 italic border border-slate-200">
                    "{selectedAccomplishment.secretary_remarks}"
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Generated Official HR Seal Code</label>
                <input
                  type="text"
                  value={sealCode}
                  onChange={e => setSealCode(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-mono text-slate-900 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Return Remarks (Only if returning to Faculty)</label>
                <textarea
                  rows="2"
                  placeholder="Provide audit feedback if returning submission..."
                  value={returnRemarks}
                  onChange={e => setReturnRemarks(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-slate-900"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleReturnAccomplishment(selectedAccomplishment.id, returnRemarks || 'Returned for document re-inspection.')
                  showToast('Returned accomplishment to faculty.')
                }}
                className="w-1/2 py-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs cursor-pointer"
              >
                Return to Faculty
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSealVerification(selectedAccomplishment.id, sealCode)
                  showToast('HR Official Seal stamped & verified!')
                }}
                className="w-1/2 py-3 rounded-xl bg-[#1b4332] text-white hover:bg-[#12361e] font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Stamp HR Seal &amp; Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT SECRETARY ROLE ASSIGNMENT MODAL */}
      <DepartmentSecretaryAssignmentModal
        isOpen={isAssignDeptSecModalOpen}
        onClose={() => setIsAssignDeptSecModalOpen(false)}
        personnelList={personnelList}
        onAssign={(id, role) => {
          handleAssignDepartmentSecretary(id, role)
          showToast('Updated Department Secretary governance role.')
        }}
      />

      {/* CREATE PERSONNEL ACCOUNT MODAL */}
      <CreatePersonnelAccountModal
        isOpen={isCreateAccountModalOpen}
        onClose={() => setIsCreateAccountModalOpen(false)}
        onSave={(accData) => {
          handleCreatePersonnelAccount(accData)
          showToast(`Created account for ${accData.full_name}`)
        }}
      />

    </div>
  )
}

export default HRDashboard
