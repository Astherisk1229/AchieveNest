/**
 * HRDashboardView.jsx
 * Phase 8: Human Resource (HR) Office Executive Admin Portal View Component.
 * Streamlined to 4 Core HR Modules adhering to OOP/MVC standards via useHR hook.
 */

import React, { useState } from 'react'
import {
  Users, Building2, FileCheck, ShieldCheck, Search, Filter, CheckCircle2,
  Clock, Download, UserPlus, FileText, Lock, Sparkles, Eye
} from 'lucide-react'
import { useHR } from '../../hooks/useHR'
import HRModel from '../../models/HRModel'
import DepartmentSecretaryAssignmentModal from './DepartmentSecretaryAssignmentModal'
import CreatePersonnelAccountModal from './CreatePersonnelAccountModal'

export default function HRDashboardView({ currentUser }) {
  const hrUser = currentUser || { full_name: 'Director Evelyn Tan', email: 'hr@ndmu.edu.ph', employee_id: 'HR-2010-001' }

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

  // Modal Form State & Password Reset Temp Pass Inputs
  const [isAssignDeptSecModalOpen, setIsAssignDeptSecModalOpen] = useState(false)
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false)
  const [verificationSubTab, setVerificationSubTab] = useState('direct_hr') // 'direct_hr' | 'endorsed_dept'
  const [newRank, setNewRank] = useState('Assistant Professor I')
  const [newStatus, setNewStatus] = useState('Full-Time Permanent')
  const [returnRemarks, setReturnRemarks] = useState('')
  const [sealCode, setSealCode] = useState('HR-SEAL-2026-0099')
  const [tempPassMap, setTempPassMap] = useState({})
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleApproveResetClick = (reqId, email) => {
    const customPass = tempPassMap[reqId] || 'NDMU-Faculty2026!'
    handleApprovePasswordReset(reqId, customPass, hrUser.full_name)
    showToast(`Approved password reset for [${email}]. Issued temp credentials: ${customPass}`)
  }

  // Open Rank Modal Helper
  const openRankModal = (personnel) => {
    setSelectedPersonnel(personnel)
    setNewRank(personnel.academic_rank)
    setNewStatus(personnel.employment_status)
    setIsRankModalOpen(true)
  }

  // Open Proof Modal Helper
  const openProofModal = (accomplishment) => {
    setSelectedAccomplishment(accomplishment)
    setReturnRemarks('')
    setSealCode(`HR-SEAL-2026-${Math.floor(1000 + Math.random() * 9000)}`)
    setIsProofModalOpen(true)
  }

  // Export CSV Handler
  const exportCSV = (filename, rows) => {
    const processRow = row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(processRow).join('\n')
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

  return (
    <div className="space-y-6 font-sans text-slate-900 selection:bg-[#2d8a4e] selection:text-white pb-12">
      
      {/* ================= HERO EXECUTIVE BANNER ================= */}
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
              {hrUser.full_name} ({hrUser.employee_id}) • University Personnel Governance & Verification Suite
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

        {/* Finalized 5 Core HR Portal Navigation Bar */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-emerald-800/60 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: '1. Dashboard', icon: Building2 },
            { id: 'personnel', label: '2. Personnel Governance', icon: Users },
            { id: 'verification', label: `3. Verification Queue (${stats.pendingEndorsements})`, icon: FileCheck, badge: stats.pendingEndorsements },
            { id: 'masterboard', label: '4. Faculty Ranking & Matrix', icon: Sparkles },
            { id: 'audit', label: '5. Accreditation & Audit Logs', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#1b4332] shadow-md scale-[1.02]'
                    : 'bg-emerald-950/40 text-emerald-100/80 hover:bg-emerald-900/60 hover:text-white border border-emerald-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-[#1b4332] text-white' : 'bg-amber-400 text-slate-900'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-900 text-white text-xs font-bold shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================= MODULE 1: EXECUTIVE COMMAND CENTER ================= */}
      {activeTab === 'overview' && (
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
              <p className="text-xs text-slate-500 mt-1 font-medium">Faculty & Administrative Staff</p>
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
                <Sparkles className="w-5 h-5 text-[#2d8a4e]" /> HR Executive Action & Governance Hub
              </h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">4 Workflows</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Personnel & Rank Governance */}
              <button
                onClick={() => setActiveTab('personnel')}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-[#eaf4ed] border border-slate-200 hover:border-[#d2e8d7] text-left transition group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] mb-3 shadow-2xs">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1b4332]">Personnel & Rank Governance</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Manage Faculty roster, employment status & academic rank promotions.</p>
                </div>
              </button>

              {/* Card 2: Faculty Verification Queue */}
              <button
                onClick={() => setActiveTab('verification')}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-[#eaf4ed] border border-slate-200 hover:border-[#d2e8d7] text-left transition group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] mb-3 shadow-2xs">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1b4332]">Review Endorsement Queue</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Inspect supporting proof files & stamp official HR seal on accomplishments.</p>
                </div>
              </button>

              {/* Card 3: NDMU Rating Matrix & Reports */}
              <button
                onClick={handleExportFacultyMatrix}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-[#eaf4ed] border border-slate-200 hover:border-[#d2e8d7] text-left transition group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] mb-3 shadow-2xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1b4332]">Accreditation & Ranking Matrix</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Export PACUCOA, CHEd & NDMU annual audit faculty reports.</p>
                </div>
              </button>

              {/* Card 4: System Audit Logs */}
              <button
                onClick={() => setActiveTab('reports')}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-[#eaf4ed] border border-slate-200 hover:border-[#d2e8d7] text-left transition group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 group-hover:border-[#2d8a4e] flex items-center justify-center text-[#2d8a4e] mb-3 shadow-2xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1b4332]">System Security Logs</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Audit file binary hashes, score seals & user rank modification logs.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Faculty & Personnel Password Reset Queue Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Faculty &amp; Personnel Password Reset Queue</h3>
                  <p className="text-xs text-slate-500 font-medium">HR oversight for faculty, program coordinator, &amp; department secretary password resets</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs">
                {passwordResets.filter(r => r.status === 'pending').length} Pending Requests
              </span>
            </div>

            {passwordResets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                No active password reset requests in queue.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {passwordResets.map(req => (
                  <div key={req.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{req.user_name || req.user_email}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{req.user_email}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        req.status === 'approved' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {req.status === 'approved' ? '✓ Approved' : '● Pending HR Review'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60 font-medium leading-relaxed">
                      "{req.remarks || 'Requested institutional password reset.'}"
                    </p>

                    {req.status === 'pending' ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          placeholder="Temp password (default: NDMU-Faculty2026!)"
                          value={tempPassMap[req.id] || ''}
                          onChange={(e) => setTempPassMap({ ...tempPassMap, [req.id]: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleApproveResetClick(req.id, req.user_email)}
                          className="w-full py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs transition cursor-pointer shadow-xs"
                        >
                          Approve &amp; Issue Temporary Credentials
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#1b4332] flex items-center justify-between">
                        <span>Temporary Credentials:</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 text-slate-800">{req.temp_password || 'NDMU-Faculty2026!'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODULE 2: PERSONNEL DIRECTORY & RANK TRACK ================= */}
      {activeTab === 'personnel' && (
        <div className="space-y-6">
          {/* Search & College Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search personnel by name, ID, or dept..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={collegeFilter}
                onChange={e => setCollegeFilter(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#2d8a4e]"
              >
                <option value="ALL">All Colleges & Units</option>
                <option value="CEAC">CEAC - Engineering & Computing</option>
                <option value="CBA">CBA - Business Administration</option>
                <option value="CAS">CAS - Arts and Sciences</option>
              </select>
            </div>
          </div>

          {/* Personnel Table */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">University Personnel Directory & Role Governance</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage academic ranks and designate Department Secretary governance roles</p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAssignDeptSecModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#12361e] text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Assign Dept Secretary</span>
                </button>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">{filteredPersonnel.length} Employees</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200/60">
                    <th className="p-4 pl-6">Personnel Information</th>
                    <th className="p-4">Academic Rank</th>
                    <th className="p-4">Employment Standing</th>
                    <th className="p-4">Tenure & Accomplishments</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredPersonnel.map(p => (
                    <tr key={p.id} className="hover:bg-emerald-50/40 transition">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <img src={p.avatar_url} alt={p.full_name} className="w-10 h-10 rounded-2xl object-cover border border-slate-200" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{p.full_name}</p>
                          <p className="text-[11px] text-slate-500">{p.employee_id} • {p.department}</p>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#1b4332] border border-[#d2e8d7] font-bold">
                          {p.academic_rank}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {p.employment_status}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-900">{p.tenure_years} Years Tenure</p>
                        <p className="text-[11px] text-[#2d8a4e]">{p.verified_accomplishments_count} Verified Proofs</p>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => openRankModal(p)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#1b4332] text-white hover:bg-[#12361e] font-bold text-xs transition cursor-pointer"
                        >
                          Edit Rank
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 3: FACULTY VERIFICATION QUEUE ================= */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#2d8a4e]" /> Anti-Bias Verification Queue Engine
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                To prevent department-level bias, HR Admin directly verifies accomplishments of Department Secretaries &amp; Institutional &amp; Higher Education Officials (College Deans, Program Coordinators). Regular faculty submissions endorsed by secretaries are listed in the Department-Endorsed Queue.
              </p>
            </div>

            {/* Sub-Tabs: Direct HR Anti-Bias Queue vs Department-Endorsed Queue */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setVerificationSubTab('direct_hr')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                  verificationSubTab === 'direct_hr'
                    ? 'bg-[#1b4332] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Direct HR Verification Queue ({directHRQueue.length || accomplishments.length})</span>
                <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-black">
                  Secretaries &amp; Institutional Officials
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVerificationSubTab('endorsed_dept')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                  verificationSubTab === 'endorsed_dept'
                    ? 'bg-[#1b4332] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileCheck className="w-4 h-4 text-emerald-300" />
                <span>Department-Endorsed Queue ({endorsedQueue.length})</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {(verificationSubTab === 'direct_hr' ? (directHRQueue.length > 0 ? directHRQueue : accomplishments) : endorsedQueue).map(acc => (
              <div key={acc.id} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      acc.status === 'hr_verified' ? 'bg-emerald-100 text-[#1b4332]' : acc.status === 'returned' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {acc.status === 'hr_verified' ? 'HR Verification Sealed' : acc.status === 'returned' ? 'Returned' : 'Pending HR Verification'}
                    </span>
                    {verificationSubTab === 'direct_hr' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                        Institutional &amp; Higher Education Official / Secretary
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">Endorsed {acc.secretary_endorsement_date}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{acc.title}</h3>
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">{acc.faculty_name}</strong> • {acc.college} ({acc.department}) • Category: <span className="font-semibold text-[#2d8a4e]">{acc.category}</span>
                  </p>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <strong className="text-slate-800">Verification Note:</strong> "{acc.secretary_remarks}"
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => openProofModal(acc)}
                    className="px-4 py-2.5 rounded-2xl bg-[#1b4332] text-white hover:bg-[#12361e] font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Inspect &amp; Verify
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 4: ACCREDITATION REPORTS & AUDIT LOGS ================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#2d8a4e]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">CHEd & PACUCOA Faculty Qualification Matrix</h3>
                <p className="text-xs text-slate-500 mt-1">Export complete university-wide faculty academic ranks, tenure years, degree qualifications, and verified publication numbers in standardized CSV format.</p>
              </div>
              <button
                onClick={handleExportFacultyMatrix}
                className="w-full py-3 rounded-2xl bg-[#1b4332] text-white hover:bg-[#12361e] font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Official CSV Matrix
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Faculty Promotion Board Dossier Compiler</h3>
                <p className="text-xs text-slate-500 mt-1">Compile verified accomplishment files and seal records into an aggregated promotion summary for institutional promotion evaluation boards.</p>
              </div>
              <button
                onClick={() => exportCSV('Faculty_Promotion_Board_Summary.csv', [
                  ['Employee ID', 'Name', 'Current Rank', 'Target Promotion Track', 'Verified Points'],
                  ...filteredPersonnel.map(p => [p.employee_id, p.full_name, p.academic_rank, 'Promotion Candidate', p.verified_accomplishments_count])
                ])}
                className="w-full py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Compile Promotion Board CSV
              </button>
            </div>
          </div>

          {/* Security Audit Trail Table */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#2d8a4e]" /> HR Security Audit Trail
              </h2>
              <span className="text-xs font-bold text-slate-500">{auditLogs.length} Transactions Logged</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map(log => (
                <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px] uppercase border border-slate-200">
                        {log.action_type}
                      </span>
                      <span className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="font-bold text-slate-900">{log.details}</p>
                    <p className="text-slate-500 text-[11px]">Target Personnel: <strong className="text-slate-700">{log.target_personnel}</strong></p>
                  </div>
                  <span className="text-[11px] text-[#2d8a4e] font-semibold shrink-0">{log.admin_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT RANK MODAL ================= */}
      {isRankModalOpen && selectedPersonnel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">Update Academic Rank & Status</h3>
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
                onClick={() => setIsRankModalOpen(false)}
                className="w-1/2 py-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateRank(selectedPersonnel.id, newRank, newStatus)}
                className="w-1/2 py-3 rounded-xl bg-[#1b4332] text-white hover:bg-[#12361e] font-bold text-xs shadow-md"
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
              <h3 className="text-lg font-extrabold text-slate-900">HR Accomplishment Verification & Seal</h3>
              <button onClick={() => setIsProofModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <h4 className="font-bold text-[#1b4332] text-sm">{selectedAccomplishment.title}</h4>
                <p className="text-slate-600">{selectedAccomplishment.faculty_name} • {selectedAccomplishment.college}</p>
                <p className="text-slate-500 font-mono text-[11px] mt-1">Publisher/Issuer: {selectedAccomplishment.publisher_or_issuer}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Secretary Remarks</label>
                <p className="p-3 rounded-xl bg-slate-50 text-slate-700 italic border border-slate-200">
                  "{selectedAccomplishment.secretary_remarks}"
                </p>
              </div>

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
                onClick={() => handleReturnAccomplishment(selectedAccomplishment.id, returnRemarks || 'Returned for document re-inspection.')}
                className="w-1/2 py-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs"
              >
                Return to Faculty
              </button>
              <button
                onClick={() => handleSealVerification(selectedAccomplishment.id, sealCode)}
                className="w-1/2 py-3 rounded-xl bg-[#1b4332] text-white hover:bg-[#12361e] font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Stamp HR Seal & Verify
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
        onAssign={handleAssignDepartmentSecretary}
      />

      {/* CREATE PERSONNEL ACCOUNT MODAL */}
      <CreatePersonnelAccountModal
        isOpen={isCreateAccountModalOpen}
        onClose={() => setIsCreateAccountModalOpen(false)}
        onSave={handleCreatePersonnelAccount}
      />

    </div>
  )
}
