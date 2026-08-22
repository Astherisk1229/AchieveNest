import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDepSecVerification } from '../../../hooks/useDepSecVerification'
import DepartmentSecretaryPortfolioRoster from './DepartmentSecretaryPortfolioRoster'
import DepartmentSecretaryEvaluationWorkbench from './DepartmentSecretaryEvaluationWorkbench'
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  TrendingUp, 
  Users, 
  FileText, 
  Filter, 
  Activity, 
  Award, 
  ArrowLeft, 
  Building2,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react'

export default function DepartmentSecretaryDashboardPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTabParam = searchParams.get('tab') || 'overview'
  
  // Standardize active tab
  const activeTab = ['overview', 'workspace', 'workbench', 'personnel', 'roster'].includes(activeTabParam) 
    ? (activeTabParam === 'workbench' ? 'workspace' : activeTabParam === 'roster' ? 'personnel' : activeTabParam)
    : 'overview'

  const {
    portfolios,
    selectedPortfolio,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectPortfolio,
    updateItemVerification,
    endorseToHR,
    returnToPersonnel,
    error
  } = useDepSecVerification(currentUser?.department || 'DEP-CEAC')

  // Counts for metric summary cards
  const pendingCount = portfolios.filter(p => p.status === 'SUBMITTED_TO_DEP_SEC' || p.status === 'UNDER_DEP_SEC_REVIEW').length
  const endorsedCount = portfolios.filter(p => p.status === 'ENDORSED_TO_HR' || p.status === 'HR_APPROVED').length
  const returnedCount = portfolios.filter(p => p.status === 'RETURNED_TO_PERSONNEL').length
  const avgReviewTime = '1.8 hrs'

  // Auto-select first available portfolio if on workspace tab and none selected
  useEffect(() => {
    if (activeTab === 'workspace' && !selectedPortfolio && portfolios.length > 0) {
      const candidate = portfolios.find(p => p.personnel_id !== currentUser?.id) || portfolios[0]
      if (candidate) selectPortfolio(candidate)
    }
  }, [activeTab, selectedPortfolio, portfolios, currentUser, selectPortfolio])

  const handleSelectPortfolio = (portfolio) => {
    selectPortfolio(portfolio)
    setSearchParams({ tab: 'workspace' })
  }

  const handleBackToRoster = () => {
    setSearchParams({ tab: 'personnel' })
  }

  const handleCardClick = (statusFilterValue) => {
    setStatusFilter(statusFilterValue)
    setSearchParams({ tab: 'workspace' })
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* ================= 1. OVERVIEW TAB ================= */}
      {activeTab === 'overview' && (
        <>
          {/* Top Hero Dark Emerald Banner */}
          <div className="bg-[#EFF7F0] dark:bg-[#21372A] p-6 sm:p-8 rounded-3xl shadow-xl border border-[#69A97C] dark:border-[#466B54] relative overflow-hidden">
            <div className="flex items-start justify-between relative z-10 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E7F5EA] dark:bg-[#1D2A23] border border-[#69A97C]/30 flex items-center justify-center text-[#159552] dark:text-[#59AD7C] shadow-sm shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-extrabold text-[#17663B] dark:text-[#EFF6F1] tracking-tight">Department Secretary Dashboard</h1>
                  </div>
                  <p className="text-xs text-[#356148] dark:text-[#BCD0C1] font-medium mt-0.5">
                    Faculty Portfolio Evaluation & Verification • {currentUser?.department_name || 'College of Engineering, Architecture & Computing'}
                  </p>
                </div>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-[#E7F5EA] dark:bg-[#1D2A23] border border-[#69A97C]/30 flex items-center justify-center text-[#159552] dark:text-[#59AD7C] shadow-sm">
                <Award className="w-5 h-5" />
              </div>
            </div>

            {/* 4 Interactive Metric Counter Cards inside Hero Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              
              {/* Card 1: Pending Reviews */}
              <div 
                onClick={() => handleCardClick('SUBMITTED_TO_DEP_SEC')}
                className="p-4 rounded-2xl bg-white dark:bg-[#1D2A23] hover:bg-[#F7FAF7] dark:hover:bg-[#233129] border border-[#DCE6DF] dark:border-[#374B3F] transition-all cursor-pointer group shadow-[0_4px_10px_rgba(31,70,48,0.08)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#704B12] dark:text-amber-300 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-[#FFF7E6] dark:bg-amber-950/60 flex items-center justify-center text-[#B7791F] shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                    Pending Reviews
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#708579] dark:text-[#87978D] group-hover:text-[#123D2A] dark:group-hover:text-[#E6EFE9] transition" />
                </div>
                <div className="text-3xl font-extrabold text-[#123D2A] dark:text-[#E6EFE9]">{pendingCount}</div>
              </div>

              {/* Card 2: Endorsed to HR */}
              <div 
                onClick={() => handleCardClick('ENDORSED_TO_HR')}
                className="p-4 rounded-2xl bg-white dark:bg-[#1D2A23] hover:bg-[#F7FAF7] dark:hover:bg-[#233129] border border-[#DCE6DF] dark:border-[#374B3F] transition-all cursor-pointer group shadow-[0_4px_10px_rgba(31,70,48,0.08)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#245F42] dark:text-emerald-300 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-[#E7F5EA] dark:bg-emerald-950/60 flex items-center justify-center text-[#16834A] shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    Endorsed to HR
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#708579] dark:text-[#87978D] group-hover:text-[#123D2A] dark:group-hover:text-[#E6EFE9] transition" />
                </div>
                <div className="text-3xl font-extrabold text-[#123D2A] dark:text-[#E6EFE9]">{endorsedCount}</div>
              </div>

              {/* Card 3: Returned */}
              <div 
                onClick={() => handleCardClick('RETURNED_TO_PERSONNEL')}
                className="p-4 rounded-2xl bg-white dark:bg-[#1D2A23] hover:bg-[#F7FAF7] dark:hover:bg-[#233129] border border-[#DCE6DF] dark:border-[#374B3F] transition-all cursor-pointer group shadow-[0_4px_10px_rgba(31,70,48,0.08)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#7A3333] dark:text-rose-300 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-[#FFF0F0] dark:bg-rose-950/60 flex items-center justify-center text-[#B54747] shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </span>
                    Returned
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#708579] dark:text-[#87978D] group-hover:text-[#123D2A] dark:group-hover:text-[#E6EFE9] transition" />
                </div>
                <div className="text-3xl font-extrabold text-[#123D2A] dark:text-[#E6EFE9]">{returnedCount}</div>
              </div>

              {/* Card 4: Avg Review Time */}
              <div 
                onClick={() => setSearchParams({ tab: 'personnel' })}
                className="p-4 rounded-2xl bg-white dark:bg-[#1D2A23] hover:bg-[#F7FAF7] dark:hover:bg-[#233129] border border-[#DCE6DF] dark:border-[#374B3F] transition-all cursor-pointer group shadow-[0_4px_10px_rgba(31,70,48,0.08)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#31586F] dark:text-blue-300 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-[#EDF6FA] dark:bg-blue-950/60 flex items-center justify-center text-[#356A8A] shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </span>
                    Avg Review Time
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#708579] dark:text-[#87978D] group-hover:text-[#123D2A] dark:group-hover:text-[#E6EFE9] transition" />
                </div>
                <div className="text-3xl font-extrabold text-[#123D2A] dark:text-[#E6EFE9]">{avgReviewTime}</div>
              </div>

            </div>
          </div>

          {/* Department Scope Banner Sub-header */}
          <div className="bg-white dark:bg-[#1D2A23] p-4 rounded-2xl border border-[#DCE6DF] dark:border-[#374B3F] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E7F5EA] dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-[#159552] shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#102A43] dark:text-[#E6EFE9]">
                  Department Scope: {currentUser?.department_name || 'College of Engineering, Architecture & Computing (DEP-CEAC)'}
                </h3>
                <p className="text-[11px] text-[#4F6475] dark:text-[#B1C0B6]">
                  You can only view and evaluate faculty ranking portfolios submitted within your assigned department.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#159552] text-white shadow-xs shrink-0">
              ● Department Secretary Mode
            </span>
          </div>

          {/* Two-Column Dashboard Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Recent Verification Activity Log */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E7F3E9] dark:bg-emerald-950/60 flex items-center justify-center text-[#16834a]">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Verification Activity Log</h3>
                    <p className="text-[11px] text-slate-400">Real-time audit stream for department faculty evaluation</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F3E9] dark:bg-emerald-950/60 text-[#064e2b] dark:text-[#245F42] border border-[#d2e8d7] dark:border-emerald-800/60">
                  Live Audit Stream
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#E7F3E9] dark:bg-emerald-950/60 text-[#16834a] flex items-center justify-center shrink-0 mt-0.5 border border-[#d2e8d7] dark:border-emerald-800/60">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Endorsed Ph.D. Portfolio to HR</div>
                      <div className="text-[11px] text-slate-500">Verified all line items & document proofs for Dr. Maria Santos</div>
                      <div className="text-[10px] text-slate-400 mt-1">25 mins ago</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#E7F3E9] text-[#064e2b] dark:bg-emerald-950/60 dark:text-[#245F42] border border-[#d2e8d7] dark:border-emerald-800/60">
                    ENDORSED
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Started Score Evaluation</div>
                      <div className="text-[11px] text-slate-500">Opened line-item point audit for Engr. Roberto Cruz</div>
                      <div className="text-[10px] text-slate-400 mt-1">1 hr ago</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    UNDER REVIEW
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#E7F3E9] dark:bg-emerald-950/60 text-[#16834a] flex items-center justify-center shrink-0 mt-0.5 border border-[#d2e8d7] dark:border-emerald-800/60">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Self-Portfolio HR Direct Audit Bypass</div>
                      <div className="text-[11px] text-slate-500">Secretary self-portfolio routed directly to HR Director for independent audit</div>
                      <div className="text-[10px] text-slate-400 mt-1">3 hrs ago</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#E7F3E9] text-[#064e2b] dark:bg-emerald-950/60 dark:text-[#245F42] border border-[#d2e8d7] dark:border-emerald-800/60">
                    HR DIRECT
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Department Secretary Guidelines */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-[#E7F3E9] dark:bg-emerald-950/60 flex items-center justify-center text-[#16834a]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Secretary Guidelines</h3>
                  <p className="text-[11px] text-slate-400">Verification Standards & SLA Policy</p>
                </div>
              </div>

              <div className="space-y-3 font-sans">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
                    <Clock className="w-3.5 h-3.5 text-[#16834a]" /> Review SLA Commitment
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Review pending faculty submissions within <strong className="text-slate-900 dark:text-white">48 to 72 hours</strong> of submission to maintain institutional ranking compliance.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#E7F3E9] dark:bg-emerald-950/40 border border-[#d2e8d7] dark:border-emerald-800/60 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#064e2b] dark:text-[#245F42]">
                    <Award className="w-3.5 h-3.5 text-[#16834a]" /> Score Ceiling &amp; Cap Rules
                  </div>
                  <p className="text-[11px] text-[#064e2b]/90 dark:text-[#245F42] leading-relaxed font-medium">
                    Area A (Prof Dev): <strong>70 pts max</strong>; Area B (Productivity): <strong>50 pts max</strong>; Area C (Leadership): <strong>40 pts max</strong>. Total Capped Max: <strong>160 pts</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16834a]" /> Conflict of Interest Guard
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Department Secretaries cannot self-evaluate their own portfolio. Self-portfolios automatically bypass department review to HR Director.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* ================= 2. VERIFICATION WORKSPACE TAB ================= */}
      {activeTab === 'workspace' && (
        selectedPortfolio ? (
          <DepartmentSecretaryEvaluationWorkbench
            portfolio={selectedPortfolio}
            onUpdateItemVerification={updateItemVerification}
            onEndorseToHR={endorseToHR}
            onReturnToPersonnel={returnToPersonnel}
            onBackToRoster={handleBackToRoster}
            error={error}
          />
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-lg space-y-4">
            <FileCheck2 className="w-12 h-12 text-emerald-500 mx-auto stroke-1" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Faculty Selected for Evaluation</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please select a faculty member from the Personnel Roster to launch line-item score verification and evidence auditing.
            </p>
            <button
              onClick={handleBackToRoster}
              className="button-return text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4 text-[#174E31]" />
              <span>Return to Personnel Roster</span>
            </button>
          </div>
        )
      )}

      {/* ================= 3. PERSONNEL ROSTER TAB ================= */}
      {activeTab === 'personnel' && (
        <DepartmentSecretaryPortfolioRoster
          portfolios={portfolios}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onSelectPortfolio={handleSelectPortfolio}
          selectedPortfolio={selectedPortfolio}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
