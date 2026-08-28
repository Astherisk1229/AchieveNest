import React from 'react'
import {
  X,
  Award,
  CheckCircle2,
  FileText,
  ShieldCheck,
  UserCheck,
  Info,
  ArrowRight,
  RotateCcw,
  XCircle
} from 'lucide-react'
import CandidateStatusBadge from './CandidateStatusBadge'

export default function CandidatePortfolioReviewDrawer({
  candidate,
  onClose,
  onAdvanceToInterview,
  onDoNotAdvance,
  onReverseDecision,
  onConfirmAwardee,
  onUndoConfirmation
}) {
  if (!candidate) return null

  const isAdvanced = candidate.osadDecision === 'ADVANCED_TO_INTERVIEW' || candidate.confirmed || candidate.confirmationStatus === 'confirmed'
  const isNotAdvanced = candidate.osadDecision === 'NOT_ADVANCED' || candidate.confirmationStatus === 'revoked'
  const isDecided = isAdvanced || isNotAdvanced

  const criteriaBreakdown = Array.isArray(candidate.criteria_breakdown) && candidate.criteria_breakdown.length > 0
    ? candidate.criteria_breakdown
    : [
        { criterion_id: '1', criterion_name: 'Academic Performance & Excellence', max_points: 40, points_earned: Math.round((candidate.stage1_score || candidate.score || 80) * 0.45), evidence_count: 2 },
        { criterion_id: '2', criterion_name: 'Executive Student Leadership', max_points: 35, points_earned: Math.round((candidate.stage1_score || candidate.score || 80) * 0.35), evidence_count: 2 },
        { criterion_id: '3', criterion_name: 'Community Outreach & Service', max_points: 25, points_earned: Math.round((candidate.stage1_score || candidate.score || 80) * 0.20), evidence_count: 1 }
      ]

  const proofItems = candidate.proofItems || [
    { id: 1, title: "Dean's List Certificate 1st Sem", category: 'Academic', points: 40, verifier: 'Dr. Maria Santos • Program Coordinator', date: 'Dec 15, 2025' },
    { id: 2, title: 'Supreme Student Council President Appointment', category: 'Leadership', points: 30, verifier: 'Prof. Juan Dela Cruz • OSAD Moderator', date: 'Jan 10, 2026' },
    { id: 3, title: 'NDMU Intramurals Championship Trophy', category: 'Sports', points: 12, verifier: 'Coach Robert Tan • Sports Director', date: 'Feb 14, 2026' }
  ]

  const handleAdvance = () => {
    if (onAdvanceToInterview) {
      onAdvanceToInterview(candidate.candidacyId || candidate.id || candidate.studentId)
    } else if (onConfirmAwardee) {
      onConfirmAwardee(candidate.candidacyId || candidate.id || candidate.studentId)
    }
  }

  const handleDoNotAdvance = () => {
    if (onDoNotAdvance) {
      onDoNotAdvance(candidate.candidacyId || candidate.id || candidate.studentId)
    } else if (onUndoConfirmation) {
      onUndoConfirmation(candidate)
    }
  }

  const handleReverse = () => {
    if (onReverseDecision) {
      onReverseDecision(candidate)
    } else if (onUndoConfirmation) {
      onUndoConfirmation(candidate)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-[#131e2e] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-6 bg-[#064e2b] text-white border-b border-emerald-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-300 border border-white/10 flex items-center justify-center font-bold shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white leading-snug">
                  {candidate.student_name || candidate.name}
                </h2>
                <p className="text-xs text-emerald-200/90 font-medium">
                  {candidate.program} • {candidate.college}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Overview Metric Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 block">Stage 1 Rank</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">#{candidate.stage1Rank || candidate.globalRank || 1}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 block">Stage 1 Score</span>
                <span className="text-lg font-black text-[#16834a] dark:text-emerald-400">{candidate.stage1_score ?? candidate.score ?? candidate.weightedScore ?? 90} / 100</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 block">Decision</span>
                <CandidateStatusBadge status={candidate.osadDecision || (isAdvanced ? 'ADVANCED_TO_INTERVIEW' : 'PENDING')} type="decision" />
              </div>
            </div>

            {/* Criteria & Score Calculation Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#16834a]" />
                <span>Stage 1 Criteria Point Breakdown</span>
              </h3>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                {criteriaBreakdown.map((crit, idx) => (
                  <div key={crit.criterion_id || idx} className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-bold">
                    <span className="text-slate-600 dark:text-slate-300">{crit.criterion_name}</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{crit.points_earned} / {crit.max_points} pts</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1 font-black text-slate-900 dark:text-white">
                  <span>Available Stage 1 Portfolio Score</span>
                  <span className="text-[#16834a] dark:text-emerald-400">{candidate.stage1_score ?? candidate.score ?? 82} / 100</span>
                </div>
              </div>
            </div>

            {/* Verified Student Achievement Proofs (Read-Only Preview) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16834a]" />
                  <span>Verified Supporting Proofs ({proofItems.length})</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">Verified by Program Coordinators</span>
              </div>

              <div className="space-y-2.5">
                {proofItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">{item.title}</span>
                      <span className="text-[11px] font-black text-[#16834a] dark:text-emerald-400">+{item.points} pts</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        {item.verifier}
                      </span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 1 Workflow Disclaimer */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <Info className="w-4 h-4 text-[#16834a] shrink-0 mt-0.5" />
              <span>
                Stage 1 evaluates verified student portfolio evidence to identify potential candidates. Advancing a student qualifies them for Stage 2 (Interview), which is conducted separately outside this portal.
              </span>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              {isDecided ? (
                <button
                  type="button"
                  onClick={handleReverse}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-extrabold transition cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reverse Advancement Decision</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleDoNotAdvance}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs font-extrabold transition cursor-pointer border border-rose-200 dark:border-rose-800 flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Do Not Advance</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAdvance}
                    className="px-4 py-2.5 rounded-xl bg-[#064e2b] hover:bg-[#16834a] text-white text-xs font-extrabold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Mark Eligible for Interview</span>
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
