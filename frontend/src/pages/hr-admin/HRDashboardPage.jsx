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
import HRPersonnelGovernance from './HRPersonnelGovernancePage'
import HRVerificationQueue from './HRVerificationQueuePage'
import HRFacultyRankingAndMatrix from './HRFacultyRankingAndMatrixPage'
import HRAccreditationAndAuditLogs from './HRAccreditationAndAuditLogsPage'

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
      
      {/* ================= HERO EXECUTIVE BANNER (ONLY ON OVERVIEW TAB) ================= */}
      {effectiveTab === 'overview' && (
        <>
          <div className="bg-gradient-to-r from-[#12361e] via-[#1b4332] to-[#0d2816] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-900/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Sole Institutional Account
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[11px] font-extrabold tracking-wider uppercase">
                    AY 2025 - 2026
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Human Resources (HR) Executive Portal
                </h1>
                <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 font-medium">
                  {hrUser.full_name} ({hrUser.employee_id}) • University Personnel Governance &amp; Verification Suite
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold">CHEd / PACUCOA Readiness</p>
                  <p className="text-lg font-black text-amber-300 flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {stats.accreditationScore}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-900 text-white text-xs font-bold shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================= MODULE 1: EXECUTIVE COMMAND CENTER ================= */}
      {effectiveTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Personnel</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#2d8a4e]">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalPersonnel}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Faculty &amp; Administrative Staff</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Proofs</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{stats.verifiedAccomplishments}</p>
              <p className="text-xs text-[#2d8a4e] mt-1 font-bold">HR Verification Sealed</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Queue</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-amber-600 mt-2">{stats.pendingEndorsements}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Dept Secretary Endorsed</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password Reset Requests</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-purple-700 mt-2">{stats.pendingResets}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Faculty Reset Queue</p>
            </div>
          </div>

          {/* HR Executive Management & Action Hub */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2d8a4e]" /> HR Executive Action &amp; Governance Hub
              </h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">4 Workflows</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Personnel & Rank Governance */}
              <button
                type="button"
                onClick={() => handleTabChange('personnel')}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-[#eaf4ed] border border-slate-200 hover:border-[#d2e8d7] text-left transition group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] mb-3 shadow-2xs">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1b4332]">Personnel &amp; Rank Governance</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Manage Faculty roster, employment status &amp; academic rank promotions.</p>
                </div>
              </button>

              {/* Card 2: Faculty Verification Queue */}
              <button
                type="button"
                onClick={() => handleTabChange('verification')}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-[#eaf4ed] border border-slate-200 hover:border-[#d2e8d7] text-left transition group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] mb-3 shadow-2xs">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1b4332]">Review Endorsement Queue</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Inspect supporting proof files &amp; stamp official HR seal on accomplishments.</p>
                </div>
              </button>

              {/* Card 3: NDMU Rating Matrix & Reports */}
              <button
                type="button"
                onClick={handleExportFacultyMatrix}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-[#eaf4ed] border border-slate-200 hover:border-[#d2e8d7] text-left transition group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] mb-3 shadow-2xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1b4332]">Accreditation &amp; Ranking Matrix</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Export PACUCOA, CHEd &amp; NDMU annual audit faculty reports.</p>
                </div>
              </button>

              {/* Card 4: System Audit Logs */}
              <button
                type="button"
                onClick={() => handleTabChange('audit')}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-[#eaf4ed] border border-slate-200 hover:border-[#d2e8d7] text-left transition group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] mb-3 shadow-2xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1b4332]">System Audit Trail</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Review immutable HR administrative action security logs.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 2: PERSONNEL GOVERNANCE & ACCOUNTS DIRECTORY ================= */}
      {effectiveTab === 'personnel' && (
        <HRPersonnelGovernance
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

      {/* ================= MODULE 3: FACULTY VERIFICATION QUEUE ================= */}
      {effectiveTab === 'verification' && (
        <HRVerificationQueue
          directHRQueue={directHRQueue}
          endorsedQueue={endorsedQueue}
          accomplishments={accomplishments}
          openProofModal={openProofModal}
        />
      )}

      {/* ================= MODULE 4: FACULTY RANKING & MATRIX ================= */}
      {effectiveTab === 'masterboard' && (
        <HRFacultyRankingAndMatrix
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

      {/* ================= MODULE 5: ACCREDITATION & AUDIT LOGS ================= */}
      {(effectiveTab === 'audit' || effectiveTab === 'reports') && (
        <HRAccreditationAndAuditLogs
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
