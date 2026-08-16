import React, { useState } from 'react'
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  Filter,
  BarChart3,
  Search,
  ChevronRight
} from 'lucide-react'

export default function OSADIdentifyAwardeesPage({
  awardCategories,
  awardees,
  getStudentLeaderboards,
  confirmAwardee
}) {
  const [selectedAward, setSelectedAward] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const leaderboards = typeof getStudentLeaderboards === 'function'
    ? (getStudentLeaderboards(selectedAward, searchTerm) || [])
    : []

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#1b4332] dark:bg-[#0a2417] text-white border border-[#245233] dark:border-emerald-900/60 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2d8a4e] border border-emerald-400/30 flex items-center justify-center text-white shrink-0">
            <Trophy className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">Identify Awardees &amp; Automated Honor Roll</h2>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold uppercase">
                STUDENTS ONLY
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 font-medium">
              Multi-criteria scoring algorithm for NDMU Araw ng Parangal &amp; Dean's Honor Roll verification.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student candidates..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'Deans List', 'Leadership', 'Sports'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedAward(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedAward === cat
                  ? 'bg-[#1b4332] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ranking List Table */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="p-4">Rank &amp; Student Candidate</th>
                <th className="p-4">Program &amp; College</th>
                <th className="p-4">Award Category</th>
                <th className="p-4">Composite Score</th>
                <th className="p-4 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
              {leaderboards.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No student candidates match the current scoring parameters.
                  </td>
                </tr>
              ) : (
                leaderboards.map((candidate, idx) => (
                  <tr key={candidate.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{candidate.student_name || candidate.name}</p>
                          <p className="text-[11px] text-slate-500">{candidate.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold">{candidate.program}</p>
                      <p className="text-[11px] text-slate-500">{candidate.college}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-100 dark:border-emerald-800/50">
                        {candidate.award_title || 'Araw ng Parangal'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{candidate.score || 94.5} / 100</p>
                      <p className="text-[11px] text-slate-400">{candidate.verified_proofs || 4} verified items</p>
                    </td>
                    <td className="p-4 text-right">
                      {candidate.confirmed ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#1b4332] dark:text-emerald-300 text-[11px] font-extrabold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Confirmed Awardee</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => confirmAwardee(candidate.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#1b4332] hover:bg-[#2d8a4e] text-white text-[11px] font-extrabold transition cursor-pointer"
                        >
                          Confirm Awardee
                        </button>
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
  )
}
