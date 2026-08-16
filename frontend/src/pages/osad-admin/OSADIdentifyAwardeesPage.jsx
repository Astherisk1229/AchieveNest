import React, { useState } from 'react'
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  Search,
  Crown,
  UserCheck,
  TrendingUp,
  BarChart3,
  Check
} from 'lucide-react'

export default function OSADIdentifyAwardeesPage({
  awardCategories = [],
  awardees = [],
  getStudentLeaderboards,
  confirmAwardee
}) {
  const [selectedAward, setSelectedAward] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const leaderboards = typeof getStudentLeaderboards === 'function'
    ? (getStudentLeaderboards(selectedAward, searchTerm) || [])
    : []

  const top3Candidates = leaderboards.slice(0, 3)
  const confirmedCount = leaderboards.filter(c => c.confirmed).length
  const maxScore = leaderboards.length > 0 ? Math.max(...leaderboards.map(c => c.score || 90)) : 0
  const avgScore = leaderboards.length > 0
    ? (leaderboards.reduce((acc, curr) => acc + (curr.score || 90), 0) / leaderboards.length).toFixed(1)
    : 0

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
            <Trophy className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Identify Awardees &amp; Honor Roll
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#2d8a4e] dark:text-emerald-400 text-[10px] font-black uppercase">
                Automated Scoring
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Multi-criteria scoring &amp; verification for NDMU Araw ng Parangal and Dean's Honor Roll
            </p>
          </div>
        </div>

        {/* Quick Analytics Micro-Strip (No heavy borders!) */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 self-start md:self-auto pt-2 md:pt-0">
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block">Candidates</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{leaderboards.length}</span>
          </div>
          <span className="text-slate-200 dark:text-slate-800">|</span>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block">Top Score</span>
            <span className="text-sm font-black text-[#2d8a4e] dark:text-emerald-400">{maxScore || 98.5}</span>
          </div>
          <span className="text-slate-200 dark:text-slate-800">|</span>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block">Confirmed</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{confirmedCount}</span>
          </div>
        </div>
      </div>

      {/* TOP 3 HONOR ROLL LEADERS (Clean Editorial Cards — No heavy outline shapes) */}
      {top3Candidates.length >= 3 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Honor Roll Podium Leaders</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Weighted Multi-Criteria Evaluation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1st Place Gold */}
            <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-amber-300 dark:border-amber-800/60 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-1">
                    <span>🥇</span> 1st Place Gold
                  </span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    {top3Candidates[0]?.score || 98.5} <span className="text-xs text-slate-400 font-medium">/ 100</span>
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {top3Candidates[0]?.student_name || top3Candidates[0]?.name}
                  </h4>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                    {top3Candidates[0]?.program} • <span className="text-slate-400">{top3Candidates[0]?.college}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">{top3Candidates[0]?.verified_proofs || 4} verified items</span>
                {top3Candidates[0]?.confirmed ? (
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Confirmed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => confirmAwardee(top3Candidates[0]?.id)}
                    className="px-3 py-1 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-extrabold transition cursor-pointer"
                  >
                    Confirm Awardee
                  </button>
                )}
              </div>
            </div>

            {/* 2nd Place Silver */}
            <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300 tracking-wider uppercase flex items-center gap-1">
                    <span>🥈</span> 2nd Place Silver
                  </span>
                  <span className="text-base font-black text-slate-700 dark:text-slate-300">
                    {top3Candidates[1]?.score || 95.0} <span className="text-xs text-slate-400 font-medium">/ 100</span>
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {top3Candidates[1]?.student_name || top3Candidates[1]?.name}
                  </h4>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                    {top3Candidates[1]?.program} • <span className="text-slate-400">{top3Candidates[1]?.college}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">{top3Candidates[1]?.verified_proofs || 3} verified items</span>
                {top3Candidates[1]?.confirmed ? (
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Confirmed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => confirmAwardee(top3Candidates[1]?.id)}
                    className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold transition cursor-pointer"
                  >
                    Confirm Awardee
                  </button>
                )}
              </div>
            </div>

            {/* 3rd Place Bronze */}
            <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-800 dark:text-amber-500 tracking-wider uppercase flex items-center gap-1">
                    <span>🥉</span> 3rd Place Bronze
                  </span>
                  <span className="text-base font-black text-amber-800 dark:text-amber-500">
                    {top3Candidates[2]?.score || 92.8} <span className="text-xs text-slate-400 font-medium">/ 100</span>
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {top3Candidates[2]?.student_name || top3Candidates[2]?.name}
                  </h4>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                    {top3Candidates[2]?.program} • <span className="text-slate-400">{top3Candidates[2]?.college}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">{top3Candidates[2]?.verified_proofs || 3} verified items</span>
                {top3Candidates[2]?.confirmed ? (
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Confirmed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => confirmAwardee(top3Candidates[2]?.id)}
                    className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold transition cursor-pointer"
                  >
                    Confirm Awardee
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Toolbar Search & Category Pills */}
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate by name or program..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e] transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'Deans List', 'Leadership', 'Sports', 'Research'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedAward(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedAward === cat
                  ? 'bg-[#2d8a4e] text-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* EDITORIAL CANDIDATE DIRECTORY WITH INLINE LEADERBOARD SCORE BARS (No heavy table shapes!) */}
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2d8a4e]" />
              <span>Student Candidate Rankings &amp; Score Progress</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Automated composite score evaluation based on verified achievements</p>
          </div>
          <span className="text-[11px] font-bold text-slate-400">{leaderboards.length} Candidates Evaluated</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {leaderboards.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No student candidates match the current filter parameters.
            </div>
          ) : (
            leaderboards.map((candidate, idx) => {
              const score = candidate.score || 90
              const percent = Math.min(100, Math.max(0, score))

              return (
                <div key={candidate.id || idx} className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Candidate Info */}
                  <div className="flex items-center gap-3 min-w-0 md:w-1/3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      idx === 0 
                        ? 'bg-amber-400 text-slate-950' 
                        : idx === 1 
                        ? 'bg-slate-300 text-slate-900' 
                        : idx === 2 
                        ? 'bg-amber-700 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {candidate.student_name || candidate.name}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 truncate">
                        {candidate.program} • <span className="text-slate-400">{candidate.college}</span>
                      </p>
                    </div>
                  </div>

                  {/* Inline Score Leaderboard Progress Bar */}
                  <div className="flex-1 space-y-1 md:px-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-400">{candidate.award_title || 'Araw ng Parangal'}</span>
                      <span className="font-extrabold text-[#2d8a4e] dark:text-emerald-400">{score} / 100</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                            : idx === 1 
                            ? 'bg-gradient-to-r from-slate-400 to-slate-500' 
                            : idx === 2 
                            ? 'bg-gradient-to-r from-amber-700 to-amber-800' 
                            : 'bg-gradient-to-r from-emerald-500 to-[#2d8a4e]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Verification Status & Action */}
                  <div className="flex items-center justify-end gap-3 shrink-0 self-end md:self-auto">
                    {candidate.confirmed ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 text-xs font-black flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-[#2d8a4e]" />
                        <span>Confirmed</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => confirmAwardee(candidate.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] active:scale-[0.99] text-white font-extrabold text-xs transition cursor-pointer shadow-2xs"
                      >
                        Confirm Awardee
                      </button>
                    )}
                  </div>

                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}
