import React from 'react'
import { Trophy, ShieldCheck, Sparkles, UserCheck, FileSpreadsheet, ShieldAlert, TrendingUp, Award, ChevronRight } from 'lucide-react'
import InstitutionalWorkflowGuideBar from '../../components/common/InstitutionalWorkflowGuideBar'

export default function OSADCommandCenterPage({ setSearchParams, awardees }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">

      {/* Hero Executive Header Banner */}
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

      {/* Institutional Setup Flow Stepper */}
      <InstitutionalWorkflowGuideBar currentStep={6} activeAdmin="osad" />

      {/* Executive Quick Action & Governance Hub */}
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
                <ShieldAlert className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition">System Security Logs</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-snug">Audit file binary magic bytes & user role changes</p>
            </div>
          </button>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
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
  )
}
