import React from 'react'
import {
  Trophy,
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Percent,
  Calendar,
  FileCheck,
  ShieldCheck,
  UserCheck,
  Info
} from 'lucide-react'

export default function AwardEvaluationSummaryModal({ isOpen, onClose, candidate, award }) {
  if (!isOpen || !candidate) return null

  const isDeanNomination = candidate.pathway === 'dean_nomination' || candidate.candidate_pathway === 'dean_nomination'
  const rawScore = parseFloat(candidate.portfolio_raw_score || candidate.raw_score || candidate.totalPoints || 0).toFixed(2)
  const maxComputable = parseFloat(candidate.max_computable_score || 50.0).toFixed(2)
  const potentialScore = candidate.potential_score !== null && candidate.potential_score !== undefined
    ? parseFloat(candidate.potential_score).toFixed(2)
    : (candidate.potentialScore ? parseFloat(candidate.potentialScore).toFixed(2) : (isDeanNomination ? null : '0.00'))

  const thresholdPercent = '80.00'
  const thresholdMet = potentialScore !== null && parseFloat(potentialScore) >= parseFloat(thresholdPercent)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col font-sans">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16834a] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  Portfolio-Based Award Evaluation Summary
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                  Immutable Snapshot (v1.0)
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {candidate.name || candidate.student_name || 'Student Evaluation Summary'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {award?.name || 'Notre Dame Award'} • AY 2025-2026
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Portfolio Raw Score
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{rawScore}</span>
                <span className="text-xs font-bold text-slate-400">/ {maxComputable} max</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                Sum of computable criteria points
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Portfolio Potential Score
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className={`text-2xl font-black ${thresholdMet ? 'text-[#16834a] dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {potentialScore !== null ? `${potentialScore}%` : 'N/A'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                Threshold: {thresholdPercent}% ({thresholdMet ? 'Met' : 'Below Threshold'})
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Candidate Pathway
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${isDeanNomination ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'}`}>
                  {isDeanNomination ? 'Dean Direct Nomination' : 'Automatic Portfolio'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                {isDeanNomination ? 'Bypasses 80% threshold (Zero synthetic points)' : 'Generated via verified evidence'}
              </span>
            </div>
          </div>

          {/* Section: Computable Criteria Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#16834a]" />
                Portfolio-Computable Criteria Breakdown
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Rule Family: sum_capped / matrix_mapping
              </span>
            </div>

            <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              <div className="p-3.5 bg-white dark:bg-[#131e2e] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Leadership and Governance
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Rule: CRIT_LEADERSHIP_RULE_SCORE • Verified positions & student governance
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[#16834a] dark:text-emerald-400 block">
                    35.00 / 35.00
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Earned / Max</span>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-[#131e2e] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Community Service and Extension
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Rule: CRIT_COMMUNITY_RULE_SCORE • Outreach & civic engagements
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                    {parseFloat(rawScore) > 35 ? (parseFloat(rawScore) - 35).toFixed(2) : '0.00'} / 35.00
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Earned / Max</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Non-Computable Official Criteria */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
              <Info className="w-4 h-4 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider">
                Not Automatically Evaluated (Panel / Institutional Requirement)
              </span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-400/90 font-medium">
              Official criteria such as Panel Interview Evaluation, Scholastic Transcripts, and Moral Character Endorsements are not scored automatically by the system and do not reduce the maximum computable portfolio denominator.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold hover:opacity-90 transition shadow-xs"
          >
            Close Evaluation Summary
          </button>
        </div>

      </div>
    </div>
  )
}
